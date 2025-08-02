<template>
  <div>
    <h2 class="text-h5 font-weight-bold mb-4">Thanh toán & Gói cước</h2>

    <!-- Thông báo -->
    <v-alert v-if="subscriptionStore.successMessage" type="success" variant="tonal" class="mb-4" density="compact" closable @click:close="subscriptionStore.clearMessages()">{{ subscriptionStore.successMessage }}</v-alert>
    <v-alert v-if="subscriptionStore.error" type="error" variant="tonal" class="mb-4" density="compact" closable @click:close="subscriptionStore.clearMessages()">{{ subscriptionStore.error }}</v-alert>

    <v-row>
      <!-- Cột chính bên trái -->
      <v-col cols="12" md="8">
        <!-- Card: Gói cước hiện tại -->
        <LoomSkyCard class="mb-6">
          <v-card-title>Gói cước hiện tại</v-card-title>
          <v-card-text v-if="subscriptionStore.loading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </v-card-text>
          <v-card-text v-else-if="subscriptionStore.subscription">
            <div class="d-flex align-center mb-4">
              <v-chip color="primary" class="mr-4 text-h6 pa-6 font-weight-bold" rounded="lg">
                {{ subscriptionStore.subscription.plan.name }}
              </v-chip>
              <div>
                <p class="text-caption text-medium-emphasis">Trạng thái</p>
                <v-chip :color="statusColor(subscriptionStore.subscription.status)" variant="flat" size="small" class="font-weight-bold">
                  {{ subscriptionStore.subscription.status }}
                </v-chip>
              </div>
            </div>
            <v-list-item
              prepend-icon="mdi-calendar-end"
              title="Ngày gia hạn tiếp theo"
              :subtitle="formatDate(subscriptionStore.subscription.end_date)"
              class="px-0"
            ></v-list-item>
            <v-btn
              v-if="subscriptionStore.subscription.status === 'active'"
              color="error"
              variant="outlined"
              class="mt-4"
              @click="openCancelDialog"
              :loading="subscriptionStore.actionLoading"
            >
              Hủy gói cước
            </v-btn>
            <div v-if="subscriptionStore.subscription.status === 'canceled'" class="mt-4 text-warning text-body-2">
              Gói cước của bạn sẽ không tự động gia hạn và sẽ hết hiệu lực sau ngày {{ formatDate(subscriptionStore.subscription.end_date) }}.
            </div>
          </v-card-text>
          <v-card-text v-else class="py-8">
            Bạn đang sử dụng gói miễn phí. Hãy nâng cấp để trải nghiệm đầy đủ tính năng.
          </v-card-text>
        </LoomSkyCard>

        <!-- Card: Lịch sử giao dịch -->
        <LoomSkyCard>
          <v-card-title>Lịch sử Giao dịch</v-card-title>
          <v-data-table
            :headers="paymentHeaders"
            :items="subscriptionStore.payments || []"
            :loading="subscriptionStore.loading"
            item-value="id"
            class="elevation-0"
            no-data-text="Không có giao dịch nào."
          >
            <template #item.paid_at="{ item }">{{ formatDate(item.paid_at) }}</template>
            <template #item.amount="{ item }">${{ item.amount }} {{ item.currency }}</template>
            <template #item.status="{ item }">
              <v-chip :color="paymentStatusColor(item.status)" size="small">{{ item.status }}</v-chip>
            </template>
          </v-data-table>
        </LoomSkyCard>
      </v-col>

      <!-- Cột phụ bên phải -->
      <v-col cols="12" md="4">
        <!-- Card: Phương thức thanh toán -->
        <LoomSkyCard>
          <v-card-title>Phương thức Thanh toán</v-card-title>
          <v-card-text v-if="subscriptionStore.subscription && subscriptionStore.subscription.provider === 'paypal'">
            <div class="d-flex align-center">
              <img src="https://www.paypalobjects.com/webstatic/mktg/logo/AM_SbyPP_mc_vs_dc_ae.jpg" height="30" alt="PayPal Logo"/>
              <div class="ml-4">
                <div class="font-weight-bold">PayPal</div>
                <div class="text-caption">Thanh toán định kỳ đang hoạt động.</div>
              </div>
            </div>
            <v-btn
              href="https://www.paypal.com/myaccount/autopay/"
              target="_blank"
              variant="outlined"
              class="mt-4"
              block
            >
              Quản lý tại PayPal
            </v-btn>
          </v-card-text>
          <v-card-text v-else>
            Chưa có phương thức thanh toán nào được liên kết.
          </v-card-text>
        </LoomSkyCard>
      </v-col>
    </v-row>

    <!-- Khu vực Nâng cấp -->
    <div class="mt-10">
      <h3 class="text-h5 font-weight-bold mb-4">Nâng cấp gói cước của bạn</h3>
      <v-row>
        <v-col
          v-for="plan in subscriptionStore.upgradeablePlans"
          :key="plan.id"
          cols="12"
          md="6"
        >
          <PlanCard :plan="plan" @upgrade="openUpgradeDialog" />
        </v-col>
      </v-row>
    </div>

    <!-- Dialog Nâng cấp & Thanh toán -->
    <v-dialog v-model="upgradeDialog" max-width="600px" persistent>
      <LoomSkyCard>
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-h5">Nâng cấp gói cước</span>
          <v-btn icon="mdi-close" variant="text" @click="closeUpgradeDialog"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <p class="mb-4">Bạn đang nâng cấp từ gói <strong>{{ subscriptionStore.subscription?.plan?.name || 'Free' }}</strong> lên gói <strong>{{ selectedPlan?.name }}</strong>.</p>
          <v-btn-toggle v-model="billingCycle" color="primary" variant="outlined" mandatory divided>
            <v-btn value="monthly" class="flex-grow-1 text-none">
              <div>
                <div class="font-weight-bold">Thanh toán hàng tháng</div>
                <div>${{ selectedPlan?.price_monthly }} / tháng</div>
              </div>
            </v-btn>
            <v-btn value="yearly" class="flex-grow-1 text-none">
              <div>
                <div class="font-weight-bold">Thanh toán hàng năm</div>
                <div>${{ selectedPlan?.price_yearly }} / năm</div>
                <v-chip color="success" size="small" class="mt-1">Tiết kiệm 15%</v-chip>
              </div>
            </v-btn>
          </v-btn-toggle>
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-2">Tóm tắt đơn hàng</h3>
          <div class="d-flex justify-space-between">
            <span>{{ selectedPlan?.name }} (Thanh toán hàng {{ billingCycle === 'monthly' ? 'tháng' : 'năm' }})</span>
            <span class="font-weight-bold">${{ finalPrice }}</span>
          </div>
          <v-divider class="my-2"></v-divider>
          <div class="d-flex justify-space-between font-weight-bold text-h6">
            <span>Tổng cộng</span>
            <span>${{ finalPrice }}</span>
          </div>
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-2">Phương thức thanh toán</h3>
          <div class="text-center mt-4">
            <div id="paypal-button-container" ref="paypalButtonContainer"></div>
            <v-alert v-if="paypalError" type="error" density="compact" class="mt-4">{{ paypalError }}</v-alert>
          </div>
        </v-card-text>
      </LoomSkyCard>
    </v-dialog>

    <!-- Dialog Xác nhận Hủy -->
    <ConfirmDialog
      v-model="cancelDialog"
      title="Xác nhận hủy"
      :message="`Bạn có chắc chắn muốn hủy gia hạn tự động không? Gói cước của bạn sẽ vẫn có hiệu lực cho đến hết <strong>${formatDate(subscriptionStore.subscription?.end_date)}</strong>.`"
      confirm-text="Đồng ý hủy"
      confirm-color="error"
      :loading="subscriptionStore.actionLoading"
      @confirm="handleCancel"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import LoomSkyCard from '@/components/common/LoomSkyCard.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import PlanCard from '@/components/billing/PlanCard.vue';

