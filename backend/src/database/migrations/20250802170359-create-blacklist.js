/*
File: src/database/migrations/YYYYMMDDHHMMSS-create-blacklist.js
- Migration để tạo bảng `Blacklist`.
*/
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Blacklist', {
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
      type: {
        type: Sequelize.ENUM('ip', 'user_id', 'email', 'phone'),
        allowNull: false,
      },
      value: {
        type: Sequelize.STRING,
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
      deleted_at: {
        type: Sequelize.DATE,
      },
    });
    // Index để tăng tốc độ truy vấn khi kiểm tra blacklist
    await queryInterface.addIndex('Blacklist', ['website_id', 'type', 'value']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Blacklist');
  }
};