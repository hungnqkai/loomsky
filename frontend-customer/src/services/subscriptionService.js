import api from './api';

const subscriptionService = {
  /**
   * Lấy thông tin gói cước hiện tại của client
   */
  getMySubscription() {
    return api.get('/subscriptions/me');
  },
};

export default subscriptionService;
