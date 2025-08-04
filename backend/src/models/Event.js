/*
File: src/models/Event.js
- Model Sequelize cho bảng `Events`.
*/
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    static associate(models) {
      Event.belongsTo(models.Session, {
        foreignKey: 'session_id',
      });
    }
  }
  Event.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    session_id: DataTypes.UUID,
    event_name: DataTypes.STRING,
    properties: DataTypes.JSONB,
    timestamp: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'Event',
    tableName: 'Events',
    timestamps: true, // Bảng này không cần soft delete
    underscored: true,
  });
  return Event;
};