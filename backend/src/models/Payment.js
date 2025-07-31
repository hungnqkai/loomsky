// backend/src/models/Payment.js
module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Foreign Keys
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id'
      }
    },
    
    subscription_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'subscriptions',
        key: 'id'
      }
    },
    
    // PayPal Transaction Details
    paypal_order_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    
    paypal_payment_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    paypal_payer_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    // Payment Information
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
      validate: {
        isIn: [['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']]
      }
    },
    
    // Fee Information
    fee_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    
    net_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    
    // Payment Type
    type: {
      type: DataTypes.ENUM(
        'subscription',
        'one_time',
        'upgrade',
        'addon',
        'refund',
        'chargeback'
      ),
      allowNull: false,
      defaultValue: 'subscription'
    },
    
    // Payment Method
    payment_method: {
      type: DataTypes.ENUM('paypal', 'credit_card', 'bank_transfer', 'other'),
      allowNull: false,
      defaultValue: 'paypal'
    },
    
    // Status
    status: {
      type: DataTypes.ENUM(
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled',
        'refunded',
        'partially_refunded'
      ),
      allowNull: false,
      defaultValue: 'pending'
    },
    
    // Transaction Details
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    invoice_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    
    // Billing Period (for subscriptions)
    billing_period_start: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    billing_period_end: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Important Dates
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    failed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Failure Information
    failure_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    failure_code: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    retry_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    // Refund Information
    refund_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    
    refund_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    refunded_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    // PayPal Response Data
    paypal_response: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Complete PayPal API response for debugging'
    },
    
    // Webhook Data
    webhook_data: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'PayPal webhook notification data'
    },
    
    // Additional Metadata
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional payment information'
    },
    
    // Tax Information
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    
    tax_rate: {
      type: DataTypes.DECIMAL(5, 4),
      defaultValue: 0.0000,
      comment: 'Tax rate as decimal (e.g., 0.0825 for 8.25%)'
    },
    
    // Customer Information (for invoicing)
    customer_info: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Customer billing information at time of payment'
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    paranoid: true,
    underscored: true,
    
    indexes: [
      {
        fields: ['client_id']
      },
      {
        fields: ['subscription_id']
      },
      {
        unique: true,
        fields: ['paypal_order_id'],
        where: {
          paypal_order_id: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      {
        fields: ['status']
      },
      {
        fields: ['type']
      },
      {
        fields: ['payment_method']
      },
      {
        fields: ['processed_at']
      },
      {
        fields: ['created_at']
      },
      {
        unique: true,
        fields: ['invoice_number'],
        where: {
          invoice_number: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      }
    ],
    
    hooks: {
      beforeCreate: (payment) => {
        // Generate invoice number if not provided
        if (!payment.invoice_number) {
          const timestamp = Date.now().toString();
          const random = Math.random().toString(36).substring(2, 8).toUpperCase();
          payment.invoice_number = `INV-${timestamp}-${random}`;
        }
        
        // Calculate net amount if not provided
        if (!payment.net_amount) {
          payment.net_amount = payment.amount - (payment.fee_amount || 0);
        }
        
        // Set processed_at for completed payments
        if (payment.status === 'completed' && !payment.processed_at) {
          payment.processed_at = new Date();
        }
      },
      
      beforeUpdate: (payment) => {
        // Update processed_at when status changes to completed
        if (payment.changed('status') && payment.status === 'completed' && !payment.processed_at) {
          payment.processed_at = new Date();
        }
        
        // Update failed_at when status changes to failed
        if (payment.changed('status') && payment.status === 'failed' && !payment.failed_at) {
          payment.failed_at = new Date();
        }
        
        // Update refunded_at when status changes to refunded
        if (payment.changed('status') && payment.status.includes('refunded') && !payment.refunded_at) {
          payment.refunded_at = new Date();
        }
      }
    }
  });

  Payment.associate = (models) => {
    // Payment belongs to client
    Payment.belongsTo(models.Client, {
      foreignKey: 'client_id',
      as: 'client'
    });
    
    // Payment belongs to subscription (optional)
    Payment.belongsTo(models.Subscription, {
      foreignKey: 'subscription_id',
      as: 'subscription'
    });
    
    // Refunded by user
    Payment.belongsTo(models.User, {
      foreignKey: 'refunded_by',
      as: 'refundedByUser'
    });
  };

  // Instance methods
  Payment.prototype.isCompleted = function() {
    return this.status === 'completed';
  };

  Payment.prototype.isFailed = function() {
    return this.status === 'failed';
  };

  Payment.prototype.isRefunded = function() {
    return this.status === 'refunded' || this.status === 'partially_refunded';
  };

  Payment.prototype.canBeRefunded = function() {
    return this.status === 'completed' && this.refund_amount < this.amount;
  };

  Payment.prototype.getRemainingRefundAmount = function() {
    if (!this.canBeRefunded()) return 0;
    return parseFloat(this.amount) - parseFloat(this.refund_amount);
  };

  Payment.prototype.processRefund = async function(amount, reason, refundedBy) {
    const remainingAmount = this.getRemainingRefundAmount();
    const refundAmount = Math.min(amount, remainingAmount);
    
    this.refund_amount = parseFloat(this.refund_amount) + refundAmount;
    this.refund_reason = reason;
    this.refunded_by = refundedBy;
    this.refunded_at = new Date();
    
    // Update status
    if (this.refund_amount >= this.amount) {
      this.status = 'refunded';
    } else {
      this.status = 'partially_refunded';
    }
    
    await this.save();
    return refundAmount;
  };

  Payment.prototype.markAsFailed = async function(reason, code = null) {
    this.status = 'failed';
    this.failure_reason = reason;
    this.failure_code = code;
    this.failed_at = new Date();
    this.retry_count += 1;
    
    await this.save();
  };

  Payment.prototype.markAsCompleted = async function(paypalResponse = {}) {
    this.status = 'completed';
    this.processed_at = new Date();
    this.paypal_response = { ...this.paypal_response, ...paypalResponse };
    
    await this.save();
  };

  // Class methods
  Payment.findByPaypalOrderId = function(orderId) {
    return this.findOne({
      where: { paypal_order_id: orderId }
    });
  };

  Payment.getRevenueForPeriod = async function(clientId, startDate, endDate) {
    const { Op } = sequelize.Sequelize;
    
    const result = await this.findAll({
      where: {
        client_id: clientId,
        status: 'completed',
        processed_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'total_revenue'],
        [sequelize.fn('SUM', sequelize.col('fee_amount')), 'total_fees'],
        [sequelize.fn('SUM', sequelize.col('net_amount')), 'net_revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'transaction_count']
      ],
      raw: true
    });
    
    return result[0] || {
      total_revenue: 0,
      total_fees: 0,
      net_revenue: 0,
      transaction_count: 0
    };
  };

  Payment.getFailedPayments = function(days = 7) {
    const { Op } = sequelize.Sequelize;
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - days);
    
    return this.findAll({
      where: {
        status: 'failed',
        failed_at: {
          [Op.gte]: pastDate
        }
      },
      include: [{
        model: sequelize.models.Client,
        as: 'client'
      }, {
        model: sequelize.models.Subscription,
        as: 'subscription'
      }],
      order: [['failed_at', 'DESC']]
    });
  };

  return Payment;
};