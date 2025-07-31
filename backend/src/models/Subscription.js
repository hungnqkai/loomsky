// backend/src/models/Subscription.js
module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Foreign Key
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id'
      }
    },
    
    // PayPal Integration
    paypal_subscription_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    
    paypal_plan_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    // Subscription Details
    plan_name: {
      type: DataTypes.ENUM(
        'free',
        'starter',
        'professional', 
        'enterprise',
        'custom'
      ),
      allowNull: false,
      defaultValue: 'free'
    },
    
    plan_type: {
      type: DataTypes.ENUM('monthly', 'yearly', 'one_time', 'custom'),
      allowNull: false,
      defaultValue: 'monthly'
    },
    
    // Pricing
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
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
    
    // Billing Information
    billing_cycle: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Billing cycle in days (30 for monthly, 365 for yearly)'
    },
    
    trial_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 365
      }
    },
    
    // Status
    status: {
      type: DataTypes.ENUM(
        'trialing',
        'active', 
        'past_due',
        'cancelled',
        'suspended',
        'expired'
      ),
      allowNull: false,
      defaultValue: 'trialing'
    },
    
    // Important Dates
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    trial_ends_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    current_period_start: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    current_period_end: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    ends_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Plan Limits
    limits: {
      type: DataTypes.JSONB,
      defaultValue: {
        monthly_events: 10000,
        team_members: 3,
        projects: 1,
        ab_tests: 5,
        api_calls_per_hour: 1000,
        data_retention_days: 90,
        custom_integrations: false,
        priority_support: false,
        white_label: false
      }
    },
    
    // Features
    features: {
      type: DataTypes.JSONB,
      defaultValue: {
        journey_tracking: true,
        ab_testing: true,
        facebook_capi: true,
        real_time_analytics: true,
        custom_events: true,
        segmentation: false,
        advanced_reporting: false,
        api_access: false,
        webhook_notifications: false,
        sso: false
      }
    },
    
    // Addon Services
    addons: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional paid features/services'
    },
    
    // Payment Information
    next_billing_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    last_payment_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    failed_payment_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    // PayPal Webhook Data
    paypal_webhook_data: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Store PayPal webhook responses for debugging'
    },
    
    // Cancellation
    cancel_at_period_end: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    cancelled_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    // Upgrade/Downgrade
    pending_changes: {
      type: DataTypes.JSONB,
      defaultValue: null,
      comment: 'Store pending plan changes to apply at next billing cycle'
    },
    
    // Metadata
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional subscription metadata'
    }
  }, {
    tableName: 'subscriptions',
    timestamps: true,
    paranoid: true,
    underscored: true,
    
    indexes: [
      {
        fields: ['client_id']
      },
      {
        unique: true,
        fields: ['paypal_subscription_id'],
        where: {
          paypal_subscription_id: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      {
        fields: ['status']
      },
      {
        fields: ['plan_name']
      },
      {
        fields: ['next_billing_date']
      },
      {
        fields: ['ends_at']
      },
      {
        fields: ['created_at']
      }
    ],
    
    hooks: {
      beforeCreate: (subscription) => {
        // Set billing cycle based on plan type
        if (!subscription.billing_cycle) {
          switch (subscription.plan_type) {
            case 'monthly':
              subscription.billing_cycle = 30;
              break;
            case 'yearly':
              subscription.billing_cycle = 365;
              break;
            default:
              subscription.billing_cycle = 30;
          }
        }
        
        // Set trial end date if trial days specified
        if (subscription.trial_days > 0 && !subscription.trial_ends_at) {
          subscription.trial_ends_at = new Date(
            Date.now() + subscription.trial_days * 24 * 60 * 60 * 1000
          );
        }
        
        // Set first billing period
        if (!subscription.current_period_start) {
          const startDate = subscription.trial_ends_at || new Date();
          subscription.current_period_start = startDate;
          subscription.current_period_end = new Date(
            startDate.getTime() + subscription.billing_cycle * 24 * 60 * 60 * 1000
          );
          subscription.next_billing_date = subscription.current_period_end;
        }
      }
    }
  });

  Subscription.associate = (models) => {
    // Subscription belongs to client
    Subscription.belongsTo(models.Client, {
      foreignKey: 'client_id',
      as: 'client'
    });
    
    // Subscription has many payments
    Subscription.hasMany(models.Payment, {
      foreignKey: 'subscription_id',
      as: 'payments'
    });
    
    // Cancelled by user
    Subscription.belongsTo(models.User, {
      foreignKey: 'cancelled_by',
      as: 'cancelledByUser'
    });
  };

  // Instance methods
  Subscription.prototype.isActive = function() {
    return this.status === 'active';
  };

  Subscription.prototype.isTrialing = function() {
    return this.status === 'trialing' && 
           this.trial_ends_at && 
           new Date() < this.trial_ends_at;
  };

  Subscription.prototype.isExpired = function() {
    return this.ends_at && new Date() > this.ends_at;
  };

  Subscription.prototype.daysUntilRenewal = function() {
    if (!this.next_billing_date) return null;
    
    const msPerDay = 24 * 60 * 60 * 1000;
    const diff = this.next_billing_date.getTime() - new Date().getTime();
    return Math.ceil(diff / msPerDay);
  };

  Subscription.prototype.canUseFeature = function(feature) {
    return this.features[feature] === true;
  };

  Subscription.prototype.isWithinLimit = function(limitType, currentUsage) {
    const limit = this.limits[limitType];
    if (limit === undefined || limit === -1) return true; // Unlimited
    return currentUsage < limit;
  };

  Subscription.prototype.cancel = async function(reason = null, cancelledBy = null) {
    this.status = 'cancelled';
    this.cancelled_at = new Date();
    this.cancellation_reason = reason;
    this.cancelled_by = cancelledBy;
    
    // Set end date to current period end if not already set
    if (!this.ends_at) {
      this.ends_at = this.current_period_end || new Date();
    }
    
    await this.save();
  };

  Subscription.prototype.scheduleChange = function(changes) {
    this.pending_changes = {
      ...changes,
      scheduled_at: new Date(),
      effective_date: this.current_period_end
    };
  };

  Subscription.prototype.applyPendingChanges = async function() {
    if (!this.pending_changes) return false;
    
    const changes = this.pending_changes;
    
    // Apply changes
    if (changes.plan_name) this.plan_name = changes.plan_name;
    if (changes.plan_type) this.plan_type = changes.plan_type;
    if (changes.amount) this.amount = changes.amount;
    if (changes.limits) this.limits = { ...this.limits, ...changes.limits };
    if (changes.features) this.features = { ...this.features, ...changes.features };
    
    // Clear pending changes
    this.pending_changes = null;
    
    await this.save();
    return true;
  };

  Subscription.prototype.renewBillingPeriod = async function() {
    const currentEnd = this.current_period_end || new Date();
    const newStart = currentEnd;
    const newEnd = new Date(newStart.getTime() + this.billing_cycle * 24 * 60 * 60 * 1000);
    
    this.current_period_start = newStart;
    this.current_period_end = newEnd;
    this.next_billing_date = newEnd;
    this.failed_payment_attempts = 0;
    
    // Apply any pending changes
    await this.applyPendingChanges();
    
    await this.save();
  };

  // Class methods
  Subscription.getActivePlans = function() {
    return {
      free: {
        name: 'Free',
        amount: 0,
        features: {
          monthly_events: 1000,
          team_members: 1,
          projects: 1,
          ab_tests: 1,
          journey_tracking: true,
          ab_testing: true,
          facebook_capi: false
        }
      },
      starter: {
        name: 'Starter',
        amount: 29,
        features: {
          monthly_events: 10000,
          team_members: 3,
          projects: 3,
          ab_tests: 10,
          journey_tracking: true,
          ab_testing: true,
          facebook_capi: true
        }
      },
      professional: {
        name: 'Professional',
        amount: 99,
        features: {
          monthly_events: 100000,
          team_members: 10,
          projects: 10,
          ab_tests: 50,
          journey_tracking: true,
          ab_testing: true,
          facebook_capi: true,
          advanced_reporting: true,
          api_access: true
        }
      },
      enterprise: {
        name: 'Enterprise',
        amount: 299,
        features: {
          monthly_events: -1, // Unlimited
          team_members: -1,
          projects: -1,
          ab_tests: -1,
          journey_tracking: true,
          ab_testing: true,
          facebook_capi: true,
          advanced_reporting: true,
          api_access: true,
          white_label: true,
          priority_support: true,
          sso: true
        }
      }
    };
  };

  Subscription.findActiveByClient = function(clientId) {
    return this.findOne({
      where: {
        client_id: clientId,
        status: ['active', 'trialing']
      },
      order: [['created_at', 'DESC']]
    });
  };

  Subscription.findExpiringSoon = function(days = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return this.findAll({
      where: {
        status: 'active',
        next_billing_date: {
          [sequelize.Sequelize.Op.lte]: futureDate
        }
      },
      include: [{
        model: sequelize.models.Client,
        as: 'client'
      }]
    });
  };

  return Subscription;
};