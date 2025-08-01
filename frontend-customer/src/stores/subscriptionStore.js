import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import subscriptionService from '../services/subscriptionService';
import paymentService from '../services/paymentService'; // Import service mới

export const useSubscriptionStore = defineStore('subscription', () => {
  // --- STATE ---
  const subscription = ref(null); // Gói cước hiện tại của người dùng
  const plans = ref([]); // Danh sách tất cả các gói cước có thể đăng ký
  const payments = ref([]); 
  const loading = ref(false); // Loading chung cho việc lấy dữ liệu
  const actionLoading = ref(false); // Loading cho các hành động (hủy, nâng cấp)
  const error = ref(null);
  const successMessage = ref(null);

  // --- GETTERS ---
  const features = computed(() => subscription.value?.plan?.features || {});
  const teamMembersLimit = computed(() => features.value?.team_members_limit || 0);
  // Getter để lấy các gói có thể nâng cấp (khác gói hiện tại)
  const upgradeablePlans = computed(() => {
    if (!subscription.value || !subscription.value.plan) return plans.value;
    return plans.value.filter(p => p.id !== subscription.value.plan_id);
  });

  // --- ACTIONS ---

  function clearMessages() {
    error.value = null;
    successMessage.value = null;
  }

  // Lấy thông tin gói cước hiện tại của người dùng
  async function fetchSubscription() {
    loading.value = true;
    error.value = null;
    try {
      const response = await subscriptionService.getMySubscription();
      subscription.value = response.data.data;
    } catch (err) {
      // Không coi là lỗi nếu người dùng chưa có subscription
      if (err.response?.status !== 404) {
        error.value = 'Không thể tải thông tin gói cước.';
      }
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  // Lấy danh sách tất cả các gói cước
  async function fetchPlans() {
    loading.value = true;
    error.value = null;
    try {
        const response = await subscriptionService.getPlans();
        plans.value = response.data.data;
    } catch (err) {
        error.value = 'Không thể tải danh sách các gói cước.';
        console.error(err);
    } finally {
        loading.value = false;
    }
  }

  /**
   * THÊM ACTION MỚI
   * Lấy lịch sử thanh toán
   */
  async function fetchPaymentHistory() {
    loading.value = true;
    try {
      const response = await paymentService.getHistory();
      payments.value = response.data.data;
    } catch (err) {
      error.value = 'Không thể tải lịch sử thanh toán.';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  // Bắt đầu quá trình tạo subscription với nhà cung cấp
  async function handleCreateSubscription(payload) {
    actionLoading.value = true;
    clearMessages();
    try {
        const response = await paymentService.createSubscription({
            ...payload,
            provider: 'paypal' // Tạm thời hard-code
        });
        // Trả về ID từ PayPal để frontend có thể render nút thanh toán
        return response.data.data.subscriptionId;
    } catch (err) {
        error.value = err.response?.data?.error || 'Tạo phiên thanh toán thất bại.';
        console.error(err);
        return null;
    } finally {
        actionLoading.value = false;
    }
  }

  // Xử lý hủy gói cước
  async function handleCancelSubscription() {
    actionLoading.value = true;
    clearMessages();
    try {
        const response = await subscriptionService.cancelSubscription();
        successMessage.value = response.data.message;
        // Tải lại thông tin gói cước để cập nhật trạng thái mới
        await fetchSubscription();
        return true;
    } catch (err) {
        error.value = err.response?.data?.error || 'Hủy gói cước thất bại.';
        console.error(err);
        return false;
    } finally {
        actionLoading.value = false;
    }
  }

  function clearSubscription() {
    subscription.value = null;
  }

  return {
    subscription,
    plans,
    loading,
    actionLoading,
    error,
    successMessage,
    features,
    teamMembersLimit,
    upgradeablePlans,
    fetchSubscription,
    fetchPlans,
    fetchPaymentHistory,
    handleCreateSubscription,
    handleCancelSubscription,
    clearSubscription,
    clearMessages,
  };
});