// backend/src/database/migrations/20241201000002-create-users.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
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
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      first_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      avatar_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      job_title: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM('owner', 'admin', 'member', 'viewer'),
        defaultValue: 'member',
        allowNull: false
      },
      permissions: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'pending', 'suspended'),
        defaultValue: 'pending',
        allowNull: false
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      email_verification_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      email_verification_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      password_reset_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      password_reset_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      preferences: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_login_ip: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      login_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_activity_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      two_factor_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      two_factor_secret: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      two_factor_backup_codes: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      invited_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      invitation_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      invitation_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      accepted_invitation_at: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('users', ['client_id']);
    await queryInterface.addIndex('users', ['status']);
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['email_verification_token']);
    await queryInterface.addIndex('users', ['password_reset_token']);
    await queryInterface.addIndex('users', ['invitation_token']);
    await queryInterface.addIndex('users', ['last_login_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};

