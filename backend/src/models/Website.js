/*
File: src/models/Website.js
- Model Sequelize cho bảng `Websites`.
- Tự động tạo `api_key` trước khi tạo bản ghi mới.
*/
'use strict';
const { Model } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  class Website extends Model {
    static associate(models) {
      Website.belongsTo(models.Client, {
        foreignKey: 'client_id',
      });
      Website.hasMany(models.Pixel, {
        foreignKey: 'website_id',
      });
      Website.hasMany(models.EventFilter, {
        foreignKey: 'website_id',
      });
      Website.hasMany(models.Blacklist, {
        foreignKey: 'website_id',
      });
      Website.hasMany(models.Session, {
        foreignKey: 'website_id',
      });
    }
  }
  Website.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    client_id: DataTypes.UUID,
    name: DataTypes.STRING,
    domain: DataTypes.STRING,
    platform_type: DataTypes.ENUM('wordpress', 'shopify', 'html', 'other'),
    api_key: {
      type: DataTypes.STRING,
      unique: true,
    },
  }, {
    sequelize,
    modelName: 'Website',
    tableName: 'Websites',
    paranoid: true,
    underscored: true,
    hooks: {
      beforeValidate: (website, options) => {
        if (!website.api_key) {
          website.api_key = `ls_key_${crypto.randomBytes(16).toString('hex')}`;
        }
      },
    },
  });
  return Website;
};