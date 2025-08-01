// backend/src/services/paymentGatewayFactory.js
const PayPalGateway = require('./paypalGateway');

/**
 * Factory để lấy instance của cổng thanh toán phù hợp.
 * @param {string} provider - Tên của nhà cung cấp (vd: 'paypal').
 * @returns {object} - Một instance của gateway.
 */
function getGateway(provider) {
  switch (provider.toLowerCase()) {
    case 'paypal':
      return PayPalGateway;
    // Tương lai:
    // case 'vnpay':
    //   return VNPayGateway;
    // case 'stripe':
    //   return StripeGateway;
    default:
      throw new Error(`Payment provider "${provider}" is not supported.`);
  }
}

module.exports = { getGateway };