const subscriptionStore = useSubscriptionStore();

const upgradeDialog = ref(false);
const cancelDialog = ref(false);
const selectedPlan = ref(null);
const billingCycle = ref('monthly');
const paypalButtonContainer = ref(null);
const paypalError = ref(null);

const paymentHeaders = [
  { title: 'Ngày', value: 'paid_at', sortable: true },
  { title: 'Số tiền', value: 'amount', sortable: true },
  { title: 'Trạng thái', value: 'status', sortable: true },
  { title: 'Mã Giao dịch', value: 'transaction_id', sortable: false },
];

onMounted(async () => {
  await Promise.all([
    subscriptionStore.fetchSubscription(),
    subscriptionStore.fetchPlans(),
    subscriptionStore.fetchPaymentHistory()
  ]);
}); 

const finalPrice = computed(() => {
  if (!selectedPlan.value) return 0;
  return billingCycle.value === 'monthly'
    ? selectedPlan.value.price_monthly
    : selectedPlan.value.price_yearly;
});

const openUpgradeDialog = (plan) => {
  selectedPlan.value = plan;
  upgradeDialog.value = true;
};

const closeUpgradeDialog = () => {
  upgradeDialog.value = false;
  selectedPlan.value = null;
  paypalError.value = null;
  if (paypalButtonContainer.value) paypalButtonContainer.value.innerHTML = '';
};

watch([upgradeDialog, billingCycle], ([isDialogOpen]) => {
  if (isDialogOpen) nextTick(() => renderPayPalButton());
});

const renderPayPalButton = () => {
  paypalError.value = null;
  if (!window.paypal || !paypalButtonContainer.value) {
    paypalError.value = 'Lỗi khi tải PayPal SDK. Vui lòng thử lại.';
    return;
  }
  paypalButtonContainer.value.innerHTML = '';

  window.paypal.Buttons({
      createSubscription: async () => {
        const subscriptionId = await subscriptionStore.handleCreateSubscription({
          planId: selectedPlan.value.id,
          billingCycle: billingCycle.value,
        });
        if (subscriptionId) return subscriptionId;
        paypalError.value = subscriptionStore.error;
        return null;
      },
      onApprove: () => {
        subscriptionStore.successMessage = 'Đăng ký thành công! Gói cước của bạn sẽ được kích hoạt trong ít phút.';
        subscriptionStore.fetchSubscription();
        subscriptionStore.fetchPaymentHistory();
        closeUpgradeDialog();
      },
      onError: (err) => {
          console.error('PayPal Button Error:', err);
          paypalError.value = 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.';
      }
    }).render('#paypal-button-container');
};

const openCancelDialog = () => { cancelDialog.value = true; };
const handleCancel = async () => {
  const success = await subscriptionStore.handleCancelSubscription();
  if (success) cancelDialog.value = false;
};

const paymentStatusColor = (status) => (status === 'succeeded' ? 'success' : status === 'pending' ? 'warning' : 'error');
const formatDate = (dateString) => (dateString ? new Date(dateString).toLocaleDateString('vi-VN') : 'N/A');
const statusColor = (status) => {
  const map = { active: 'success', trialing: 'info', past_due: 'warning', canceled: 'error' };
  return map[status] || 'grey';
};
</script>
