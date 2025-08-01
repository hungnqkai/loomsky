<template>
  <div>
    <h1 class="text-h4 mb-4">Thanh toán & Gói cước</h1>

    <!-- HIỂN THỊ THÔNG BÁO CHUNG -->
    <v-alert
      v-if="subscriptionStore.successMessage"
      type="success"
      variant="tonal"
      class="mb-4"
      density="compact"
      closable
      @click:close="subscriptionStore.clearMessages()"
    >
      {{ subscriptionStore.successMessage }}
    </v-alert>
    <v-alert
      v-if="subscriptionStore.error"
      type="error"
      variant="tonal"
      class="mb-4"
      density="compact"
      closable
      @click:close="subscriptionStore.clearMessages()"
    >
      {{ subscriptionStore.error }}
    </v-alert>

    <v-row>
      <!-- Cột chính bên trái -->
      <v-col cols="12" md="8">
        <!-- KHUNG THÔNG TIN GÓI CƯỚC HIỆN TẠI -->
        <v-card class="mb-6">
          <v-card-title>Gói cước hiện tại</v-card-title>
          <v-card-text v-if="subscriptionStore.loading" class="text-center">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </v-card-text>
          <v-card-text v-else-if="subscriptionStore.subscription">
            <div class="d-flex align-center mb-4">
              <v-chip color="primary" class="mr-4 text-h5 pa-6">
                {{ subscriptionStore.subscription.plan.name }}
              </v-chip>
              <div>
                <p class="text-medium-emphasis">Trạng thái</p>
                <v-chip :color="statusColor(subscriptionStore.subscription.status)" variant="flat" size="small">
                  {{ subscriptionStore.subscription.status }}
                </v-chip>
              </div>
            </div>
            <v-list-item
              prepend-icon="mdi-calendar-end"
              title="Ngày gia hạn tiếp theo"
              :subtitle="formatDate(subscriptionStore.subscription.end_date)"
            ></v-list-item>
            <v-btn
              v-if="subscriptionStore.subscription.status === 'active'"
              color="error"
              variant="tonal"
              class="mt-4"
              @click="openCancelDialog"
              :loading="subscriptionStore.actionLoading"
            >
              Hủy gói cước
            </v-btn>
            <div v-if="subscriptionStore.subscription.status === 'canceled'" class="mt-4 text-warning">
              Gói cước của bạn sẽ không tự động gia hạn và sẽ hết hiệu lực sau ngày {{ formatDate(subscriptionStore.subscription.end_date) }}.
            </div>
          </v-card-text>
          <v-card-text v-else>
            Bạn đang sử dụng gói miễn phí.
          </v-card-text>
        </v-card>

        <!-- LỊCH SỬ GIAO DỊCH -->
        <v-card>
          <v-card-title>Lịch sử Giao dịch</v-card-title>
          <v-data-table
            :headers="paymentHeaders"
            :items="subscriptionStore.payments || []"
            :loading="subscriptionStore.loading"
            item-value="id"
            class="elevation-0"
            no-data-text="Không có giao dịch nào."
          >
            <template v-slot:item.paid_at="{ item }">
              {{ formatDate(item.paid_at) }}
            </template>
            <template v-slot:item.amount="{ item }">
              ${{ item.amount }} {{ item.currency }}
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip :color="paymentStatusColor(item.status)" size="small">{{ item.status }}</v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <!-- Cột phụ bên phải -->
      <v-col cols="12" md="4">
        <!-- PHƯƠNG THỨC THANH TOÁN -->
        <v-card class="mb-6">
          <v-card-title>Phương thức Thanh toán</v-card-title>
          <v-card-text v-if="subscriptionStore.subscription && subscriptionStore.subscription.provider === 'paypal'">
            <div class="d-flex align-center">
              <img src="https://www.paypalobjects.com/webstatic/mktg/logo/AM_SbyPP_mc_vs_dc_ae.jpg" height="40" alt="PayPal Logo"/>
              <div class="ml-4">
                <div class="font-weight-bold">PayPal</div>
                <div class="text-caption">Thanh toán định kỳ đang hoạt động.</div>
              </div>
            </div>
            <v-btn
              href="https://www.paypal.com/myaccount/autopay/"
              target="_blank"
              variant="tonal"
              class="mt-4"
              block
            >
              Quản lý tại PayPal
            </v-btn>
          </v-card-text>
          <v-card-text v-else>
            Chưa có phương thức thanh toán nào.
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- KHUNG CÁC GÓI NÂNG CẤP -->
    <v-row class="mt-4">
      <v-col cols="12">
        <h2 class="text-h5 mb-2">Nâng cấp gói cước</h2>
      </v-col>
      <v-col
        v-for="plan in subscriptionStore.upgradeablePlans"
        :key="plan.id"
        cols="12"
        md="6"
      >
        <v-card class="d-flex flex-column" height="100%">
          <v-card-title>{{ plan.name }}</v-card-title>
          <v-card-subtitle>{{ plan.description }}</v-card-subtitle>
          <v-card-text>
            <div class="d-flex align-baseline">
              <span class="text-h4 font-weight-bold">${{ plan.price_monthly }}</span>
              <span class="text-medium-emphasis ml-1">/ tháng</span>
            </div>
            <v-list-item
              v-for="(value, key) in plan.features"
              :key="key"
              density="compact"
              class="pa-0"
            >
              <template v-slot:['item.prepend']>
                <v-icon color="success" size="small">mdi-check</v-icon>
              </template>
              <v-list-item-title class="ml-2">{{ formatFeature(key, value) }}</v-list-item-title>
            </v-list-item>
          </v-card-text>
          <v-spacer></v-spacer>
          <v-card-actions>
            <v-btn
              color="primary"
              variant="tonal"
              block
              @click="openUpgradeDialog(plan)"
            >
              Nâng cấp
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- DIALOG NÂNG CẤP & THANH TOÁN -->
    <v-dialog v-model="upgradeDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-h5">Nâng cấp gói cước</span>
          <v-btn icon="mdi-close" variant="text" @click="closeUpgradeDialog"></v-btn>
        </v-card-title>
        <v-divider></v-divider>

        <v-card-text>
          <p class="mb-4">
            Bạn đang nâng cấp từ gói
            <strong>{{ subscriptionStore.subscription?.plan?.name || 'Free' }}</strong>
            lên gói <strong>{{ selectedPlan?.name }}</strong>.
          </p>

          <!-- Lựa chọn chu kỳ thanh toán -->
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

          <!-- Tóm tắt đơn hàng -->
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

          <!-- Phương thức thanh toán -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-2">Phương thức thanh toán</h3>
          <v-card variant="outlined">
             <v-card-text class="d-flex align-center">
                <img src="https://www.paypalobjects.com/webstatic/mktg/logo/AM_SbyPP_mc_vs_dc_ae.jpg" height="40" alt="PayPal Logo"/>
                <div class="ml-4">
                    <div class="font-weight-bold">PayPal</div>
                    <div class="text-caption">Bạn sẽ được chuyển đến cổng thanh toán an toàn của PayPal.</div>
                </div>
             </v-card-text>
          </v-card>

          <!-- Khu vực thanh toán -->
          <div class="text-center mt-4">
            <div id="paypal-button-container" ref="paypalButtonContainer">
              <!-- Nút PayPal sẽ được render ở đây -->
            </div>
            <v-alert v-if="paypalError" type="error" density="compact" class="mt-4">{{ paypalError }}</v-alert>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- DIALOG XÁC NHẬN HỦY GÓI CƯỚC -->
    <v-dialog v-model="cancelDialog" max-width="500px">
        <v-card>
            <v-card-title class="text-h5">Xác nhận hủy</v-card-title>
            <v-card-text>
                Bạn có chắc chắn muốn hủy gia hạn tự động không? Gói cước của bạn sẽ vẫn có hiệu lực cho đến hết
                <strong>{{ formatDate(subscriptionStore.subscription?.end_date) }}</strong>.
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="closeCancelDialog">Không</v-btn>
                <v-btn color="error" @click="handleCancel" :loading="subscriptionStore.actionLoading">Đồng ý hủy</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

