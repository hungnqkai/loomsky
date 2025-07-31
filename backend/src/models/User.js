// backend/src/models/User.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
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
    
    // Authentication
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        len: [5, 255]
      }
    },
    
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [8, 255]
      }
    },
    
    // Profile Information
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    
    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    
    job_title: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    // Role and Permissions
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'member', 'viewer'),
      defaultValue: 'member',
      allowNull: false
    },
    
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: {
        dashboard: ['read'],
        analytics: ['read'],
        journey: ['read'],
        abtest: ['read'],
        integrations: ['read'],
        settings: ['read'],
        team: ['read'],
        billing: ['read']
      }
    },
    
    // Account Status
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending', 'suspended'),
      defaultValue: 'pending',
      allowNull: false
    },
    
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    email_verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    
    email_verification_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Password Reset
    password_reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // User Preferences
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          browser: true,
          weekly_reports: true,
          ab_test_results: true,
          system_alerts: true
        },
        dashboard: {
          default_date_range: '7d',
          show_tour: true,
          collapsed_sidebar: false
        }
      }
    },
    
    // Activity Tracking
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    last_login_ip: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    
    login_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    last_activity_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Two-Factor Authentication
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    two_factor_secret: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    
    two_factor_backup_codes: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    
    // Invitation (for team members)
    invited_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    invitation_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    
    invitation_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    accepted_invitation_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    underscored: true,
    
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['client_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['role']
      },
      {
        fields: ['email_verification_token']
      },
      {
        fields: ['password_reset_token']
      },
      {
        fields: ['invitation_token']
      },
      {
        fields: ['last_login_at']
      }
    ],
    
    hooks: {
      beforeCreate: async (user) => {
        // Hash password
        if (user.password) {
          user.password = await bcrypt.hash(user.password, config.security.bcryptSaltRounds);
        }
        
        // Generate email verification token
        if (!user.email_verified) {
          user.email_verification_token = require('crypto').randomBytes(32).toString('hex');
          user.email_verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        }
      },
      
      beforeUpdate: async (user) => {
        // Hash password if changed
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, config.security.bcryptSaltRounds);
        }
        
        // Update last activity
        user.last_activity_at = new Date();
      }
    },
    
    defaultScope: {
      attributes: {
        exclude: ['password', 'password_reset_token', 'email_verification_token', 'two_factor_secret']
      }
    },
    
    scopes: {
      withPassword: {
        attributes: {}
      },
      active: {
        where: {
          status: 'active'
        }
      },
      verified: {
        where: {
          email_verified: true
        }
      }
    }
  });

  User.associate = (models) => {
    // User belongs to client
    User.belongsTo(models.Client, {
      foreignKey: 'client_id',
      as: 'client'
    });
    
    // User has many sessions
    User.hasMany(models.UserSession, {
      foreignKey: 'user_id',
      as: 'sessions'
    });
    
    // Self-referencing for invitations
    User.belongsTo(models.User, {
      foreignKey: 'invited_by',
      as: 'inviter'
    });
    
    User.hasMany(models.User, {
      foreignKey: 'invited_by',
      as: 'invitees'
    });
  };

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  User.prototype.generateAccessToken = function() {
    return jwt.sign(
      {
        id: this.id,
        email: this.email,
        clientId: this.client_id,
        role: this.role
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expire }
    );
  };

  User.prototype.generateRefreshToken = function() {
    return jwt.sign(
      {
        id: this.id,
        type: 'refresh'
      },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpire }
    );
  };

  User.prototype.generatePasswordResetToken = function() {
    const token = require('crypto').randomBytes(32).toString('hex');
    this.password_reset_token = token;
    this.password_reset_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    return token;
  };

  User.prototype.generateInvitationToken = function() {
    const token = require('crypto').randomBytes(32).toString('hex');
    this.invitation_token = token;
    this.invitation_expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    return token;
  };

  User.prototype.hasPermission = function(resource, action) {
    if (this.role === 'owner') return true;
    
    const resourcePermissions = this.permissions[resource];
    if (!resourcePermissions) return false;
    
    return resourcePermissions.includes(action) || resourcePermissions.includes('*');
  };

  User.prototype.getFullName = function() {
    return `${this.first_name} ${this.last_name}`.trim();
  };

  User.prototype.toJSON = function() {
    const values = { ...this.dataValues };
    
    // Remove sensitive fields
    delete values.password;
    delete values.password_reset_token;
    delete values.email_verification_token;
    delete values.two_factor_secret;
    delete values.two_factor_backup_codes;
    
    // Add computed fields
    values.full_name = this.getFullName();
    
    return values;
  };

  // Class methods
  User.findByEmail = function(email) {
    return this.scope('withPassword').findOne({
      where: { email: email.toLowerCase() }
    });
  };

  User.findByResetToken = function(token) {
    return this.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: {
          [sequelize.Sequelize.Op.gt]: new Date()
        }
      }
    });
  };

  User.findByInvitationToken = function(token) {
    return this.findOne({
      where: {
        invitation_token: token,
        invitation_expires: {
          [sequelize.Sequelize.Op.gt]: new Date()
        }
      }
    });
  };

  return User;
};