/*
File: src/database/migrations/YYYYMMDDHHMMSS-create-events.js
- Migration để tạo bảng `Events`.
- Bảng này lưu trữ từng hành động chi tiết trong một phiên.
*/
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Events', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Sessions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      event_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      properties: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
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
    await queryInterface.addIndex('Events', ['session_id']);
    await queryInterface.addIndex('Events', ['event_name']);
    await queryInterface.addIndex('Events', ['timestamp']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Events');
  }
};