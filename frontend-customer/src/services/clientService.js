import api from './api';

const clientService = {
  /**
   * Lấy thông tin chi tiết của client hiện tại
   */
  getMe() {
    return api.get('/clients/me');
  },

  /**
   * Cập nhật thông tin của client hiện tại
   * @param {object} data - Dữ liệu client cần cập nhật
   */
  updateMe(data) {
    return api.put('/clients/me', data);
  },

  /**
   * Tải lên logo cho client hiện tại
   * @param {File} file - File logo được chọn từ input
   */
  uploadLogo(file) {
    const formData = new FormData();
    // 'logo' phải khớp với tên field đã định nghĩa trong middleware multer ở backend
    formData.append('logo', file);

    return api.post('/clients/me/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default clientService;