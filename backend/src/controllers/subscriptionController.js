const { models } = require('../database');
const asyncHandler = require('../middleware/asyncHandler');

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
};

module.exports = subscriptionController;
