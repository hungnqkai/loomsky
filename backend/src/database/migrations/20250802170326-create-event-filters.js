/*
File: src/database/migrations/YYYYMMDDHHMMSS-create-event-filters.js
- Migration để tạo bảng `EventFilters`.
*/
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('EventFilters', {
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
      event_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      rules: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex('EventFilters', ['website_id', 'event_name']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('EventFilters');
  }
};