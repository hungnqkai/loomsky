// backend/src/database/index.js
const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');

// Import models
const models = require('../models');

// Database connection function
const connectDatabase = async () => {
  try {
    // Test connection
    await models.sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Sync database in development (use migrations in production)
    if (config.env === 'development') {
      await models.sequelize.sync({ alter: true });
      logger.info('Database synchronized successfully');
      
      // Initialize with seed data if needed
      await models.dbUtils.initializeWithSeedData();
    }
    
    return models.sequelize;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

// Close database connection
const closeDatabase = async () => {
  try {
    await models.sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

module.exports = {
  sequelize: models.sequelize,
  models: models.getModels(),
  connectDatabase,
  closeDatabase,
  dbUtils: models.dbUtils
};