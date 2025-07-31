// backend/src/middleware/auth.js
const jwtService = require('../services/jwtService');
const { models } = require('../database');
const logger = require('../utils/logger');

/**
 * Authentication middleware - verify JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // Verify and decode token
    const decoded = jwtService.verifyAccessToken(token);

    // Get user with client information
    const user = await models.User.findByPk(decoded.id, {
      include: [{
        model: models.Client,
        as: 'client',
        include: [{
          model: models.Subscription,
          as: 'activeSubscription'
        }]
      }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Account is not active'
      });
    }

    // Check if client is active
    if (user.client && user.client.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Account suspended'
      });
    }

    // Add user and client to request object
    req.user = user;
    req.client = user.client;
    req.token = token;

    // Log authentication for security monitoring
    logger.logAuth('token_verified', user.id, user.client_id, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });

    next();
  } catch (error) {
    logger.error('Authentication error:', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });

    if (error.message === 'ACCESS_TOKEN_EXPIRED') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.message.includes('INVALID')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      return next(); // Continue without authentication
    }

    // Try to authenticate, but don't fail if it doesn't work
    try {
      const decoded = jwtService.verifyAccessToken(token);
      const user = await models.User.findByPk(decoded.id, {
        include: [{
          model: models.Client,
          as: 'client'
        }],
        attributes: { exclude: ['password'] }
      });

      if (user && user.status === 'active') {
        req.user = user;
        req.client = user.client;
        req.token = token;
      }
    } catch (error) {
      // Silently fail - continue without authentication
      logger.debug('Optional auth failed:', error.message);
    }

    next();
  } catch (error) {
    // Continue even if there's an error
    next();
  }
};

/**
 * Role-based authorization middleware
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      logger.logSecurity('unauthorized_access_attempt', 'high', {
        userId: req.user.id,
        userRole,
        requiredRoles: allowedRoles,
        endpoint: req.originalUrl,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 */
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!req.user.hasPermission(resource, action)) {
      logger.logSecurity('unauthorized_permission_attempt', 'medium', {
        userId: req.user.id,
        resource,
        action,
        endpoint: req.originalUrl,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error: `Permission denied: ${action} on ${resource}`
      });
    }

    next();
  };
};

/**
 * Admin-only middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (!['owner', 'admin'].includes(req.user.role)) {
    logger.logSecurity('admin_access_attempt', 'high', {
      userId: req.user.id,
      userRole: req.user.role,
      endpoint: req.originalUrl,
      ip: req.ip
    });

    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
};

/**
 * Owner-only middleware
 */
const requireOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'owner') {
    logger.logSecurity('owner_access_attempt', 'high', {
      userId: req.user.id,
      userRole: req.user.role,
      endpoint: req.originalUrl,
      ip: req.ip
    });

    return res.status(403).json({
      success: false,
      error: 'Owner access required'
    });
  }

  next();
};

/**
 * Active subscription middleware
 */
const requireActiveSubscription = (req, res, next) => {
  if (!req.user || !req.client) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Check if client has active subscription
  if (!req.client.hasActiveSubscription) {
    return res.status(402).json({
      success: false,
      error: 'Active subscription required',
      code: 'SUBSCRIPTION_REQUIRED'
    });
  }

  // Check if trial is expired
  if (req.client.isTrialExpired()) {
    return res.status(402).json({
      success: false,
      error: 'Trial expired - subscription required',
      code: 'TRIAL_EXPIRED'
    });
  }

  next();
};

/**
 * Rate limiting per user
 */
const rateLimitPerUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next(); // Skip rate limiting for unauthenticated requests
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(userId)) {
      const userRequests = requests.get(userId).filter(time => time > windowStart);
      requests.set(userId, userRequests);
    }

    // Get current requests count
    const currentRequests = requests.get(userId) || [];
    
    if (currentRequests.length >= maxRequests) {
      logger.logSecurity('rate_limit_exceeded', 'medium', {
        userId,
        requestCount: currentRequests.length,
        maxRequests,
        endpoint: req.originalUrl,
        ip: req.ip
      });

      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current request
    currentRequests.push(now);
    requests.set(userId, currentRequests);

    next();
  };
};

/**
 * Tenant isolation middleware - ensure user can only access their client's data
 */
const ensureTenantAccess = (req, res, next) => {
  if (!req.user || !req.client) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Add client_id filter to query parameters automatically
  req.tenantId = req.client.id;
  
  // Override res.json to filter responses
  const originalJson = res.json;
  res.json = function(data) {
    // Add tenant context to response
    if (data && typeof data === 'object' && data.success !== false) {
      data._tenant = req.client.slug;
    }
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Feature flag middleware
 */
const requireFeature = (featureName) => {
  return (req, res, next) => {
    if (!req.client || !req.client.activeSubscription) {
      return res.status(402).json({
        success: false,
        error: 'Subscription required'
      });
    }

    const subscription = req.client.activeSubscription;
    if (!subscription.canUseFeature(featureName)) {
      return res.status(403).json({
        success: false,
        error: `Feature '${featureName}' not available in your plan`,
        code: 'FEATURE_NOT_AVAILABLE'
      });
    }

    next();
  };
};

/**
 * Email verification middleware
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (!req.user.email_verified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
};

/**
 * Device trust middleware
 */
const checkDeviceTrust = async (req, res, next) => {
  if (!req.user) {
    return next();
  }

  try {
    const deviceId = req.headers['x-device-id'];
    const userAgent = req.get('User-Agent');
    const ip = req.ip;

    // Check for suspicious activity
    const recentSessions = await models.UserSession.findAll({
      where: {
        user_id: req.user.id,
        created_at: {
          [models.sequelize.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      limit: 10
    });

    // Flag suspicious activity
    const uniqueIPs = new Set(recentSessions.map(s => s.ip_address));
    const uniqueDevices = new Set(recentSessions.map(s => s.device_id).filter(Boolean));

    if (uniqueIPs.size > 5 || uniqueDevices.size > 3) {
      logger.logSecurity('suspicious_device_activity', 'high', {
        userId: req.user.id,
        uniqueIPs: uniqueIPs.size,
        uniqueDevices: uniqueDevices.size,
        currentIP: ip,
        currentDevice: deviceId
      });

      // Don't block, but add flag for monitoring
      req.suspiciousActivity = true;
    }

    next();
  } catch (error) {
    logger.error('Device trust check failed:', error);
    next(); // Continue on error
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requirePermission,
  requireAdmin,
  requireOwner,
  requireActiveSubscription,
  rateLimitPerUser,
  ensureTenantAccess,
  requireFeature,
  requireEmailVerification,
  checkDeviceTrust
};