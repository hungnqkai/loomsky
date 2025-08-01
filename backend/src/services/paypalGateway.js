// backend/src/services/paypalGateway.js
const paypal = require('@paypal/checkout-server-sdk');
const paypalClient = require('../config/paypal');
const config = require('../config');
const { models } = require('../database');
const subscriptionService = require('./subscriptionService');
// SỬA LỖI DỨT ĐIỂM: Import Op trực tiếp từ thư viện sequelize
const { Op } = require('sequelize');

class PayPalGateway {
  /**
   * Tạo một đăng ký (subscription) mới trên PayPal.
   */
  async createSubscription(plan, billingCycle = 'monthly', user, coupon = null) {
    const paypalPlanId =
      billingCycle === 'yearly'
        ? plan.paypal_plan_id_yearly
        : plan.paypal_plan_id_monthly;

    if (!paypalPlanId) {
      throw new Error(`PayPal Plan ID for ${billingCycle} cycle not found for plan ${plan.name}`);
    }

    // SỬA LỖI: Tạo một đối tượng request đơn giản thay vì dùng constructor
    const request = {
      path: '/v1/billing/subscriptions',
      verb: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: {
        plan_id: paypalPlanId,
        custom_id: user.client_id,
        start_time: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        quantity: '1',
        subscriber: {
          name: {
            given_name: user.first_name,
            surname: user.last_name,
          },
          email_address: user.email,
        },
        application_context: {
          brand_name: 'LoomSky',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${config.app.frontendUrl}/dashboard/billing?subscribe=success`,
          cancel_url: `${config.app.frontendUrl}/dashboard/billing?subscribe=cancel`,
        },
      },
    };

    try {
      const response = await paypalClient.execute(request);
      return response.result.id; // Trả về PayPal Subscription ID
    } catch (error) {
      console.error('PayPal API Error during subscription creation:', error.message);
      if (error.statusCode && error.result) {
        console.error('PayPal Error Details:', JSON.stringify(error.result, null, 2));
      }
      throw new Error('Failed to create PayPal subscription.');
    }
  }

  /**
   * Hủy một gói đăng ký trên PayPal.
   */
  async cancelSubscription(providerSubscriptionId) {
    // SỬA LỖI: Tạo một đối tượng request đơn giản
    const request = {
      path: `/v1/billing/subscriptions/${providerSubscriptionId}/cancel`,
      verb: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        reason: 'Cancelled by user from LoomSky app.',
      },
    };

    try {
      const response = await paypalClient.execute(request);
      return response.statusCode === 204; // 204 No Content là thành công
    } catch (error) {
      console.error('PayPal API Error during subscription cancellation:', error.message);
      if (error.statusCode && error.result) {
        console.error('PayPal Error Details:', JSON.stringify(error.result, null, 2));
      }
      throw new Error('Failed to cancel PayPal subscription.');
    }
  }

  /**
   * Xác thực và xử lý webhook từ PayPal.
   * @param {object} headers - Headers của request.
   * @param {object} rawBody - Body thô của request.
   * @returns {Promise<boolean>} - Trả về true nếu xử lý thành công.
   */
  async handleWebhook(headers, rawBody) {
    if (!rawBody || Object.keys(rawBody).length === 0) {
      console.warn('Webhook received with empty body.');
      return false;
    }
    if (!headers['paypal-transmission-id']) {
      console.warn('Webhook received without required PayPal headers.');
      return false;
    }

    const request = {
        path: '/v1/notifications/verify-webhook-signature',
        verb: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
            auth_algo: headers['paypal-auth-algo'],
            cert_url: headers['paypal-cert-url'],
            transmission_id: headers['paypal-transmission-id'],
            transmission_sig: headers['paypal-transmission-sig'],
            transmission_time: headers['paypal-transmission-time'],
            webhook_id: config.paypal.webhookId,
            webhook_event: rawBody,
        }
    };

    try {
      const response = await paypalClient.execute(request);
      
      if (response.result.verification_status === 'SUCCESS') {
        console.log('Webhook verified successfully.');
        const event = rawBody;
        
        switch (event.event_type) {
          case 'BILLING.SUBSCRIPTION.ACTIVATED': {
            const plan = await models.SubscriptionPlan.findOne({
                where: { 
                    // SỬA LỖI: Dùng `Op.or` đã được import trực tiếp
                    [Op.or]: [
                        { paypal_plan_id_monthly: event.resource.plan_id },
                        { paypal_plan_id_yearly: event.resource.plan_id }
                    ]
                }
            });
            if (plan) {
                await subscriptionService.processSubscriptionActivation({
                    providerSubscriptionId: event.resource.id,
                    clientId: event.resource.custom_id,
                    planId: plan.id,
                    status: event.resource.status,
                    startTime: new Date(event.resource.start_time),
                    endTime: new Date(event.resource.billing_info.next_billing_time),
                });
            } else {
                console.error(`Webhook Error: Could not find a plan matching PayPal Plan ID ${event.resource.plan_id}`);
            }
            break;
          }
          case 'PAYMENT.SALE.COMPLETED': {
            const billingAgreementId = event.resource.billing_agreement_id;
            if (billingAgreementId) {
                await subscriptionService.recordPayment({
                    providerSubscriptionId: billingAgreementId,
                    transactionId: event.resource.id,
                    amount: event.resource.amount.total,
                    currency: event.resource.amount.currency,
                    paidAt: new Date(event.resource.create_time),
                    periodStart: new Date(event.resource.create_time),
                    periodEnd: new Date(new Date(event.resource.create_time).setMonth(new Date(event.resource.create_time).getMonth() + 1)),
                });
            }
            break;
          }
          case 'BILLING.SUBSCRIPTION.CANCELLED': {
            await subscriptionService.processSubscriptionCancellation({
                providerSubscriptionId: event.resource.id,
            });
            break;
          }
        }
        return true;
      } else {
        console.warn('Webhook verification failed with status:', response.result.verification_status);
        return false;
      }
    } catch (error) {
      console.error('Error handling webhook:', error.message);
      return false;
    }
  }
}

module.exports = new PayPalGateway();