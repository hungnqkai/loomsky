import api from './api';

const authService = {
  login(credentials) {
    return api.post('/auth/login', credentials);
  },

  register(data) {
    // Thêm hàm mới
    return api.post('/auth/register', data);
  },

  // THÊM HÀM MỚI
  verifyEmail(token) {
    return api.post('/auth/verify-email', { token });
  },

  forgotPassword(data) {
    return api.post('/auth/forgot-password', data);
  },

  resetPassword(data) {
    return api.post('/auth/reset-password', data);
  }

  // Các hàm logout, refreshToken... sẽ được thêm vào đây sau
};

export default authService;
