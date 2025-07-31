// backend/src/database/seeders/20241201000002-subscription-plans.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // This seeder can be used to create standard subscription plans
    // For now, we'll keep plans in the application logic
    // But this can be extended later if needed
    
    console.log('✅ Subscription plans are defined in application logic');
    console.log('📋 Available plans: free, starter, professional, enterprise');
  },

  async down(queryInterface, Sequelize) {
    // Nothing to undo for now
  }
};