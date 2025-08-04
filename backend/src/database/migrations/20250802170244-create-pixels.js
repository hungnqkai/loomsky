/*
File: src/database/migrations/YYYYMMDDHHMMSS-create-pixels.js
- Migration để tạo bảng `Pixels`.
- Bảng này lưu trữ thông tin về các Facebook Pixel và cấu hình của chúng.
*/
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Pixels', {
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
      pixel_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      access_token: {
        type: Sequelize.STRING, // Sẽ được mã hóa ở tầng ứng dụng
      },
      activation_rules: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      tracking_config: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
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
    await queryInterface.addIndex('Pixels', ['website_id']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Pixels');
  }
};