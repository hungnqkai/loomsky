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
  },

  acceptInvitation(data) {
    // API này không nằm trong /auth, nên ta ghi đầy đủ
    return api.post('/invitations/accept', data);
  },
};

export default authService;
