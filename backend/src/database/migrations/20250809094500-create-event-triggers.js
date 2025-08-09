'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('EventTriggers', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      pixel_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Pixels',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      website_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Websites',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      event_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Standard event name (AddToCart, ViewContent, etc.)'
      },
      trigger_type: {
        type: Sequelize.ENUM('url_match', 'click_element'),
        allowNull: false,
        comment: 'Type of trigger: URL pattern match or element click'
      },
      
      // URL trigger fields
      url_pattern: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'URL pattern for url_match triggers'
      },
      url_match_type: {
        type: Sequelize.ENUM('contains', 'equals', 'starts_with', 'ends_with', 'regex'),
        allowNull: true,
        comment: 'How to match URL pattern'
      },
      
      // Click trigger fields  
      selector: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'CSS selector for click_element triggers'
      },
      element_text: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Expected text content of element'
      },
      
      // Status & Management
      enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Whether trigger is active'
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Priority when multiple triggers match same element'
      },
      fire_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Number of times this trigger has fired'
      },
      last_fired: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Last time this trigger fired'
      },
      
      // Audit Trail
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for performance
    await queryInterface.addIndex('EventTriggers', ['pixel_id', 'enabled'], {
      name: 'idx_event_triggers_pixel_enabled'
    });
    
    await queryInterface.addIndex('EventTriggers', ['website_id', 'enabled'], {
      name: 'idx_event_triggers_website_enabled'
    });
    
    await queryInterface.addIndex('EventTriggers', ['pixel_id', 'website_id'], {
      name: 'idx_event_triggers_pixel_website'
    });
    
    // Create composite unique constraint to prevent duplicate triggers
    await queryInterface.addIndex('EventTriggers', 
      ['pixel_id', 'website_id', 'trigger_type', 'url_pattern'], 
      {
        name: 'idx_event_triggers_unique_url',
        unique: true,
        where: {
          trigger_type: 'url_match',
          url_pattern: {
            [Sequelize.Op.ne]: null
          }
        }
      }
    );
    
    await queryInterface.addIndex('EventTriggers', 
      ['pixel_id', 'website_id', 'trigger_type', 'selector'], 
      {
        name: 'idx_event_triggers_unique_selector', 
        unique: true,
        where: {
          trigger_type: 'click_element',
          selector: {
            [Sequelize.Op.ne]: null
          }
        }
      }
    );
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('EventTriggers', 'idx_event_triggers_unique_selector');
    await queryInterface.removeIndex('EventTriggers', 'idx_event_triggers_unique_url');
    await queryInterface.removeIndex('EventTriggers', 'idx_event_triggers_pixel_website');
    await queryInterface.removeIndex('EventTriggers', 'idx_event_triggers_website_enabled');
    await queryInterface.removeIndex('EventTriggers', 'idx_event_triggers_pixel_enabled');
    
    // Drop table
    await queryInterface.dropTable('EventTriggers');
  }
};