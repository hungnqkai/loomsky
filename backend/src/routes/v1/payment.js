const express = require('express');
const paymentController = require('../../controllers/paymentController');
const { authenticateToken } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const Joi = require('joi');

const router = express.Router();

// --- ROUTE CÔNG KHAI (PUBLIC) ---
/**
 * @desc    Handle webhooks from a payment provider
 * @route   POST /api/v1/payments/webhooks/:provider
 * @access  Public
 */
router.post('/webhooks/:provider', paymentController.handleWebhook);


// --- CÁC ROUTE ĐƯỢC BẢO VỆ (PROTECTED) ---
// Middleware authenticateToken sẽ chỉ được áp dụng từ đây trở xuống
router.use(authenticateToken);

/**
 * @desc    Create a payment provider subscription (e.g., PayPal)
 * @route   POST /api/v1/payments/create-subscription
 * @access  Private
 */
router.post(
  '/create-subscription',
  validate({
    body: Joi.object({
      planId: Joi.string().uuid().required(),
      billingCycle: Joi.string().valid('monthly', 'yearly').required(),
      provider: Joi.string().required(),
      couponCode: Joi.string().optional().allow(''),
    }),
  }),
  paymentController.createSubscription
);

/**
 * @desc    Get payment history for the current client
 * @route   GET /api/v1/payments/me
 * @access  Private
 */
router.get('/me', paymentController.getPaymentHistory);

module.exports = router;