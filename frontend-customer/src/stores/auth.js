import { defineStore } from 'pinia';
import { ref, computed } from 'vue'; // Import computed
import authService from '../services/authService';
import router from '../router';

export const useAuthStore = defineStore('auth', () => {
  // --- STATE ---
  const user = ref(JSON.parse(localStorage.getItem('user')) || null); // Lấy user từ localStorage
  const accessToken = ref(localStorage.getItem('accessToken') || null);
  const refreshToken = ref(localStorage.getItem('refreshToken') || null);
  const loading = ref(false);
  const error = ref(null);
  const successMessage = ref(null);

  // --- GETTERS ---
  const isAuthenticated = computed(() => !!accessToken.value);

  // --- ACTIONS ---
  async function handleLogin(credentials) {
    loading.value = true;
    error.value = null;
    try {
      const response = await authService.login(credentials);
      
      const { user: userData, tokens } = response.data.data;

      user.value = userData;
      accessToken.value = tokens.access_token;
      refreshToken.value = tokens.refresh_token;

      localStorage.setItem('user', JSON.stringify(userData)); // Lưu user vào localStorage
      localStorage.setItem('accessToken', tokens.access_token);
      localStorage.setItem('refreshToken', tokens.refresh_token);

      // SỬA LỖI: Chuyển hướng đến dashboard sau khi đăng nhập thành công
      router.push({ name: 'dashboard' });

    } catch (err) {
      error.value = err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
    } finally {
      loading.value = false;
    }
  }

  async function handleRegister(data) {
    loading.value = true;
    error.value = null;
    try {
      await authService.register(data);
      // Đăng ký thành công, chuyển hướng đến trang thông báo xác thực email
      router.push({ name: 'verify-email-notice' });
    } catch (err) {
      error.value = err.response?.data?.message || 'Đăng ký không thành công. Vui lòng thử lại.';
    } finally {
      loading.value = false;
    }
  }

  async function handleVerifyEmail(token) {
    loading.value = true;
    error.value = null;
    try {
      await authService.verifyEmail(token);
      loading.value = false;
      return true; // Trả về true nếu thành công
    } catch (err) {
      error.value = err.response?.data?.message || 'Xác thực không thành công.';
      loading.value = false;
      return false; // Trả về false nếu thất bại
    }
  }

  function handleLogout() {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;

    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    router.push({ name: 'login' });
  }

  async function handleForgotPassword(emailData) {
    loading.value = true;
    clearMessages();
    try {
      const response = await authService.forgotPassword(emailData);
      successMessage.value = response.data.message || 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.';
    } catch (err) {
      error.value = err.response?.data?.message || 'Đã có lỗi xảy ra.';
    } finally {
      loading.value = false;
    }
  }

  // THÊM ACTION MỚI
  async function handleResetPassword(resetData) {
    loading.value = true;
    clearMessages();
    try {
      const response = await authService.resetPassword(resetData);
      successMessage.value = response.data.message || 'Mật khẩu của bạn đã được đặt lại thành công!';
    } catch (err) {
      error.value = err.response?.data?.message || 'Đã có lỗi xảy ra. Token có thể không hợp lệ hoặc đã hết hạn.';
    } finally {
      loading.value = false;
    }
  }

  // THÊM ACTION MỚI
  function clearMessages() {
    error.value = null;
    successMessage.value = null;
  }

  return {
    user,
    accessToken,
    loading,
    error,
    successMessage,
    isAuthenticated,
    handleLogin,
    handleRegister,
    handleVerifyEmail,
    handleLogout,
    handleForgotPassword,
    clearMessages,
    handleResetPassword
  };
});
