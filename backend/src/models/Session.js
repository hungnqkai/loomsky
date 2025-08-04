/*
File: src/models/Session.js
- Model Sequelize cho bảng `Sessions`.
*/
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    static associate(models) {
      Session.belongsTo(models.Website, {
        foreignKey: 'website_id',
      });
      Session.hasMany(models.Event, {
        foreignKey: 'session_id',
      });
    }
  }
  Session.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    website_id: DataTypes.UUID,
    ls_user_id: DataTypes.STRING,
    start_time: DataTypes.DATE,
    end_time: DataTypes.DATE,
    duration: DataTypes.INTEGER,
    ip_address: DataTypes.STRING,
    device_info: DataTypes.JSONB,
    location_info: DataTypes.JSONB,
    attribution_source: DataTypes.JSONB,
    landing_page: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'Session',
    tableName: 'Sessions',
    timestamps: true, // Bảng này không cần soft delete
    underscored: true,
  });
  return Session;
};