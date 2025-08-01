const express = require('express');
const subscriptionController = require('../../controllers/subscriptionController');
// SỬA LỖI: Import đúng tên middleware là 'authenticateToken' giống như trong file auth.js
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

module.exports = router;
