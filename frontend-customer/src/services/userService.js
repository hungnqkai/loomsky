import api from './api';

const userService = {
  /**
   * Lấy thông tin của người dùng hiện tại
   */
  getMe() {
    return api.get('/auth/profile');
  },

  /**
   * Cập nhật thông tin của người dùng hiện tại
   * @param {object} data - Dữ liệu cần cập nhật (vd: { first_name, last_name })
   */
  updateMe(data) {
    // SỬA LỖI: Đổi phương thức từ .patch() thành .put() để khớp với API
    return api.put('/auth/profile', data);
  },

  /**
   * Thay đổi mật khẩu của người dùng hiện tại
   * @param {object} data - Dữ liệu mật khẩu (vd: { oldPassword, newPassword })
   */
  changePassword(data) {
    return api.post('/auth/change-password', data);
  },
};

export default userService;
