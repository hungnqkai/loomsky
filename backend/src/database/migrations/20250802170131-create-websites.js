/*
File: src/database/migrations/YYYYMMDDHHMMSS-create-websites.js
- Migration để tạo bảng `Websites`.
- Bảng này sẽ lưu trữ thông tin về các website mà khách hàng thêm vào hệ thống.
*/
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Websites', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Clients',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      domain: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      platform_type: {
        type: Sequelize.ENUM('wordpress', 'shopify', 'html', 'other'),
        allowNull: false,
        defaultValue: 'html',
      },
      api_key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
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
    await queryInterface.addIndex('Websites', ['client_id']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Websites');
  }
};