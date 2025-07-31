// backend/src/models/UserSession.js
const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  const UserSession = sequelize.define('UserSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Foreign Key
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    // Session Tokens
    refresh_token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true
    },
    
    refresh_token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    
    // Session Information
    device_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Unique identifier for the device/browser'
    },
    
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'Supports both IPv4 and IPv6'
    },
    
    // Device/Platform Information
    platform: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'web, mobile, desktop, api'
    },
    
    browser: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    os: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    device_type: {
      type: DataTypes.ENUM('desktop', 'mobile', 'tablet', 'api', 'unknown'),
      defaultValue: 'unknown'
    },
    
    // Location Information (from IP)
    location: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Country, city, timezone from IP geolocation'
    },
    
    // Session Status
    status: {
      type: DataTypes.ENUM('active', 'expired', 'revoked', 'suspicious'),
      defaultValue: 'active',
      allowNull: false
    },
    
    // Session Timing
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Security
    is_trusted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Mark trusted devices for reduced security checks'
    },
    
    security_flags: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Security-related flags and metadata'
    },
    
    // Session Activity
    activity_count: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Number of times this session was used'
    },
    
    // Revocation Information
    revoked_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    revocation_reason: {
      type: DataTypes.ENUM(
        'user_logout',
        'admin_revoke',
        'security_breach',
        'suspicious_activity',
        'password_change',
        'manual_cleanup'
      ),
      allowNull: true
    },
    
    // Metadata
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional session metadata'
    }
  }, {
    tableName: 'user_sessions',
    timestamps: false, // We handle timestamps manually
    underscored: true,
    
    indexes: [
      {
        fields: ['user_id']
      },
      {
        unique: true,
        fields: ['refresh_token_hash']
      },
      {
        fields: ['status']
      },
      {
        fields: ['expires_at']
      },
      {
        fields: ['device_id']
      },
      {
        fields: ['ip_address']
      },
      {
        fields: ['last_used_at']
      },
      {
        fields: ['created_at']
      }
    ],
    
    hooks: {
      beforeCreate: (session) => {
        // Hash the refresh token for security
        session.refresh_token_hash = crypto
          .createHash('sha256')
          .update(session.refresh_token)
          .digest('hex');
        
        // Set expiration date (default 7 days)
        if (!session.expires_at) {
          session.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
      },
      
      beforeUpdate: (session) => {
        // Update last_used_at when session is accessed
        if (session.changed('activity_count')) {
          session.last_used_at = new Date();
        }
        
        // Set revoked_at when status changes to revoked
        if (session.changed('status') && session.status === 'revoked' && !session.revoked_at) {
          session.revoked_at = new Date();
        }
      }
    }
  });

  UserSession.associate = (models) => {
    // Session belongs to user
    UserSession.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    // Revoked by user (could be admin)
    UserSession.belongsTo(models.User, {
      foreignKey: 'revoked_by',
      as: 'revokedByUser'
    });
  };

  // Instance methods
  UserSession.prototype.isActive = function() {
    return this.status === 'active' && !this.isExpired();
  };

  UserSession.prototype.isExpired = function() {
    return new Date() > this.expires_at;
  };

  UserSession.prototype.updateLastUsed = async function() {
    this.last_used_at = new Date();
    this.activity_count += 1;
    await this.save(['last_used_at', 'activity_count']);
  };

  UserSession.prototype.revoke = async function(reason = 'user_logout', revokedBy = null) {
    this.status = 'revoked';
    this.revoked_at = new Date();
    this.revocation_reason = reason;
    this.revoked_by = revokedBy;
    
    await this.save();
  };

  UserSession.prototype.markSuspicious = async function(reason) {
    this.status = 'suspicious';
    this.security_flags = {
      ...this.security_flags,
      suspicious_activity: true,
      flagged_at: new Date(),
      reason: reason
    };
    
    await this.save();
  };

  UserSession.prototype.getSessionInfo = function() {
    return {
      id: this.id,
      device_type: this.device_type,
      browser: this.browser,
      os: this.os,
      location: this.location,
      ip_address: this.ip_address,
      created_at: this.created_at,
      last_used_at: this.last_used_at,
      is_trusted: this.is_trusted,
      is_current: false // Will be set by calling code
    };
  };

  // Class methods
  UserSession.findByRefreshToken = async function(refreshToken) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    
    return await this.findOne({
      where: {
        refresh_token_hash: tokenHash,
        status: 'active'
      },
      include: [{
        model: sequelize.models.User,
        as: 'user'
      }]
    });
  };

  UserSession.createSession = async function(user, sessionData) {
    const refreshToken = sessionData.refresh_token; 

    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày
    
    return await this.create({
      user_id: user.id,
      refresh_token: refreshToken, // Giờ đây là token chính xác
      refresh_token_hash: refreshTokenHash,
      expires_at: expiresAt,
      device_id: sessionData.device_id,
      user_agent: sessionData.user_agent,
      ip_address: sessionData.ip_address,
      platform: sessionData.platform || 'web',
      browser: sessionData.browser,
      os: sessionData.os,
      device_type: sessionData.device_type || 'unknown',
      location: sessionData.location || {},
      metadata: sessionData.metadata || {}
    });
  };

  UserSession.revokeAllUserSessions = async function(userId, reason = 'security_breach', revokedBy = null) {
    return await this.update(
      {
        status: 'revoked',
        revoked_at: new Date(),
        revocation_reason: reason,
        revoked_by: revokedBy
      },
      {
        where: {
          user_id: userId,
          status: 'active'
        }
      }
    );
  };

  UserSession.cleanupExpiredSessions = async function() {
    const result = await this.update(
      {
        status: 'expired'
      },
      {
        where: {
          status: 'active',
          expires_at: {
            [sequelize.Sequelize.Op.lt]: new Date()
          }
        }
      }
    );
    
    return result[0]; // Number of affected rows
  };

  UserSession.getUserActiveSessions = function(userId) {
    return this.findAll({
      where: {
        user_id: userId,
        status: 'active'
      },
      order: [['last_used_at', 'DESC']]
    });
  };

  UserSession.getSuspiciousSessions = function(hours = 24) {
    const { Op } = sequelize.Sequelize;
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);
    
    return this.findAll({
      where: {
        [Op.or]: [
          { status: 'suspicious' },
          {
            created_at: {
              [Op.gte]: cutoffDate
            },
            [Op.and]: [
              sequelize.literal(`
                (security_flags->>'multiple_ips')::boolean = true OR
                (security_flags->>'rapid_requests')::boolean = true OR
                (security_flags->>'unusual_location')::boolean = true
              `)
            ]
          }
        ]
      },
      include: [{
        model: sequelize.models.User,
        as: 'user',
        include: [{
          model: sequelize.models.Client,
          as: 'client'
        }]
      }],
      order: [['created_at', 'DESC']]
    });
  };

  UserSession.getSessionStats = async function(userId) {
    const { Op } = sequelize.Sequelize;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const stats = await this.findAll({
      where: {
        user_id: userId,
        created_at: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_sessions'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'active' THEN 1 END")), 'active_sessions'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN device_type = 'mobile' THEN 1 END")), 'mobile_sessions'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN device_type = 'desktop' THEN 1 END")), 'desktop_sessions'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN is_trusted = true THEN 1 END")), 'trusted_sessions']
      ],
      raw: true
    });
    
    return stats[0] || {
      total_sessions: 0,
      active_sessions: 0,
      mobile_sessions: 0,
      desktop_sessions: 0,
      trusted_sessions: 0
    };
  };

  return UserSession;
};