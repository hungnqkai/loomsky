// backend/src/utils/logger.js
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('../config');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Apply colors to winston
winston.addColors(colors);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define transports
const transports = [];

// Console transport (for development)
if (config.env !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat
    })
  );
}

// File transports
transports.push(
  // Error logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  }),

  // Combined logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  }),

  // HTTP logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '7d',
    zippedArchive: true
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  format: fileFormat,
  transports,
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ],
  
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ],
  
  exitOnError: false
});

// Add stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Utility functions for structured logging
const loggerUtils = {
  // Log API requests
  logRequest: (req, res, responseTime) => {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user?.id,
      clientId: req.client?.id
    };
    
    logger.http('API Request', logData);
  },

  // Log database operations
  logDatabase: (operation, table, duration, error = null) => {
    const logData = {
      operation,
      table,
      duration: `${duration}ms`,
      error: error?.message
    };
    
    if (error) {
      logger.error('Database Error', logData);
    } else {
      logger.debug('Database Operation', logData);
    }
  },

  // Log authentication events
  logAuth: (event, userId, clientId, details = {}) => {
    const logData = {
      event,
      userId,
      clientId,
      timestamp: new Date().toISOString(),
      ...details
    };
    
    logger.info('Auth Event', logData);
  },

  // Log business events
  logBusiness: (event, data = {}) => {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      ...data
    };
    
    logger.info('Business Event', logData);
  },

  // Log security events
  logSecurity: (event, severity, details = {}) => {
    const logData = {
      event,
      severity,
      timestamp: new Date().toISOString(),
      ...details
    };
    
    logger.warn('Security Event', logData);
  }
};

module.exports = Object.assign(logger, loggerUtils);