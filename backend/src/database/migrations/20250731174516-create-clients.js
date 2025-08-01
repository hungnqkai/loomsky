'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Clients', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      name: { type: Sequelize.STRING(100), allowNull: false },
      slug: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      domain: { type: Sequelize.STRING },
      logo_url: { type: Sequelize.TEXT },
      email: { type: Sequelize.STRING, allowNull: false },
      phone: { type: Sequelize.STRING(20) },
      address: { type: Sequelize.TEXT },
      city: { type: Sequelize.STRING(100) },
      country: { type: Sequelize.STRING(100) },
      postal_code: { type: Sequelize.STRING(20) },
      industry: { type: Sequelize.STRING(100) },
      company_size: { type: Sequelize.ENUM('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+') },
      status: {
        type: Sequelize.ENUM('trialing', 'active', 'past_due', 'suspended', 'canceled'),
        allowNull: false,
        defaultValue: 'trialing',
      },
      settings: { type: Sequelize.JSONB },
      metadata: { type: Sequelize.JSONB },
      current_usage: { type: Sequelize.JSONB },
      billing_email: { type: Sequelize.STRING },
      tax_id: { type: Sequelize.STRING(50) },
      payment_provider: { type: Sequelize.STRING },
      payment_provider_customer_id: { type: Sequelize.STRING },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
      deleted_at: { type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Clients');
  }
};
