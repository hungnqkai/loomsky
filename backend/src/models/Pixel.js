/*
File: src/models/Pixel.js
- Model Sequelize cho bảng `Pixels`.
*/
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Pixel extends Model {
    static associate(models) {
      Pixel.belongsTo(models.Website, {
        foreignKey: 'website_id',
      });
    }
  }
  Pixel.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    website_id: DataTypes.UUID,
    pixel_id: DataTypes.STRING,
    access_token: DataTypes.STRING,
    activation_rules: DataTypes.JSONB,
    tracking_config: DataTypes.JSONB,
  }, {
    sequelize,
    modelName: 'Pixel',
    tableName: 'Pixels',
    paranoid: true,
    underscored: true,
  });
  return Pixel;
};