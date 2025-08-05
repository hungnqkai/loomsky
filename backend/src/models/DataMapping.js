'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DataMapping extends Model {
    static associate(models) {
      // Một DataMapping thuộc về một Website
      DataMapping.belongsTo(models.Website, {
        foreignKey: 'website_id',
      });
    }
  }
  DataMapping.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    website_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    variable_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    selector: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    page_context: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'DataMapping',
    tableName: 'DataMappings',
    timestamps: true,    // Tự động quản lý createdAt, updatedAt
    paranoid: false,     // Không cần soft delete cho bảng cấu hình này
    underscored: true,
  });
  return DataMapping;
};