const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EventTrigger = sequelize.define('EventTrigger', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    pixel_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Pixels',
        key: 'id'
      }
    },
    website_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Websites', 
        key: 'id'
      }
    },
    event_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Event name is required'
        },
        len: {
          args: [1, 100],
          msg: 'Event name must be between 1 and 100 characters'
        }
      }
    },
    trigger_type: {
      type: DataTypes.ENUM('url_match', 'click_element'),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Trigger type is required'
        },
        isIn: {
          args: [['url_match', 'click_element']],
          msg: 'Trigger type must be url_match or click_element'
        }
      }
    },
    
    // URL trigger fields
    url_pattern: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        urlPatternRequired(value) {
          if (this.trigger_type === 'url_match' && !value) {
            throw new Error('URL pattern is required for url_match triggers');
          }
        }
      }
    },
    url_match_type: {
      type: DataTypes.ENUM('contains', 'equals', 'starts_with', 'ends_with', 'regex'),
      allowNull: true,
      validate: {
        urlMatchTypeRequired(value) {
          if (this.trigger_type === 'url_match' && !value) {
            throw new Error('URL match type is required for url_match triggers');
          }
        }
      }
    },
    
    // Click trigger fields
    selector: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        selectorRequired(value) {
          if (this.trigger_type === 'click_element' && !value) {
            throw new Error('CSS selector is required for click_element triggers');
          }
        }
      }
    },
    element_text: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Status & Management
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Priority must be non-negative'
        }
      }
    },
    fire_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Fire count must be non-negative'
        }
      }
    },
    last_fired: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Audit Trail
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'EventTriggers',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['pixel_id', 'enabled']
      },
      {
        fields: ['website_id', 'enabled'] 
      },
      {
        fields: ['pixel_id', 'website_id']
      }
    ],
    hooks: {
      beforeValidate: (trigger, options) => {
        // Clean up fields based on trigger type
        if (trigger.trigger_type === 'url_match') {
          trigger.selector = null;
          trigger.element_text = null;
        } else if (trigger.trigger_type === 'click_element') {
          trigger.url_pattern = null;
          trigger.url_match_type = null;
        }
      }
    }
  });

  // Define associations
  EventTrigger.associate = (models) => {
    // EventTrigger belongs to Pixel
    EventTrigger.belongsTo(models.Pixel, {
      foreignKey: 'pixel_id',
      as: 'pixel'
    });

    // EventTrigger belongs to Website
    EventTrigger.belongsTo(models.Website, {
      foreignKey: 'website_id', 
      as: 'website'
    });

    // EventTrigger belongs to User (creator)
    EventTrigger.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
  };

  // Instance methods
  EventTrigger.prototype.incrementFireCount = function() {
    return this.update({
      fire_count: this.fire_count + 1,
      last_fired: new Date()
    });
  };

  EventTrigger.prototype.isUrlTrigger = function() {
    return this.trigger_type === 'url_match';
  };

  EventTrigger.prototype.isClickTrigger = function() {
    return this.trigger_type === 'click_element';
  };

  // Static methods
  EventTrigger.getTriggersForPixel = async function(pixelId, options = {}) {
    return this.findAll({
      where: {
        pixel_id: pixelId,
        enabled: true,
        ...options.where
      },
      include: [
        {
          model: sequelize.models.Website,
          as: 'website',
          attributes: ['id', 'domain', 'name']
        }
      ],
      order: [['priority', 'DESC'], ['created_at', 'ASC']],
      ...options
    });
  };

  EventTrigger.getTriggersForWebsite = async function(websiteId, pixelId, options = {}) {
    return this.findAll({
      where: {
        website_id: websiteId,
        pixel_id: pixelId,
        enabled: true,
        ...options.where
      },
      include: [
        {
          model: sequelize.models.Pixel,
          as: 'pixel',
          attributes: ['id', 'name', 'pixel_id']
        }
      ],
      order: [['priority', 'DESC'], ['created_at', 'ASC']],
      ...options
    });
  };

  return EventTrigger;
};