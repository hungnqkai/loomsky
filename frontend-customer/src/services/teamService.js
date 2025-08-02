import api from './api';

const teamService = {
  /**
   * Lấy danh sách tất cả thành viên trong team của client hiện tại
   */
  getMembers() {
    return api.get('/clients/me/members');
  },

  /**
   * Gửi lời mời một thành viên mới
   * @param {object} invitationData - Dữ liệu lời mời { email, role }
   */
  inviteMember(invitationData) {
    return api.post('/clients/me/invitations', invitationData);
  },

  /**
   * THÊM MỚI: Cập nhật thông tin của một thành viên
   * @param {string} userId - ID của người dùng cần cập nhật
   * @param {object} updateData - Dữ liệu cần cập nhật { role, status }
   */
  updateMember(userId, updateData) {
    return api.put(`/clients/me/members/${userId}`, updateData);
  },

  /**
   * Xóa một thành viên khỏi team
   * @param {string} userId - ID của người dùng cần xóa
   */
  removeMember(userId) {
    return api.delete(`/clients/me/members/${userId}`);
  },
};

export default teamService;