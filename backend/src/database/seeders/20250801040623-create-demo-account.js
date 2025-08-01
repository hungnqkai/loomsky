'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Tìm gói "Free" đã được tạo bởi seeder trước
    const plans = await queryInterface.sequelize.query(
      `SELECT id FROM "SubscriptionPlans" WHERE name = 'Free' LIMIT 1;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!plans || plans.length === 0) {
      console.log('Could not find "Free" plan to seed demo account. Please run the subscription-plans seeder first.');
      return;
    }
    const freePlanId = plans[0].id;

    // Tạo Client
    const clientId = uuidv4();
    // SỬA LỖI: Đổi tên bảng thành chữ thường
    await queryInterface.bulkInsert('clients', [{
      id: clientId,
      name: 'Demo Company',
      slug: 'demo-company',
      email: 'demo@loomsky.com',
      phone: '123456789',
      status: 'trialing',
      settings: JSON.stringify({
        timezone: 'UTC',
        currency: 'USD',
        language: 'en'
      }),
      current_usage: JSON.stringify({
        team_members: 1
      }),
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Tạo User là owner của Client
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('demo123456', salt);
    const userId = uuidv4();
    // SỬA LỖI: Đổi tên bảng và tên cột
    await queryInterface.bulkInsert('users', [{
      id: userId,
      client_id: clientId,
      email: 'demo@loomsky.com',
      password: hashedPassword, // Sửa từ password_hash thành password
      first_name: 'Demo',
      last_name: 'User',
      role: 'owner',
      status: 'active',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Tạo Subscription cho Client
    const trialDays = 14;
    const now = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(now.getDate() + trialDays);

    // SỬA LỖI: Đổi tên bảng thành chữ thường
    await queryInterface.bulkInsert('Subscriptions', [{
      id: uuidv4(),
      client_id: clientId,
      plan_id: freePlanId,
      status: 'trialing',
      start_date: now,
      end_date: trialEndDate,
      trial_ends_at: trialEndDate,
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { email: 'demo@loomsky.com' }, {});
    await queryInterface.bulkDelete('clients', { slug: 'demo-company' }, {});
  }
};
