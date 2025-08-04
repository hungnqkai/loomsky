/*
File: src/database/migrations/YYYYMMDDHHMMSS-create-sessions.js
- Migration để tạo bảng `Sessions`.
- Bảng này lưu trữ ngữ cảnh của mỗi phiên truy cập.
*/
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Sessions', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      website_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Websites',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      ls_user_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_time: {
        type: Sequelize.DATE,
      },
      duration: {
        type: Sequelize.INTEGER, // In seconds
      },
      ip_address: {
        type: Sequelize.STRING,
      },
      device_info: {
        type: Sequelize.JSONB,
      },
      location_info: {
        type: Sequelize.JSONB,
      },
      attribution_source: {
        type: Sequelize.JSONB,
      },
      landing_page: {
        type: Sequelize.TEXT,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex('Sessions', ['website_id']);
    await queryInterface.addIndex('Sessions', ['ls_user_id']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Sessions');
  }
};