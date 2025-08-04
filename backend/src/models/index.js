// backend/src/models/index.js
const { Sequelize } = require('sequelize');
const config = require('../config');
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
    
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
      freezeTableName: true,
      charset: 'utf8mb4',
      dialectOptions: {
        collate: 'utf8mb4_unicode_ci',
      },
    },
    
    timezone: '+00:00',
    benchmark: config.env === 'development',
    
    dialectOptions: config.env === 'production' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  }
);

// Import models
const models = {
  Client: require('./Client')(sequelize, Sequelize.DataTypes),
  User: require('./User')(sequelize, Sequelize.DataTypes),
  UserSession: require('./UserSession')(sequelize, Sequelize.DataTypes),
  SubscriptionPlan: require('./SubscriptionPlan')(sequelize, Sequelize.DataTypes),
  Coupon: require('./Coupon')(sequelize, Sequelize.DataTypes),
  Subscription: require('./Subscription')(sequelize, Sequelize.DataTypes),
  Payment: require('./Payment')(sequelize, Sequelize.DataTypes),
  CouponRedemption: require('./CouponRedemption')(sequelize, Sequelize.DataTypes),
  Website: require('./Website')(sequelize, Sequelize.DataTypes),
  Pixel: require('./Pixel')(sequelize, Sequelize.DataTypes),
  EventFilter: require('./EventFilter')(sequelize, Sequelize.DataTypes),
  Blacklist: require('./Blacklist')(sequelize, Sequelize.DataTypes),
  Session: require('./Session')(sequelize, Sequelize.DataTypes),
  Event: require('./Event')(sequelize, Sequelize.DataTypes),
};

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Add sequelize instance and Sequelize constructor to models object
models.sequelize = sequelize;
models.Sequelize = Sequelize;

// Database utility functions
const dbUtils = {
  // Test database connection
  testConnection: async () => {
    try {
      await sequelize.authenticate();
      logger.info('Database connection established successfully');
      return true;
    } catch (error) {
      logger.error('Unable to connect to the database:', error);
      throw error;
    }
  },

  // Sync database (development only)
  syncDatabase: async (options = {}) => {
    try {
      if (config.env === 'production') {
        logger.warn('Database sync skipped in production. Use migrations instead.');
        return false;
      }

      const syncOptions = {
        alter: true,
        ...options
      };

      await sequelize.sync(syncOptions);
      logger.info('Database synchronized successfully');
      return true;
    } catch (error) {
      logger.error('Database sync failed:', error);
      throw error;
    }
  },

  // Create database if it doesn't exist
  createDatabase: async () => {
    try {
      // Create a connection without specifying database
      const tempSequelize = new Sequelize(
        '',
        config.database.username,
        config.database.password,
        {
          host: config.database.host,
          port: config.database.port,
          dialect: config.database.dialect,
          logging: false
        }
      );

      // Create database
      await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${config.database.name}\`;`);
      await tempSequelize.close();
      
      logger.info(`Database '${config.database.name}' created or already exists`);
      return true;
    } catch (error) {
      logger.error('Database creation failed:', error);
      throw error;
    }
  },

  // Get database stats
  getDatabaseStats: async () => {
    try {
      const stats = {};
      
      for (const [modelName, model] of Object.entries(models)) {
        if (modelName === 'sequelize' || modelName === 'Sequelize') continue;
        
        const count = await model.count();
        stats[modelName.toLowerCase()] = count;
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get database stats:', error);
      throw error;
    }
  },

  // Clean up old records
  cleanupOldRecords: async () => {
    try {
      const results = {};
      
      // Clean up expired user sessions
      const expiredSessions = await models.UserSession.cleanupExpiredSessions();
      results.expired_sessions = expiredSessions;
      
      // Clean up old deleted records (hard delete after 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      for (const [modelName, model] of Object.entries(models)) {
        if (modelName === 'sequelize' || modelName === 'Sequelize') continue;
        if (!model.options || !model.options.paranoid) continue;
        
        const deleted = await model.destroy({
          where: {
            deleted_at: {
              [Sequelize.Op.lt]: ninetyDaysAgo
            }
          },
          force: true // Hard delete
        });
        
        if (deleted > 0) {
          results[`${modelName.toLowerCase()}_hard_deleted`] = deleted;
        }
      }
      
      logger.info('Database cleanup completed', results);
      return results;
    } catch (error) {
      logger.error('Database cleanup failed:', error);
      throw error;
    }
  },

  // Initialize database with seed data
  initializeWithSeedData: async () => {
    try {
      // Check if already initialized
      const clientCount = await models.Client.count();
      if (clientCount > 0) {
        logger.info('Database already initialized with data');
        return false;
      }

      // Create demo client for development
      if (config.env === 'development') {
        const demoClient = await models.Client.create({
          name: 'Demo Company',
          slug: 'demo',
          email: 'demo@loomsky.com',
          domain: 'https://demo.loomsky.com',
          status: 'active',
          settings: {
            timezone: 'UTC',
            currency: 'USD',
            language: 'en'
          }
        });

        // Create demo user
        const demoUser = await models.User.create({
          client_id: demoClient.id,
          email: 'demo@loomsky.com',
          password: 'demo123456',
          first_name: 'Demo',
          last_name: 'User',
          role: 'owner',
          status: 'active',
          email_verified: true
        });

        // Create demo subscription
        await models.Subscription.create({
          client_id: demoClient.id,
          plan_name: 'professional',
          status: 'active',
          amount: 99.00,
          started_at: new Date(),
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        logger.info('Demo data created successfully', {
          client_id: demoClient.id,
          user_id: demoUser.id
        });
      }

      return true;
    } catch (error) {
      logger.error('Failed to initialize seed data:', error);
      throw error;
    }
  }
};

// Export models and utilities
module.exports = {
  ...models,
  dbUtils,
  
  // Convenience function to get all models
  getModels: () => {
    const modelsList = {};
    Object.keys(models).forEach(key => {
      if (key !== 'sequelize' && key !== 'Sequelize') {
        modelsList[key] = models[key];
      }
    });
    return modelsList;
  },
  
  // Get model by name
  getModel: (name) => {
    return models[name] || null;
  }
};