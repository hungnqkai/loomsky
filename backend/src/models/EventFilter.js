/*
File: src/models/EventFilter.js
- Model Sequelize cho bảng `EventFilters`.
*/
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EventFilter extends Model {
    static associate(models) {
      EventFilter.belongsTo(models.Website, {
        foreignKey: 'website_id',
      });
    }
  }
  EventFilter.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    website_id: DataTypes.UUID,
    event_name: DataTypes.STRING,
    rules: DataTypes.JSONB,
  }, {
    sequelize,
    modelName: 'EventFilter',
    tableName: 'EventFilters',
    paranoid: true,
    underscored: true,
  });
  return EventFilter;
};