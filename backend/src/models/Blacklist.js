/*
File: src/models/Blacklist.js
- Model Sequelize cho bảng `Blacklist`.
*/
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Blacklist extends Model {
    static associate(models) {
      Blacklist.belongsTo(models.Website, {
        foreignKey: 'website_id',
      });
    }
  }
  Blacklist.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    website_id: DataTypes.UUID,
    type: DataTypes.ENUM('ip', 'user_id', 'email', 'phone'),
    value: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Blacklist',
    tableName: 'Blacklist',
    paranoid: true,
    underscored: true,
  });
  return Blacklist;
};