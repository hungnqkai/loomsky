// backend/src/database/migrations/20241201000004-create-payments.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
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
      subscription_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'subscriptions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      paypal_order_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      paypal_payment_id: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      paypal_payer_id: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD'
      },
      fee_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      net_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('subscription', 'one_time', 'upgrade', 'addon', 'refund', 'chargeback'),
        allowNull: false,
        defaultValue: 'subscription'
      },
      payment_method: {
        type: Sequelize.ENUM('paypal', 'credit_card', 'bank_transfer', 'other'),
        allowNull: false,
        defaultValue: 'paypal'
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'),
        allowNull: false,
        defaultValue: 'pending'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      invoice_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
      },
      billing_period_start: {
        type: Sequelize.DATE,
        allowNull: true
      },
      billing_period_end: {
        type: Sequelize.DATE,
        allowNull: true
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      failed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      refunded_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      failure_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      failure_code: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      retry_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      refund_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      refund_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      refunded_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      paypal_response: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      webhook_data: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      tax_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      tax_rate: {
        type: Sequelize.DECIMAL(5, 4),
        defaultValue: 0.0000
      },
      customer_info: {
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
    await queryInterface.addIndex('payments', ['client_id']);
    await queryInterface.addIndex('payments', ['subscription_id']);
    await queryInterface.addIndex('payments', ['paypal_order_id'], { 
      unique: true,
      where: {
        paypal_order_id: {
          [Sequelize.Op.ne]: null
        }
      }
    });
    await queryInterface.addIndex('payments', ['status']);
    await queryInterface.addIndex('payments', ['type']);
    await queryInterface.addIndex('payments', ['payment_method']);
    await queryInterface.addIndex('payments', ['processed_at']);
    await queryInterface.addIndex('payments', ['created_at']);
    await queryInterface.addIndex('payments', ['invoice_number'], { 
      unique: true,
      where: {
        invoice_number: {
          [Sequelize.Op.ne]: null
        }
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  }
};

