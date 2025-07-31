// backend/src/routes/v1/auth.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../../controllers/authController');
const { authenticateToken } = require('../../middleware/auth');
const logger = require('../../utils/logger');

const router = express.Router();

// Rate limiting configurations
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for certain endpoints in development
    return process.env.NODE_ENV === 'development' && req.path === '/verify-email';
  },
  handler: (req, res) => {
    logger.logSecurity('auth_rate_limit_exceeded', 'medium', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Please try again later.',
      retryAfter: Math.ceil(15 * 60)
    });
  }
});

const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    success: false,
    error: 'Too many password reset attempts. Please try again later.',
    retryAfter: 60 * 60
  },
  keyGenerator: (req) => {
    // Rate limit by IP and email
    return `${req.ip}-${req.body.email}`;
  }
});

const verificationRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 verification attempts per 10 minutes
  message: {
    success: false,
    error: 'Too many verification attempts. Please try again later.',
    retryAfter: 10 * 60
  }
});

// Middleware to log all auth requests
router.use((req, res, next) => {
  logger.http('Auth request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user and client
 * @access  Public
 */
router.post('/register', authRateLimit, authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authRateLimit, authController.login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (revoke refresh token)
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', passwordResetRateLimit, authController.forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', authRateLimit, authController.resetPassword);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email', verificationRateLimit, authController.verifyEmail);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post('/resend-verification', verificationRateLimit, authController.resendVerification);

// Protected routes (require authentication)

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, authController.updateProfile);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password (authenticated user)
 * @access  Private
 */
router.post('/change-password', authenticateToken, authController.changePassword);

/**
 * @route   GET /api/v1/auth/verify
 * @desc    Verify current access token
 * @access  Private
 */
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
      client: req.client
    }
  });
});

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    Get user active sessions
 * @access  Private
 */
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const { models } = require('../../database');
    const sessions = await models.UserSession.getUserActiveSessions(req.user.id);
    
    const sessionData = sessions.map(session => ({
      id: session.id,
      device_type: session.device_type,
      browser: session.browser,
      os: session.os,
      ip_address: session.ip_address,
      location: session.location,
      created_at: session.created_at,
      last_used_at: session.last_used_at,
      is_trusted: session.is_trusted,
      is_current: session.refresh_token_hash === req.sessionHash // Would need to be set by middleware
    }));

    res.json({
      success: true,
      data: {
        sessions: sessionData,
        total: sessionData.length
      }
    });

  } catch (error) {
    logger.error('Failed to get user sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sessions'
    });
  }
});

/**
 * @route   DELETE /api/v1/auth/sessions/:sessionId
 * @desc    Revoke specific session
 * @access  Private
 */
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { models } = require('../../database');
    const { sessionId } = req.params;

    const session = await models.UserSession.findOne({
      where: {
        id: sessionId,
        user_id: req.user.id
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    await session.revoke('user_revoke', req.user.id);

    logger.logAuth('session_revoked', req.user.id, req.user.client_id, {
      sessionId,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });

  } catch (error) {
    logger.error('Failed to revoke session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke session'
    });
  }
});

/**
 * @route   DELETE /api/v1/auth/sessions
 * @desc    Revoke all other sessions (except current)
 * @access  Private
 */
router.delete('/sessions', authenticateToken, async (req, res) => {
  try {
    const jwtService = require('../../services/jwtService');
    const revokedCount = await jwtService.revokeAllUserTokens(req.user.id, 'user_revoke_all');

    logger.logAuth('all_sessions_revoked', req.user.id, req.user.client_id, {
      revokedCount,
      ip: req.ip
    });

    res.json({
      success: true,
      message: `${revokedCount} sessions revoked successfully`
    });

  } catch (error) {
    logger.error('Failed to revoke all sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke sessions'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Authentication',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware for auth routes
router.use((error, req, res, next) => {
  logger.error('Auth route error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

module.exports = router;