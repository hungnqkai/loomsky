// backend/src/config/database.js
const { Sequelize } = require('sequelize');
const config = require('./index');
const logger = require('../utils/logger');

// Create Sequelize instance
const sequelize = new Sequelize(
  config.database.name,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging,
    pool: config.database.pool,
    
    // Additional configuration
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true, // Soft deletes
      freezeTableName: true,
      charset: 'utf8mb4',
      dialectOptions: {
        collate: 'utf8mb4_unicode_ci',
      },
    },
    
    // Timezone configuration
    timezone: '+00:00',
    
    // Query configuration
    benchmark: config.env === 'development',
    
    // SSL configuration for production
    dialectOptions: config.env === 'production' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

// Initialize database with models
const initializeDatabase = async () => {
  try {
    // Import models
    const models = require('../models');
    
    // Sync database in development
    if (config.env === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database synchronized successfully');
    }
    
    return sequelize;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  initializeDatabase
};