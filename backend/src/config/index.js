const environment = require('./environment');

const config = {
  env: environment.NODE_ENV || 'development',
  port: parseInt(environment.PORT, 10) || 3000,
  
  app: {
    name: environment.APP_NAME || 'LoomSky',
    url: environment.APP_URL || 'http://localhost:3000',
    frontendUrl: environment.FRONTEND_URL || 'http://localhost:5173',
    adminUrl: environment.ADMIN_URL || 'http://localhost:5174'
  },

  database: {
    host: environment.DB_HOST || 'localhost',
    port: parseInt(environment.DB_PORT, 10) || 5432,
    name: environment.DB_NAME || 'loomsky_dev',
    username: environment.DB_USER || 'postgres',
    password: environment.DB_PASSWORD || '',
    dialect: environment.DB_DIALECT || 'postgres',
    logging: environment.DB_LOGGING === 'true' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },

  redis: {
    host: environment.REDIS_HOST || 'localhost',
    port: parseInt(environment.REDIS_PORT, 10) || 6379,
    password: environment.REDIS_PASSWORD || undefined,
    db: parseInt(environment.REDIS_DB, 10) || 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  },

  jwt: {
    secret: environment.JWT_SECRET || 'fallback-secret-change-in-production',
    expire: environment.JWT_EXPIRE || '30m',
    refreshSecret: environment.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-in-production',
    refreshExpire: environment.JWT_REFRESH_EXPIRE || '7d'
  },

  session: {
    secret: environment.SESSION_SECRET || 'fallback-session-secret-change-in-production',
    name: environment.SESSION_NAME || 'loomsky-session',
    expire: parseInt(environment.SESSION_EXPIRE, 10) || 86400000 // 24 hours
  },

  email: {
    mailgun: {
      apiKey: environment.MAILGUN_API_KEY,
      domain: environment.MAILGUN_DOMAIN,
      host: environment.MAILGUN_HOST || 'api.mailgun.net'
    },
    from: environment.EMAIL_FROM || 'noreply@loomsky.com',
    fromName: environment.EMAIL_FROM_NAME || 'LoomSky'
  },

  paypal: {
    clientId: environment.PAYPAL_CLIENT_ID,
    clientSecret: environment.PAYPAL_CLIENT_SECRET,
    mode: environment.PAYPAL_MODE || 'sandbox',
    webhookId: environment.PAYPAL_WEBHOOK_ID
  },

  facebook: {
    appId: environment.FACEBOOK_APP_ID,
    appSecret: environment.FACEBOOK_APP_SECRET,
    apiVersion: environment.FACEBOOK_API_VERSION || 'v18.0'
  },

  security: {
    bcryptSaltRounds: parseInt(environment.BCRYPT_SALT_ROUNDS, 10) || 12,
    maxFileSize: parseInt(environment.MAX_FILE_SIZE, 10) || 5242880, // 5MB
    uploadPath: environment.UPLOAD_PATH || 'uploads/'
  },

  cors: {
    origin: environment.CORS_ORIGIN ? environment.CORS_ORIGIN.split(',') : [
      'http://localhost:5173',
      'http://localhost:5174'
    ]
  },

  rateLimit: {
    windowMs: parseInt(environment.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    maxRequests: parseInt(environment.RATE_LIMIT_MAX_REQUESTS, 10) || 100
  },

  logging: {
    level: environment.LOG_LEVEL || 'info',
    file: environment.LOG_FILE || 'logs/app.log'
  },

  bull: {
    redis: {
      host: environment.BULL_REDIS_HOST || environment.REDIS_HOST || 'localhost',
      port: parseInt(environment.BULL_REDIS_PORT, 10) || parseInt(environment.REDIS_PORT, 10) || 6379,
      db: parseInt(environment.BULL_REDIS_DB, 10) || 1
    }
  },

  monitoring: {
    sentryDsn: environment.SENTRY_DSN,
    googleAnalyticsId: environment.GOOGLE_ANALYTICS_ID
  }
};

// Validate required environment variables in production
if (config.env === 'production') {
  const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET', 
    'SESSION_SECRET',
    'DB_PASSWORD',
    'MAILGUN_API_KEY',
    'MAILGUN_DOMAIN'
  ];

  const missingVars = requiredEnvVars.filter(envVar => !environment[envVar]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

module.exports = config;