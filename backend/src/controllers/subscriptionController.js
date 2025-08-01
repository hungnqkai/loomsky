const { models } = require('../database');
const asyncHandler = require('../middleware/asyncHandler');
const { getGateway } = require('../services/paymentGatewayFactory');

const subscriptionController = {
  /**
   * Get the current user's client subscription details
   */
  getMySubscription: asyncHandler(async (req, res) => {
    const clientId = req.user.client_id;

    const subscription = await models.Subscription.findOne({
      where: { client_id: clientId },
      include: [
        {
          model: models.SubscriptionPlan,
          as: 'plan',
          attributes: ['name', 'features'],
        },
      ],
    });

    if (!subscription) {
      const error = new Error('No active subscription found for this client.');
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      data: subscription,
    });
  }),

  /**
   * THÊM HÀM MỚI
   * Get all public and active subscription plans
   */
  getSubscriptionPlans: asyncHandler(async (req, res) => {
    const plans = await models.SubscriptionPlan.findAll({
      where: {
        is_active: true,
        is_public: true,
      },
      attributes: ['id', 'name', 'description', 'price_monthly', 'price_yearly', 'features'],
      order: [['price_monthly', 'ASC']],
    });

    res.json({
      success: true,
      data: plans,
    });
  }),

  /**
   * @desc    Cancel the current active subscription
   * @route   POST /api/v1/subscriptions/me/cancel
   * @access  Private (Owner, Admin)
   */
  cancelSubscription: asyncHandler(async (req, res) => {
    const clientId = req.user.client_id;

    // 1. Tìm gói cước hiện tại trong CSDL
    const subscription = await models.Subscription.findOne({
      where: {
        client_id: clientId,
        status: 'active', // Chỉ có thể hủy các gói đang hoạt động
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found to cancel.',
      });
    }

    if (!subscription.provider || !subscription.provider_subscription_id) {
        return res.status(400).json({
            success: false,
            error: 'Subscription cannot be canceled automatically. Please contact support.',
        });
    }

    try {
      // 2. Dùng Factory để gọi đến Cổng thanh toán tương ứng
      const gateway = getGateway(subscription.provider);
      const success = await gateway.cancelSubscription(subscription.provider_subscription_id);

      if (success) {
        // 3. Cập nhật trạng thái trong CSDL của chúng ta
        subscription.status = 'canceled';
        await subscription.save();

        res.status(200).json({
          success: true,
          message: 'Your subscription has been canceled successfully. It will remain active until the end of the current billing period.',
          data: subscription,
        });
      } else {
        throw new Error('Failed to cancel subscription with the payment provider.');
      }
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      res.status(500).json({
        success: false,
        error: 'An error occurred while canceling the subscription. Please try again or contact support.',
      });
    }
  }),
};

module.exports = subscriptionController;
