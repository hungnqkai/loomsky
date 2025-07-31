require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const { connectDatabase } = require('./src/database');
const { connectRedis } = require('./src/config/redis');
const { initializeWebSocket } = require('./src/websocket');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

async function startServer() {
  try {
    // Connect to database
    logger.info('Connecting to database...');
    await connectDatabase();
    logger.info('✅ Database connected successfully');

    // Connect to Redis
    logger.info('Connecting to Redis...');
    await connectRedis();
    logger.info('✅ Redis connected successfully');

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize WebSocket
    initializeWebSocket(server);
    logger.info('✅ WebSocket initialized');

    // Start server
    server.listen(config.port, () => {
      logger.info('🚀 LoomSky Backend Server started successfully!');
      logger.info('='.repeat(50));
      logger.info(`🌍 Environment: ${config.env}`);
      logger.info(`🔗 Server running on: ${config.app.url}`);
      logger.info(`📊 Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
      logger.info(`💾 Redis: ${config.redis.host}:${config.redis.port}`);
      logger.info(`📧 Email: ${config.email.from} via Mailgun`);
      
      if (config.env === 'development') {
        logger.info(`🎨 Customer Frontend: ${config.app.frontendUrl}`);
        logger.info(`⚙️  Admin Frontend: ${config.app.adminUrl}`);
        logger.info(`📚 API Documentation: ${config.app.url}/api/docs`);
        logger.info(`🏥 Health Check: ${config.app.url}/api/health`);
        logger.info('='.repeat(50));
        logger.info('📋 Available API Endpoints:');
        logger.info('   POST /api/v1/auth/register');
        logger.info('   POST /api/v1/auth/login'); 
        logger.info('   POST /api/v1/auth/logout');
        logger.info('   POST /api/v1/auth/refresh');
        logger.info('   GET  /api/v1/auth/profile');
        logger.info('   PUT  /api/v1/auth/profile');
        logger.info('   POST /api/v1/auth/change-password');
        logger.info('   POST /api/v1/auth/forgot-password');
        logger.info('   POST /api/v1/auth/reset-password');
        logger.info('   POST /api/v1/auth/verify-email');
        logger.info('   GET  /api/v1/auth/sessions');
        logger.info('='.repeat(50));
        logger.info('🎯 Phase 1: Authentication System - COMPLETE ✅');
        logger.info('🔜 Next: Phase 2 - A/B Testing System');
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          // Close database connections
          const { sequelize } = require('./src/database');
          await sequelize.close();
          logger.info('Database connections closed');

          // Close Redis connection
          const { redisClient } = require('./src/config/redis');
          await redisClient.quit();
          logger.info('Redis connection closed');

          logger.info('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();