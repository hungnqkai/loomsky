const express = require('express');
const subscriptionController = require('../../controllers/subscriptionController');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// @route   GET /api/v1/subscriptions/me
// @desc    Get current client's subscription
// @access  Private
router.get(
  '/me',
  authenticateToken, // SỬA LỖI: Sử dụng đúng middleware
  subscriptionController.getMySubscription
);

// --- THÊM ROUTE MỚI Ở ĐÂY ---
// @route   GET /api/v1/subscriptions/plans
// @desc    Get all public subscription plans
// @access  Public (Không cần đăng nhập)
router.get(
  '/plans',
  subscriptionController.getSubscriptionPlans
);

module.exports = router;
