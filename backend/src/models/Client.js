'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Client extends Model {
    static associate(models) {
      Client.hasMany(models.User, {
        foreignKey: 'client_id',
      });
      Client.hasOne(models.Subscription, {
        foreignKey: 'client_id',
        as: 'activeSubscription'
      });
      Client.hasMany(models.CouponRedemption, {
        foreignKey: 'client_id',
      });
    }
  }
  Client.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // --- Basic Information (Giữ lại từ model của bạn) ---
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    domain: {
      type: DataTypes.STRING(255),
      validate: { isUrl: true },
    },
    logo_url: DataTypes.TEXT,
    
    // --- Contact & Address (Giữ lại từ model của bạn) ---
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },
    phone: DataTypes.STRING(20),
    address: DataTypes.TEXT,
    city: DataTypes.STRING(100),
    country: DataTypes.STRING(100),
    postal_code: DataTypes.STRING(20),

    // --- Business Information (Giữ lại từ model của bạn) ---
    industry: DataTypes.STRING(100),
    company_size: DataTypes.ENUM('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'),

    // --- Status & Settings (Giữ lại và tinh chỉnh) ---
    status: {
      type: DataTypes.ENUM('trialing', 'active', 'past_due', 'suspended', 'canceled'),
      allowNull: false,
      defaultValue: 'trialing',
    },
    settings: DataTypes.JSONB,
    metadata: DataTypes.JSONB,
    current_usage: DataTypes.JSONB,

    // --- Billing Information (Thêm mới để hỗ trợ thanh toán) ---
    billing_email: {
      type: DataTypes.STRING,
      validate: { isEmail: true },
    },
    tax_id: DataTypes.STRING(50),
    payment_provider: DataTypes.STRING,
    payment_provider_customer_id: DataTypes.STRING,

  }, {
    sequelize,
    modelName: 'Client',
    tableName: 'clients',
    underscored: true,
    paranoid: true, // Enable soft deletes
  });
  return Client;
};
