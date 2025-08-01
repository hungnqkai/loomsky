// backend/src/config/paypal.js
const paypal = require('@paypal/checkout-server-sdk');
const config = require('./index');

// 1. Cấu hình môi trường
const environment =
  config.paypal.mode === 'live'
    ? new paypal.core.LiveEnvironment(config.paypal.clientId, config.paypal.clientSecret)
    : new paypal.core.SandboxEnvironment(config.paypal.clientId, config.paypal.clientSecret);

// 2. Tạo PayPal HTTP Client
const client = new paypal.core.PayPalHttpClient(environment);

module.exports = client;