'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Coupon extends Model {
    static associate(models) {
      Coupon.hasMany(models.Subscription, {
        foreignKey: 'active_coupon_id',
        as: 'activeSubscriptions'
      });
      Coupon.hasMany(models.Payment, {
        foreignKey: 'applied_coupon_id',
        as: 'appliedPayments'
      });
      Coupon.hasMany(models.CouponRedemption, {
        foreignKey: 'coupon_id',
      });
    }
  }
  Coupon.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: DataTypes.STRING,
    name: DataTypes.STRING,
    type: DataTypes.ENUM('percentage', 'fixed_amount'),
    value: DataTypes.DECIMAL(10, 2),
    duration: DataTypes.ENUM('once', 'repeating', 'forever'),
    duration_in_months: DataTypes.INTEGER,
    max_redemptions: DataTypes.INTEGER,
    times_redeemed: DataTypes.INTEGER,
    expires_at: DataTypes.DATE,
    is_active: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'Coupon',
    tableName: 'Coupons',
    underscored: true,
  });
  return Coupon;
};
