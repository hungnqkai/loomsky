// backend/src/database/migrations/20241201000001-create-clients.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clients', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      domain: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      logo_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      industry: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      company_size: {
        type: Sequelize.ENUM('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'),
        allowNull: true
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      integration_keys: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      status: {
        type: Sequelize.ENUM('active', 'suspended', 'cancelled', 'trial'),
        defaultValue: 'trial',
        allowNull: false
      },
      trial_ends_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      limits: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      current_usage: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      onboarding_completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      onboarding_step: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      last_activity_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      billing_email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      tax_id: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('clients', ['slug'], { unique: true });
    await queryInterface.addIndex('clients', ['status']);
    await queryInterface.addIndex('clients', ['email']);
    await queryInterface.addIndex('clients', ['created_at']);
    await queryInterface.addIndex('clients', ['last_activity_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('clients');
  }
};

