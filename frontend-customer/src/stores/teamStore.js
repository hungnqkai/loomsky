import { defineStore } from 'pinia';
import { ref } from 'vue';
import teamService from '../services/teamService';

export const useTeamStore = defineStore('team', () => {
  // --- STATE ---
  const members = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const successMessage = ref(null);

  // --- ACTIONS ---

  // Xóa các thông báo
  function clearMessages() {
    error.value = null;
    successMessage.value = null;
  }

  // Lấy danh sách thành viên
  async function fetchMembers() {
    loading.value = true;
    clearMessages();
    try {
      const response = await teamService.getMembers();
      members.value = response.data.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch team members.';
    } finally {
      loading.value = false;
    }
  }

  // Mời thành viên mới
  async function inviteMember(invitationData) {
    loading.value = true;
    clearMessages();
    try {
      const response = await teamService.inviteMember(invitationData);
      successMessage.value = response.data.message;
      // Sau khi mời thành công, tải lại danh sách để cập nhật
      await fetchMembers();
      return true; // Trả về true để dialog có thể tự đóng
    } catch (err) {
      error.value = err.response?.data?.error || 'Invitation failed.';
      return false; // Trả về false nếu thất bại
    } finally {
      loading.value = false;
    }
  }

  // Xóa thành viên
  async function removeMember(userId) {
    loading.value = true;
    clearMessages();
    try {
      const response = await teamService.removeMember(userId);
      successMessage.value = response.data.message;
      // Tải lại danh sách sau khi xóa
      await fetchMembers();
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to remove member.';
    } finally {
      loading.value = false;
    }
  }

  return {
    members,
    loading,
    error,
    successMessage,
    clearMessages,
    fetchMembers,
    inviteMember,
    removeMember,
  };
});