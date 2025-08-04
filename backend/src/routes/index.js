// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./v1/auth');
const subscriptionRoutes = require('./v1/subscription.js');
const clientRoutes = require('./v1/client.js');
const invitationRoutes = require('./v1/invitation.js');
const paymentRoutes = require('./v1/payment.js');
const websiteRoutes = require('./v1/website');
const sdkRoutes = require('./v1/sdk');
const trackRoutes = require('./v1/track');
// const customerRoutes = require('./v1/customer'); // Will be created in next steps
// const adminRoutes = require('./v1/admin'); // Will be created in next steps

// Import middleware
const { authenticateToken } = require('../middleware/auth');
// const { requireAdmin } = require('../middleware/auth'); // Will be used for admin routes

// API version 1 routes
router.use('/v1', (req, res, next) => {
  // Add API version to request object
  req.apiVersion = 'v1';
  next();
});

// Health check for API
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    version: 'v1',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Authentication routes (public)
router.use('/v1/auth', authRoutes);
router.use('/v1/invitations', invitationRoutes);
router.use('/v1/sdk', sdkRoutes);
router.use('/v1/track', trackRoutes);

// Protected routes (yêu cầu đăng nhập)
router.use('/v1/subscriptions', subscriptionRoutes);
router.use('/v1/payments', paymentRoutes);
router.use('/v1/clients', clientRoutes);
router.use('/v1/websites', websiteRoutes);


// Admin routes (admin only) - will be added in next phases
// router.use('/v1/admin', authenticateToken, requireAdmin, adminRoutes);

// API documentation route
router.get('/docs', (req, res) => {
  res.json({
    message: 'LoomSky API Documentation',
    version: 'v1',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: {
        'POST /api/v1/auth/register': 'Register new user and client',
        'POST /api/v1/auth/login': 'Login user',
        'POST /api/v1/auth/logout': 'Logout user',
        'POST /api/v1/auth/refresh': 'Refresh access token',
        'POST /api/v1/auth/forgot-password': 'Send password reset email',
        'POST /api/v1/auth/reset-password': 'Reset password with token',
        'POST /api/v1/auth/verify-email': 'Verify email address',
        'POST /api/v1/auth/resend-verification': 'Resend email verification',
        'GET /api/v1/auth/profile': 'Get user profile (authenticated)',
        'PUT /api/v1/auth/profile': 'Update user profile (authenticated)',
        'POST /api/v1/auth/change-password': 'Change password (authenticated)',
        'GET /api/v1/auth/verify': 'Verify current token (authenticated)',
        'GET /api/v1/auth/sessions': 'Get active sessions (authenticated)',
        'DELETE /api/v1/auth/sessions/:id': 'Revoke session (authenticated)',
        'DELETE /api/v1/auth/sessions': 'Revoke all sessions (authenticated)'
      },
      customer: {
        'GET /api/v1/customer/dashboard': '🚧 Get dashboard data (Coming Soon)',
        'POST /api/v1/customer/clients': '🚧 Create new client (Coming Soon)',
        'GET /api/v1/customer/clients': '🚧 Get user clients (Coming Soon)',
        'PUT /api/v1/customer/clients/:id': '🚧 Update client (Coming Soon)',
        'DELETE /api/v1/customer/clients/:id': '🚧 Delete client (Coming Soon)'
      },
      admin: {
        'GET /api/v1/admin/dashboard': '🚧 Get admin dashboard (Coming Soon)',
        'GET /api/v1/admin/customers': '🚧 Get all customers (Coming Soon)',
        'GET /api/v1/admin/system/health': '🚧 Get system health status (Coming Soon)',
        'POST /api/v1/admin/features/toggle': '🚧 Toggle system features (Coming Soon)'
      }
    },
    phase: 'Phase 1 - Authentication System ✅',
    next_phase: 'Phase 2 - A/B Testing System',
    status: 'Under Development'
  });
});

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    available_endpoints: '/api/docs'
  });
});

module.exports = router;