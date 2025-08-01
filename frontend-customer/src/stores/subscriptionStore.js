import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import subscriptionService from '../services/subscriptionService';

export const useSubscriptionStore = defineStore('subscription', () => {
  // --- STATE ---
  const subscription = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // --- GETTERS ---
  // Getter để dễ dàng truy cập vào các giới hạn trong 'features'
  const features = computed(() => subscription.value?.plan?.features || {});
  const teamMembersLimit = computed(() => features.value?.team_members_limit || 0);

  // --- ACTIONS ---
  async function fetchSubscription() {
    loading.value = true;
    error.value = null;
    try {
      const response = await subscriptionService.getMySubscription();
      subscription.value = response.data.data;
    } catch (err) {
      error.value = 'Không thể tải thông tin gói cước.';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  function clearSubscription() {
    subscription.value = null;
  }

  return {
    subscription,
    loading,
    error,
    features,
    teamMembersLimit,
    fetchSubscription,
    clearSubscription,
  };
});
