// backend/src/database/migrations/20241201000003-create-subscriptions.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subscriptions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      paypal_subscription_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      paypal_plan_id: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      plan_name: {
        type: Sequelize.ENUM('free', 'starter', 'professional', 'enterprise', 'custom'),
        allowNull: false,
        defaultValue: 'free'
      },
      plan_type: {
        type: Sequelize.ENUM('monthly', 'yearly', 'one_time', 'custom'),
        allowNull: false,
        defaultValue: 'monthly'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD'
      },
      billing_cycle: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      trial_days: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('trialing', 'active', 'past_due', 'cancelled', 'suspended', 'expired'),
        allowNull: false,
        defaultValue: 'trialing'
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      trial_ends_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      current_period_start: {
        type: Sequelize.DATE,
        allowNull: true
      },
      current_period_end: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      ends_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      limits: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      features: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      addons: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      next_billing_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_payment_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      failed_payment_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      paypal_webhook_data: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      cancel_at_period_end: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      cancellation_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      cancelled_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      pending_changes: {
        type: Sequelize.JSONB,
        defaultValue: null
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
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
    await queryInterface.addIndex('subscriptions', ['client_id']);
    await queryInterface.addIndex('subscriptions', ['paypal_subscription_id'], { 
      unique: true,
      where: {
        paypal_subscription_id: {
          [Sequelize.Op.ne]: null
        }
      }
    });
    await queryInterface.addIndex('subscriptions', ['status']);
    await queryInterface.addIndex('subscriptions', ['plan_name']);
    await queryInterface.addIndex('subscriptions', ['next_billing_date']);
    await queryInterface.addIndex('subscriptions', ['ends_at']);
    await queryInterface.addIndex('subscriptions', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('subscriptions');
  }
};