'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Thêm cột để lưu ID của plan hàng tháng trên PayPal
    await queryInterface.addColumn('SubscriptionPlans', 'paypal_plan_id_monthly', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'ID of the corresponding monthly plan on PayPal',
    });
    // Thêm cột để lưu ID của plan hàng năm trên PayPal
    await queryInterface.addColumn('SubscriptionPlans', 'paypal_plan_id_yearly', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'ID of the corresponding yearly plan on PayPal',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('SubscriptionPlans', 'paypal_plan_id_monthly');
    await queryInterface.removeColumn('SubscriptionPlans', 'paypal_plan_id_yearly');
  },
};