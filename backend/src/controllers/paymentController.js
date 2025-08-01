const { models } = require('../database');
const asyncHandler = require('../middleware/asyncHandler');
const { getGateway } = require('../services/paymentGatewayFactory');

const paymentController = {
  /**
   * @desc    Create a payment provider subscription (e.g., PayPal)
   * @route   POST /api/v1/payments/create-subscription
   * @access  Private
   */
  createSubscription: asyncHandler(async (req, res) => {
    const { planId, billingCycle, couponCode, provider } = req.body;
    const user = req.user;

    const plan = await models.SubscriptionPlan.findByPk(planId);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found.' });
    }

    // TODO: Validate couponCode logic here later
    const coupon = null; // Placeholder for coupon logic

    try {
      const gateway = getGateway(provider);
      const providerSubscriptionId = await gateway.createSubscription(
        plan,
        billingCycle,
        user,
        coupon
      );

      res.status(201).json({
        success: true,
        data: {
          subscriptionId: providerSubscriptionId, // Đây là ID từ PayPal
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Failed to create subscription.' });
    }
  }),

  /**
   * @desc    Handle webhooks from a payment provider
   * @route   POST /api/v1/payments/webhooks/:provider
   * @access  Public
   */
  handleWebhook: asyncHandler(async (req, res) => {
    const provider = req.params.provider;
    try {
      const gateway = getGateway(provider);
      // Truyền headers và body thô (req.body) vào gateway
      await gateway.handleWebhook(req.headers, req.body);
      // Phản hồi 200 OK cho PayPal để họ biết chúng ta đã nhận được
      res.sendStatus(200);
    } catch (error) {
      console.error(`Webhook handling error for ${provider}:`, error);
      res.sendStatus(500);
    }
  }),

  /**
   * @desc    Get payment history for the current client
   * @route   GET /api/v1/payments/me
   * @access  Private
   */
  getPaymentHistory: asyncHandler(async (req, res) => {
    const clientId = req.user.client_id;

    // 1. Tìm subscription của client để lấy subscription_id
    const subscription = await models.Subscription.findOne({
      where: { client_id: clientId },
    });

    // Nếu không có subscription, họ cũng không có thanh toán nào
    if (!subscription) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // 2. Lấy tất cả các bản ghi thanh toán liên quan đến subscription đó
    const payments = await models.Payment.findAll({
      where: {
        subscription_id: subscription.id,
      },
      order: [['paid_at', 'DESC']], // Sắp xếp giao dịch mới nhất lên đầu
    });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  }),
};

module.exports = paymentController;