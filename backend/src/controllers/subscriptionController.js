const { models } = require('../database');
const asyncHandler = require('../middleware/asyncHandler');

const subscriptionController = {
  /**
   * Get the current user's client subscription details
   */
  getMySubscription: asyncHandler(async (req, res) => {
    // req.user is populated by the 'auth' middleware
    // SỬA LỖI: Đổi từ clientId thành client_id để khớp với đối tượng user từ middleware
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
  })
};

module.exports = subscriptionController;
