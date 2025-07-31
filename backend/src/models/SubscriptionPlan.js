'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SubscriptionPlan extends Model {
    static associate(models) {
      SubscriptionPlan.hasMany(models.Subscription, {
        foreignKey: 'plan_id',
      });
    }
  }
  SubscriptionPlan.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    price_monthly: DataTypes.DECIMAL(10, 2),
    price_yearly: DataTypes.DECIMAL(10, 2),
    is_active: DataTypes.BOOLEAN,
    is_public: DataTypes.BOOLEAN,
    features: DataTypes.JSONB,
  }, {
    sequelize,
    modelName: 'SubscriptionPlan',
    tableName: 'SubscriptionPlans',
    underscored: true,
  });
  return SubscriptionPlan;
};
