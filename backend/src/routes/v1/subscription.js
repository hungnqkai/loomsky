const express = require('express');
const subscriptionController = require('../../controllers/subscriptionController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

const router = express.Router();

// @route   GET /api/v1/subscriptions/me
// @desc    Get current client's subscription
// @access  Private
router.get(
  '/me',
  authenticateToken, // SỬA LỖI: Sử dụng đúng middleware
  subscriptionController.getMySubscription
);

// @route   GET /api/v1/subscriptions/plans
// @desc    Get all public subscription plans
// @access  Public (Không cần đăng nhập)
router.get(
  '/plans',
  subscriptionController.getSubscriptionPlans
);

/**
 * @route   POST /api/v1/subscriptions/me/cancel
 * @desc    Cancel the current active subscription
 * @access  Private (Owner, Admin)
 */
router.post(
  '/me/cancel',
  authenticateToken,
  requireRole(['owner', 'admin']), // Chỉ owner và admin được phép hủy
  subscriptionController.cancelSubscription
);

module.exports = router;
