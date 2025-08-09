const { EventTrigger, Pixel, Website, User } = require('../models');
const { Op } = require('sequelize');
const Joi = require('joi');

// Validation schemas
const createTriggerSchema = Joi.object({
  event_name: Joi.string().min(1).max(100).required(),
  trigger_type: Joi.string().valid('url_match', 'click_element').required(),
  
  // URL trigger fields (required if trigger_type is url_match)
  url_pattern: Joi.when('trigger_type', {
    is: 'url_match',
    then: Joi.string().required(),
    otherwise: Joi.forbidden()
  }),
  url_match_type: Joi.when('trigger_type', {
    is: 'url_match', 
    then: Joi.string().valid('contains', 'equals', 'starts_with', 'ends_with', 'regex').required(),
    otherwise: Joi.forbidden()
  }),
  
  // Click trigger fields (required if trigger_type is click_element)
  selector: Joi.when('trigger_type', {
    is: 'click_element',
    then: Joi.string().required(),
    otherwise: Joi.forbidden()
  }),
  element_text: Joi.when('trigger_type', {
    is: 'click_element',
    then: Joi.string().allow(''),
    otherwise: Joi.forbidden()
  }),
  
  // Optional fields
  enabled: Joi.boolean().default(true),
  priority: Joi.number().integer().min(0).default(0)
});

const updateTriggerSchema = Joi.object({
  event_name: Joi.string().min(1).max(100),
  enabled: Joi.boolean(),
  priority: Joi.number().integer().min(0),
  
  // URL trigger fields
  url_pattern: Joi.when('trigger_type', {
    is: 'url_match',
    then: Joi.string().required(),
    otherwise: Joi.forbidden()
  }),
  url_match_type: Joi.when('trigger_type', {
    is: 'url_match',
    then: Joi.string().valid('contains', 'equals', 'starts_with', 'ends_with', 'regex').required(),
    otherwise: Joi.forbidden()
  }),
  
  // Click trigger fields  
  selector: Joi.when('trigger_type', {
    is: 'click_element',
    then: Joi.string().required(),
    otherwise: Joi.forbidden()
  }),
  element_text: Joi.when('trigger_type', {
    is: 'click_element',
    then: Joi.string().allow(''),
    otherwise: Joi.forbidden()
  })
}).min(1);

const bulkToggleSchema = Joi.object({
  trigger_ids: Joi.array().items(Joi.string().uuid()).required(),
  enabled: Joi.boolean().required()
});

// GET /api/v1/websites/:websiteId/pixels/:pixelId/triggers
const getTriggersForWebsitePixel = async (req, res) => {
  try {
    const { websiteId, pixelId } = req.params;
    const { page = 1, limit = 50, enabled, trigger_type } = req.query;
    
    // Verify pixel belongs to website and user has access
    const pixel = await Pixel.findOne({
      where: { 
        id: pixelId,
        website_id: websiteId
      }
    });
    
    if (!pixel) {
      return res.status(404).json({
        success: false,
        error: 'Pixel not found or does not belong to this website'
      });
    }

    // Build where conditions
    const whereConditions = {
      website_id: websiteId,
      pixel_id: pixelId
    };
    
    if (enabled !== undefined) {
      whereConditions.enabled = enabled === 'true';
    }
    
    if (trigger_type) {
      whereConditions.trigger_type = trigger_type;
    }

    // Get triggers with pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows: triggers } = await EventTrigger.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Pixel,
          as: 'pixel',
          attributes: ['id', 'pixel_id', 'website_id']
        },
        {
          model: Website,
          as: 'website', 
          attributes: ['id', 'domain', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['priority', 'DESC'], ['created_at', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        triggers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error getting triggers for website-pixel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get triggers'
    });
  }
};

// GET /api/v1/pixels/:pixelId/triggers (for SDK config)
const getTriggersForPixel = async (req, res) => {
  try {
    const { pixelId } = req.params;
    const { enabled = true } = req.query;

    // Verify pixel exists and user has access
    const pixel = await Pixel.findByPk(pixelId);
    if (!pixel) {
      return res.status(404).json({
        success: false,
        error: 'Pixel not found'
      });
    }

    const whereConditions = {
      pixel_id: pixelId
    };
    
    if (enabled !== undefined) {
      whereConditions.enabled = enabled === 'true';
    }

    const triggers = await EventTrigger.findAll({
      where: whereConditions,
      include: [
        {
          model: Website,
          as: 'website',
          attributes: ['id', 'name', 'domain']
        }
      ],
      order: [['priority', 'DESC'], ['created_at', 'ASC']]
    });

    // Group triggers by type for SDK efficiency
    const groupedTriggers = {
      url_triggers: triggers.filter(t => t.trigger_type === 'url_match'),
      click_triggers: triggers.filter(t => t.trigger_type === 'click_element')
    };

    res.json({
      success: true,
      data: groupedTriggers
    });
  } catch (error) {
    console.error('Error getting triggers for pixel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pixel triggers'
    });
  }
};

