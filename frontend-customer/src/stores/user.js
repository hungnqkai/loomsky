import { defineStore } from 'pinia';
import { ref } from 'vue';
import userService from '../services/userService';
import { useAuthStore } from './auth';

export const useUserStore = defineStore('user', () => {
  // State
  const loading = ref(false);
  const error = ref(null);
  const successMessage = ref(null);

  // Actions
  function clearMessages() {
    error.value = null;
    successMessage.value = null;
  }

  /**
   * Cập nhật thông tin cá nhân
   * @param {object} profileData - { first_name, last_name }
   */
  async function updateProfile(profileData) {
    loading.value = true;
    clearMessages();
    try {
      const response = await userService.updateMe(profileData);
      const authStore = useAuthStore();
      
      // Cập nhật lại thông tin user trong authStore
      authStore.user = response.data.data;
      localStorage.setItem('user', JSON.stringify(authStore.user));

      successMessage.value = 'Cập nhật thông tin thành công!';
    } catch (err) {
      error.value = err.response?.data?.message || 'Cập nhật thất bại.';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Thay đổi mật khẩu
   * @param {object} passwordData - { oldPassword, newPassword }
   */
  async function changePassword(passwordData) {
    loading.value = true;
    clearMessages();
    try {
      await userService.changePassword(passwordData);
      successMessage.value = 'Đổi mật khẩu thành công!';
    } catch (err) {
      error.value = err.response?.data?.message || 'Đổi mật khẩu thất bại.';
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    successMessage,
    clearMessages,
    updateProfile,
    changePassword,
  };
});
