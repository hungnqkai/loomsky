import api from './api';

const subscriptionService = {
  /**
   * Lấy thông tin gói cước hiện tại của client
   */
  getMySubscription() {
    return api.get('/subscriptions/me');
  },

  /**
   * Lấy danh sách tất cả các gói cước công khai
   */
  getPlans() {
    return api.get('/subscriptions/plans');
  },

  /**
   * Gửi yêu cầu hủy gói cước hiện tại
   */
  cancelSubscription() {
    return api.post('/subscriptions/me/cancel');
  },
};

export default subscriptionService;