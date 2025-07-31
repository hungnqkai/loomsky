'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.Subscription, {
        foreignKey: 'subscription_id',
      });
      Payment.belongsTo(models.Coupon, {
        foreignKey: 'applied_coupon_id',
        as: 'appliedCoupon'
      });
    }
  }
  Payment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    subscription_id: DataTypes.UUID,
    original_amount: DataTypes.DECIMAL(10, 2),
    discount_amount: DataTypes.DECIMAL(10, 2),
    amount: DataTypes.DECIMAL(10, 2),
    currency: DataTypes.STRING(3),
    status: DataTypes.ENUM('succeeded', 'pending', 'failed'),
    payment_method: DataTypes.STRING,
    transaction_id: DataTypes.STRING,
    applied_coupon_id: DataTypes.UUID,
    paid_at: DataTypes.DATE,
    billing_period_start: DataTypes.DATE,
    billing_period_end: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'Payment',
    tableName: 'Payments',
    underscored: true,
  });
  return Payment;
};