// POST /api/v1/websites/:websiteId/pixels/:pixelId/triggers
const createTrigger = async (req, res) => {
  try {
    const { websiteId, pixelId } = req.params;
    const userId = req.user.id;

    // Validate input
    const { error, value } = createTriggerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Verify pixel belongs to website and user has access
    const pixel = await Pixel.findOne({
      where: { 
        id: pixelId,
        website_id: websiteId
      }
    });
    
    if (!pixel) {
      return res.status(404).json({
        success: false,
        error: 'Pixel not found or does not belong to this website'
      });
    }

    // Create trigger
    const triggerData = {
      ...value,
      pixel_id: pixelId,
      website_id: websiteId,
      created_by: userId
    };

    const trigger = await EventTrigger.create(triggerData);

    // Get created trigger with associations
    const createdTrigger = await EventTrigger.findByPk(trigger.id, {
      include: [
        {
          model: Pixel,
          as: 'pixel',
          attributes: ['id', 'pixel_id', 'website_id']
        },
        {
          model: Website,
          as: 'website',
          attributes: ['id', 'name', 'domain']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdTrigger
    });
  } catch (error) {
    console.error('Error creating trigger:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: 'A trigger with the same configuration already exists'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: error.errors.map(e => e.message).join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create trigger'
    });
  }
};

// PUT /api/v1/websites/:websiteId/pixels/:pixelId/triggers/:id
const updateTrigger = async (req, res) => {
  try {
    const { websiteId, pixelId, id } = req.params;

    // Validate input
    const { error, value } = updateTriggerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Find trigger
    const trigger = await EventTrigger.findOne({
      where: {
        id,
        website_id: websiteId,
        pixel_id: pixelId
      }
    });

    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: 'Trigger not found'
      });
    }

    // Update trigger
    await trigger.update(value);

    // Get updated trigger with associations
    const updatedTrigger = await EventTrigger.findByPk(trigger.id, {
      include: [
        {
          model: Pixel,
          as: 'pixel',
          attributes: ['id', 'pixel_id', 'website_id']
        },
        {
          model: Website,
          as: 'website',
          attributes: ['id', 'name', 'domain']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedTrigger
    });
  } catch (error) {
    console.error('Error updating trigger:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: 'A trigger with the same configuration already exists'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: error.errors.map(e => e.message).join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update trigger'
    });
  }
};

// DELETE /api/v1/websites/:websiteId/pixels/:pixelId/triggers/:id
const deleteTrigger = async (req, res) => {
  try {
    const { websiteId, pixelId, id } = req.params;

    const trigger = await EventTrigger.findOne({
      where: {
        id,
        website_id: websiteId,
        pixel_id: pixelId
      }
    });

    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: 'Trigger not found'
      });
    }

    await trigger.destroy();

    res.json({
      success: true,
      message: 'Trigger deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting trigger:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete trigger'
    });
  }
};

// POST /api/v1/websites/:websiteId/pixels/:pixelId/triggers/bulk-toggle
const bulkToggleTriggers = async (req, res) => {
  try {
    const { websiteId, pixelId } = req.params;

    // Validate input
    const { error, value } = bulkToggleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { trigger_ids, enabled } = value;

    // Update triggers
    const [updatedCount] = await EventTrigger.update(
      { enabled },
      {
        where: {
          id: { [Op.in]: trigger_ids },
          website_id: websiteId,
          pixel_id: pixelId
        }
      }
    );

    res.json({
      success: true,
      data: {
        updated_count: updatedCount,
        enabled
      }
    });
  } catch (error) {
    console.error('Error bulk toggling triggers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk toggle triggers'
    });
  }
};

module.exports = {
  getTriggersForWebsitePixel,
  getTriggersForPixel,
  createTrigger,
  updateTrigger,
  deleteTrigger,
  bulkToggleTriggers
};