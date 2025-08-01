import { defineStore } from 'pinia';
import { ref } from 'vue';
import clientService from '../services/clientService';

export const useClientStore = defineStore('client', () => {
  // --- STATE ---
  const client = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const successMessage = ref(null);

  // --- ACTIONS ---

  function clearMessages() {
    error.value = null;
    successMessage.value = null;
  }

  // Lấy thông tin client
  async function fetchClient() {
    loading.value = true;
    clearMessages();
    try {
      const response = await clientService.getMe();
      client.value = response.data.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch client details.';
    } finally {
      loading.value = false;
    }
  }

  // Cập nhật thông tin client
  async function updateClient(clientData) {
    loading.value = true;
    clearMessages();
    try {
      const response = await clientService.updateMe(clientData);
      client.value = response.data.data; // Cập nhật lại state với dữ liệu mới
      successMessage.value = response.data.message;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update client details.';
    } finally {
      loading.value = false;
    }
  }

  /**
   * THÊM ACTION MỚI
   * Xử lý việc tải lên logo
   * @param {File} file - File logo
   */
  async function uploadLogo(file) {
    loading.value = true; // Sử dụng loading chung
    clearMessages();
    try {
      const response = await clientService.uploadLogo(file);
      
      // Cập nhật logo_url trong state ngay lập tức
      if (client.value && response.data.data.logo_url) {
        client.value.logo_url = response.data.data.logo_url;
      }

      successMessage.value = response.data.message;
    } catch (err) {
      error.value = err.response?.data?.error || 'Logo upload failed.';
    } finally {
      loading.value = false;
    }
  }

  return {
    client,
    loading,
    error,
    successMessage,
    fetchClient,
    updateClient,
    uploadLogo,
    clearMessages,
  };
});