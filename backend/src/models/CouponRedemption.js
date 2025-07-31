'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CouponRedemption extends Model {
    static associate(models) {
      CouponRedemption.belongsTo(models.Coupon, {
        foreignKey: 'coupon_id',
      });
      CouponRedemption.belongsTo(models.Client, {
        foreignKey: 'client_id',
      });
      CouponRedemption.belongsTo(models.Subscription, {
        foreignKey: 'subscription_id',
      });
    }
  }
  CouponRedemption.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    coupon_id: DataTypes.UUID,
    client_id: DataTypes.UUID,
    subscription_id: DataTypes.UUID,
    redeemed_at: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'CouponRedemption',
    tableName: 'CouponRedemptions',
    underscored: true,
  });
  return CouponRedemption;
};