const subscriptionStore = useSubscriptionStore();

// --- State ---
const upgradeDialog = ref(false);
const cancelDialog = ref(false);
const selectedPlan = ref(null);
const billingCycle = ref('monthly');
const paypalButtonContainer = ref(null);
const paypalError = ref(null);

// Headers cho bảng lịch sử giao dịch
const paymentHeaders = [
  { title: 'Ngày', value: 'paid_at', sortable: true },
  { title: 'Số tiền', value: 'amount', sortable: true },
  { title: 'Trạng thái', value: 'status', sortable: true },
  { title: 'Mã Giao dịch', value: 'transaction_id', sortable: false },
];

// --- Vòng đời Component ---
onMounted(async () => {
  try {
    // Gọi các API cần thiết
    await Promise.all([
      subscriptionStore.fetchSubscription(),
      subscriptionStore.fetchPlans(),
      subscriptionStore.fetchPaymentHistory()
    ]);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}); 

// --- Computed Properties ---
const finalPrice = computed(() => {
  if (!selectedPlan.value) return 0;
  return billingCycle.value === 'monthly'
    ? selectedPlan.value.price_monthly
    : selectedPlan.value.price_yearly;
});

// --- Logic Nâng cấp & PayPal ---
const openUpgradeDialog = (plan) => {
  selectedPlan.value = plan;
  upgradeDialog.value = true;
};

const closeUpgradeDialog = () => {
  upgradeDialog.value = false;
  selectedPlan.value = null;
  paypalError.value = null;
  if (paypalButtonContainer.value) {
    paypalButtonContainer.value.innerHTML = '';
  }
};

// Theo dõi khi dialog mở ra hoặc chu kỳ thanh toán thay đổi để render lại nút PayPal
watch([upgradeDialog, billingCycle], ([isDialogOpen, newCycle], [wasDialogOpen, oldCycle]) => {
  if (isDialogOpen) {
    nextTick(() => {
      renderPayPalButton();
    });
  }
});

const renderPayPalButton = () => {
  paypalError.value = null;
  if (!window.paypal || !paypalButtonContainer.value) {
    paypalError.value = 'Lỗi khi tải PayPal SDK. Vui lòng thử lại.';
    return;
  }
  paypalButtonContainer.value.innerHTML = '';

  window.paypal.Buttons({
      createSubscription: async (data, actions) => {
        const subscriptionId = await subscriptionStore.handleCreateSubscription({
          planId: selectedPlan.value.id,
          billingCycle: billingCycle.value,
        });

        if (subscriptionId) {
          return subscriptionId;
        } else {
          paypalError.value = subscriptionStore.error;
          return null;
        }
      },
      onApprove: (data, actions) => {
        console.log('Subscription approved:', data);
        subscriptionStore.successMessage = 'Đăng ký thành công! Gói cước của bạn sẽ được kích hoạt trong ít phút.';
        subscriptionStore.fetchSubscription();
        subscriptionStore.fetchPaymentHistory(); // Refresh payment history
        closeUpgradeDialog();
      },
      onError: (err) => {
          console.error('PayPal Button Error:', err);
          paypalError.value = 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.';
      }
    })
    .render('#paypal-button-container');
};

// --- Logic Hủy Gói Cước ---
const openCancelDialog = () => {
  cancelDialog.value = true;
};
const closeCancelDialog = () => {
  cancelDialog.value = false;
};
const handleCancel = async () => {
  const success = await subscriptionStore.handleCancelSubscription();
  if (success) {
    closeCancelDialog();
  }
};

// --- Hàm Tiện Ích ---
const paymentStatusColor = (status) => {
    if (status === 'succeeded') return 'success';
    if (status === 'pending') return 'warning';
    return 'error';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const statusColor = (status) => {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'success';
    case 'past_due':
      return 'warning';
    case 'canceled':
      return 'error';
    default:
      return 'grey';
  }
};

const formatFeature = (key, value) => {
    const keyMap = {
        team_members_limit: "thành viên",
        tracked_users_limit: "người dùng được theo dõi/tháng",
        projects_limit: "dự án",
        data_retention_days: "ngày lưu trữ dữ liệu",
        enable_ab_testing: "A/B Testing"
    };
    const name = keyMap[key] || key.replace(/_/g, ' ');
    if (typeof value === 'boolean') {
        return value ? `Hỗ trợ ${name}` : `Không hỗ trợ ${name}`;
    }
    return `Tối đa ${value} ${name}`;
}
</script>