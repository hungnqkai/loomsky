'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Subscription extends Model {
    static associate(models) {
      Subscription.belongsTo(models.Client, {
        foreignKey: 'client_id',
      });
      Subscription.belongsTo(models.SubscriptionPlan, {
        foreignKey: 'plan_id',
      });
      Subscription.belongsTo(models.Coupon, {
        foreignKey: 'active_coupon_id',
        as: 'activeCoupon'
      });
      Subscription.hasMany(models.Payment, {
        foreignKey: 'subscription_id',
      });
      Subscription.hasMany(models.CouponRedemption, {
        foreignKey: 'subscription_id',
      });
    }
  }
  Subscription.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    client_id: DataTypes.UUID,
    plan_id: DataTypes.UUID,
    active_coupon_id: DataTypes.UUID,
    status: DataTypes.ENUM('active', 'trialing', 'past_due', 'canceled'),
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,
    trial_ends_at: DataTypes.DATE,
    provider: DataTypes.STRING,
    provider_subscription_id: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Subscription',
    tableName: 'Subscriptions',
    underscored: true,
  });
  return Subscription;
};
