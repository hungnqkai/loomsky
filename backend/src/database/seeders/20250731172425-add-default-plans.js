'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const freePlanId = uuidv4();
    const proPlanId = uuidv4();

    await queryInterface.bulkInsert('SubscriptionPlans', [
      {
        id: freePlanId,
        name: 'Free',
        description: 'For individuals and small teams getting started.',
        price_monthly: 0.00,
        price_yearly: 0.00,
        is_active: true,
        is_public: true,
        features: JSON.stringify({
          team_members_limit: 5,
          tracked_users_limit: 1000,
          projects_limit: 1,
          data_retention_days: 30,
          enable_ab_testing: false,
          api_access: { enabled: false }
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: proPlanId,
        name: 'Pro',
        description: 'For growing businesses that need more power and features.',
        price_monthly: 29.00,
        price_yearly: 299.00,
        is_active: true,
        is_public: true,
        features: JSON.stringify({
          team_members_limit: 50,
          tracked_users_limit: 50000,
          projects_limit: 10,
          data_retention_days: 365,
          enable_ab_testing: true,
          api_access: { enabled: true, events_per_month: 1000000 }
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SubscriptionPlans', null, {});
  }
};