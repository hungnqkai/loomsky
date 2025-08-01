const { models } = require('../database');
const asyncHandler = require('../middleware/asyncHandler');

// Chuyển từ class sang một đối tượng đơn giản để đảm bảo export hoạt động chính xác
const subscriptionController = {
  /**
   * Get the current user's client subscription details
   */
  getMySubscription: asyncHandler(async (req, res) => {
    // req.user is populated by the 'auth' middleware
    const clientId = req.user.clientId;

    const subscription = await models.Subscription.findOne({
      where: { client_id: clientId },
      include: [
        {
          model: models.SubscriptionPlan,
          as: 'plan', // Sử dụng alias đã định nghĩa
          attributes: ['name', 'features'], // Chỉ lấy các trường cần thiết
        },
      ],
    });

    if (!subscription) {
      const error = new Error('No active subscription found for this client.');
      error.statusCode = 404;
      throw error; // asyncHandler sẽ bắt và chuyển lỗi này đi
    }

    res.json({
      success: true,
      data: subscription,
    });
  })
};

module.exports = subscriptionController;
