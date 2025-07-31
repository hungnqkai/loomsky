// backend/src/config/redis.js
const redis = require('redis');
const config = require('./index');
const logger = require('../utils/logger');

// Create Redis client
const redisClient = redis.createClient({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  retryDelayOnFailover: config.redis.retryDelayOnFailover,
  maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
  
  // Retry strategy
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      logger.error('Redis server connection refused');
      return new Error('Redis server connection refused');
    }
    
    if (options.total_retry_time > 1000 * 60 * 60) {
      logger.error('Redis retry time exhausted');
      return new Error('Redis retry time exhausted');
    }
    
    if (options.attempt > 10) {
      logger.error('Redis max retry attempts reached');
      return undefined;
    }
    
    // Exponential backoff
    return Math.min(options.attempt * 100, 3000);
  }
});

// Redis event handlers
redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err);
});

redisClient.on('end', () => {
  logger.info('Redis client disconnected');
});

redisClient.on('reconnecting', () => {
  logger.info('Redis client reconnecting');
});

// Bull Queue Redis client (separate database)
const bullRedisClient = redis.createClient({
  host: config.bull.redis.host,
  port: config.bull.redis.port,
  db: config.bull.redis.db
});

bullRedisClient.on('error', (err) => {
  logger.error('Bull Redis client error:', err);
});

// Redis utility functions
const redisUtils = {
  // Set key with expiration
  setex: async (key, seconds, value) => {
    try {
      const result = await redisClient.setEx(key, seconds, JSON.stringify(value));
      return result;
    } catch (error) {
      logger.error('Redis SETEX error:', error);
      throw error;
    }
  },

  // Get key
  get: async (key) => {
    try {
      const result = await redisClient.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      logger.error('Redis GET error:', error);
      throw error;
    }
  },

  // Delete key
  del: async (key) => {
    try {
      return await redisClient.del(key);
    } catch (error) {
      logger.error('Redis DEL error:', error);
      throw error;
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      return await redisClient.exists(key);
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      throw error;
    }
  },

  // Increment counter
  incr: async (key) => {
    try {
      return await redisClient.incr(key);
    } catch (error) {
      logger.error('Redis INCR error:', error);
      throw error;
    }
  },

  // Hash operations
  hset: async (key, field, value) => {
    try {
      return await redisClient.hSet(key, field, JSON.stringify(value));
    } catch (error) {
      logger.error('Redis HSET error:', error);
      throw error;
    }
  },

  hget: async (key, field) => {
    try {
      const result = await redisClient.hGet(key, field);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      logger.error('Redis HGET error:', error);
      throw error;
    }
  },

  // List operations for real-time features
  lpush: async (key, value) => {
    try {
      return await redisClient.lPush(key, JSON.stringify(value));
    } catch (error) {
      logger.error('Redis LPUSH error:', error);
      throw error;
    }
  },

  lrange: async (key, start, stop) => {
    try {
      const results = await redisClient.lRange(key, start, stop);
      return results.map(item => JSON.parse(item));
    } catch (error) {
      logger.error('Redis LRANGE error:', error);
      throw error;
    }
  }
};

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    await bullRedisClient.connect();
    logger.info('Redis connections established successfully');
    return true;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

// Disconnect from Redis
const disconnectRedis = async () => {
  try {
    await redisClient.quit();
    await bullRedisClient.quit();
    logger.info('Redis connections closed successfully');
  } catch (error) {
    logger.error('Redis disconnection error:', error);
    throw error;
  }
};

module.exports = {
  redisClient,
  bullRedisClient,
  redisUtils,
  connectRedis,
  disconnectRedis
};