import api from './api';

const paymentService = {
  /**
   * Yêu cầu backend tạo một phiên đăng ký (subscription) với nhà cung cấp.
   * @param {object} data - Dữ liệu cần thiết { planId, billingCycle, provider, couponCode }
   * @returns {Promise} - Promise chứa thông tin phiên đăng ký, bao gồm subscriptionId từ nhà cung cấp.
   */
  createSubscription(data) {
    return api.post('/payments/create-subscription', data);
  },

  /**
   * Lấy lịch sử thanh toán của client hiện tại.
   */
  getHistory() {
    return api.get('/payments/me');
  },
};

export default paymentService;