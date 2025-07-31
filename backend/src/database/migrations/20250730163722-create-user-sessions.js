// backend/src/database/migrations/20241201000005-create-user-sessions.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      refresh_token: {
        type: Sequelize.STRING(500),
        allowNull: false,
        unique: true
      },
      refresh_token_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      device_id: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      platform: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      browser: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      os: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      device_type: {
        type: Sequelize.ENUM('desktop', 'mobile', 'tablet', 'api', 'unknown'),
        defaultValue: 'unknown'
      },
      location: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      status: {
        type: Sequelize.ENUM('active', 'expired', 'revoked', 'suspicious'),
        defaultValue: 'active',
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      last_used_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_trusted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      security_flags: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      activity_count: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      revoked_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      revocation_reason: {
        type: Sequelize.ENUM('user_logout', 'admin_revoke', 'security_breach', 'suspicious_activity', 'password_change', 'manual_cleanup'),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      }
    });

    // Add indexes
    await queryInterface.addIndex('user_sessions', ['user_id']);
    await queryInterface.addIndex('user_sessions', ['refresh_token_hash'], { unique: true });
    await queryInterface.addIndex('user_sessions', ['status']);
    await queryInterface.addIndex('user_sessions', ['expires_at']);
    await queryInterface.addIndex('user_sessions', ['device_id']);
    await queryInterface.addIndex('user_sessions', ['ip_address']);
    await queryInterface.addIndex('user_sessions', ['last_used_at']);
    await queryInterface.addIndex('user_sessions', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_sessions');
  }
};