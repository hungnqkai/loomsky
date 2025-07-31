// backend/src/models/Client.js
module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Basic Information
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    
    slug: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        isLowercase: true,
        len: [3, 50]
      }
    },
    
    domain: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    
    logo_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Contact Information
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    
    // Address
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    country: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    postal_code: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    
    // Business Information
    industry: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    company_size: {
      type: DataTypes.ENUM('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'),
      allowNull: true
    },
    
    // Platform Settings
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        timezone: 'UTC',
        currency: 'USD',
        language: 'en',
        date_format: 'YYYY-MM-DD',
        analytics: {
          data_retention_days: 365,
          session_timeout_minutes: 30,
          track_anonymous_users: true
        },
        notifications: {
          email_reports: true,
          webhook_alerts: false,
          weekly_summary: true
        },
        privacy: {
          anonymize_ip: false,
          gdpr_compliant: false,
          cookie_consent: false
        }
      }
    },
    
    // Integration Keys (encrypted)
    integration_keys: {
      type: DataTypes.JSONB,
      defaultValue: {},
      validate: {
        isValidKeys(value) {
          // Basic validation for integration keys structure
          if (typeof value !== 'object') {
            throw new Error('Integration keys must be an object');
          }
        }
      }
    },
    
    // Status and Limits
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'cancelled', 'trial'),
      defaultValue: 'trial',
      allowNull: false
    },
    
    trial_ends_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Usage Limits
    limits: {
      type: DataTypes.JSONB,
      defaultValue: {
        monthly_events: 10000,
        team_members: 3,
        projects: 1,
        ab_tests: 5,
        api_calls_per_hour: 1000
      }
    },
    
    // Usage Tracking
    current_usage: {
      type: DataTypes.JSONB,
      defaultValue: {
        monthly_events: 0,
        team_members: 1,
        projects: 0,
        ab_tests: 0,
        api_calls_this_hour: 0
      }
    },
    
    // Metadata
    onboarding_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    onboarding_step: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 10
      }
    },
    
    last_activity_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Billing
    billing_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    
    tax_id: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'clients',
    timestamps: true,
    paranoid: true, // Soft deletes
    underscored: true,
    
    indexes: [
      {
        unique: true,
        fields: ['slug']
      },
      {
        fields: ['status']
      },
      {
        fields: ['email']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['last_activity_at']
      }
    ],
    
    hooks: {
      beforeCreate: async (client) => {
        // Generate slug if not provided
        if (!client.slug && client.name) {
          client.slug = client.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 50);
        }
        
        // Set trial end date
        if (client.status === 'trial' && !client.trial_ends_at) {
          client.trial_ends_at = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
        }
      },
      
      beforeUpdate: (client) => {
        client.last_activity_at = new Date();
      }
    }
  });

  Client.associate = (models) => {
    // Client has many users (team members)
    Client.hasMany(models.User, {
      foreignKey: 'client_id',
      as: 'users'
    });
    
    // Client has many subscriptions
    Client.hasMany(models.Subscription, {
      foreignKey: 'client_id',
      as: 'subscriptions'
    });
    
    // Client has one active subscription
    Client.hasOne(models.Subscription, {
      foreignKey: 'client_id',
      as: 'activeSubscription',
      scope: {
        status: 'active'
      }
    });
    
    // Client has many payments
    Client.hasMany(models.Payment, {
      foreignKey: 'client_id',
      as: 'payments'
    });
  };

  // Instance methods
  Client.prototype.isTrialExpired = function() {
    return this.status === 'trial' && 
           this.trial_ends_at && 
           new Date() > this.trial_ends_at;
  };

  Client.prototype.canCreateProject = function() {
    return this.current_usage.projects < this.limits.projects;
  };

  Client.prototype.canCreateABTest = function() {
    return this.current_usage.ab_tests < this.limits.ab_tests;
  };

  Client.prototype.canAddTeamMember = function() {
    return this.current_usage.team_members < this.limits.team_members;
  };

  Client.prototype.incrementUsage = async function(metric, amount = 1) {
    if (this.current_usage[metric] !== undefined) {
      this.current_usage[metric] += amount;
      this.changed('current_usage', true);
      await this.save();
    }
  };

  Client.prototype.resetMonthlyUsage = async function() {
    this.current_usage.monthly_events = 0;
    this.current_usage.api_calls_this_hour = 0;
    this.changed('current_usage', true);
    await this.save();
  };

  return Client;
};