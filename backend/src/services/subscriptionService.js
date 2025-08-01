// backend/src/services/subscriptionService.js
const { models } = require('../database');

class SubscriptionService {
  /**
   * Kích hoạt hoặc cập nhật một gói cước sau khi nhận webhook
   * @param {object} payload - Dữ liệu đã được chuẩn hóa từ webhook
   */
  async processSubscriptionActivation(payload) {
    const { providerSubscriptionId, clientId, planId, status, startTime, endTime } = payload;

    // Tìm hoặc tạo mới bản ghi Subscription
    const [subscription, created] = await models.Subscription.findOrCreate({
      where: { client_id: clientId },
      defaults: {
        plan_id: planId,
        status: status === 'ACTIVE' ? 'active' : 'trialing',
        start_date: startTime,
        end_date: endTime,
        provider: 'paypal',
        provider_subscription_id: providerSubscriptionId,
      },
    });

    if (!created) {
      // Nếu đã tồn tại, cập nhật nó
      subscription.plan_id = planId;
      subscription.status = status === 'ACTIVE' ? 'active' : 'trialing';
      subscription.start_date = startTime;
      subscription.end_date = endTime;
      subscription.provider = 'paypal';
      subscription.provider_subscription_id = providerSubscriptionId;
      await subscription.save();
    }
    console.log(`Subscription for client ${clientId} has been activated/updated.`);
  }

  /**
   * Ghi lại một giao dịch thanh toán thành công
   * @param {object} payload - Dữ liệu đã được chuẩn hóa từ webhook
   */
  async recordPayment(payload) {
    const { providerSubscriptionId, transactionId, amount, currency, paidAt, periodStart, periodEnd } = payload;
    
    const subscription = await models.Subscription.findOne({ where: { provider_subscription_id: providerSubscriptionId } });
    if (!subscription) {
      console.error(`Webhook Error: Could not find subscription with provider ID ${providerSubscriptionId} to record payment.`);
      return;
    }

    await models.Payment.create({
        subscription_id: subscription.id,
        original_amount: amount,
        amount: amount, // Sẽ cập nhật logic coupon sau
        currency: currency,
        status: 'succeeded',
        payment_method: 'paypal',
        transaction_id: transactionId,
        paid_at: paidAt,
        billing_period_start: periodStart,
        billing_period_end: periodEnd,
    });
    console.log(`Payment recorded for subscription ${subscription.id}.`);
  }

  /**
   * Xử lý khi người dùng hủy gói cước
   * @param {object} payload - Dữ liệu đã được chuẩn hóa từ webhook
   */
  async processSubscriptionCancellation(payload) {
    const { providerSubscriptionId } = payload;

    const subscription = await models.Subscription.findOne({ where: { provider_subscription_id: providerSubscriptionId } });
    if (subscription) {
        subscription.status = 'canceled';
        await subscription.save();
        console.log(`Subscription ${subscription.id} has been marked as canceled.`);
    }
  }
}

module.exports = new SubscriptionService();