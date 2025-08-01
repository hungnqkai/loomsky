<template>
  <div>
    <h1 class="mb-4">Thanh toán & Gói cước</h1>

    <div v-if="subscriptionStore.loading" class="text-center">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Đang tải thông tin gói cước...</p>
    </div>

    <v-alert v-else-if="subscriptionStore.error" type="error" variant="tonal">
      {{ subscriptionStore.error }}
    </v-alert>

    <v-row v-else-if="subscriptionStore.subscription">
      <!-- Cột thông tin gói cước hiện tại -->
      <v-col cols="12" md="5">
        <v-card>
          <v-card-item>
            <v-card-title>Gói cước hiện tại</v-card-title>
            <v-card-subtitle>Thông tin chi tiết về gói của bạn</v-card-subtitle>
          </v-card-item>
          <v-card-text>
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
              prepend-icon="mdi-calendar-start"
              title="Ngày bắt đầu"
              :subtitle="formatDate(subscriptionStore.subscription.start_date)"
            ></v-list-item>
            <v-list-item
              prepend-icon="mdi-calendar-end"
              :title="subscriptionStore.subscription.status === 'trialing' ? 'Ngày hết hạn dùng thử' : 'Ngày gia hạn tiếp theo'"
              :subtitle="formatDate(subscriptionStore.subscription.end_date)"
            ></v-list-item>
          </v-card-text>
          <v-card-actions>
            <v-btn block color="primary" variant="tonal">Nâng cấp gói</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Cột các giới hạn của gói -->
      <v-col cols="12" md="7">
        <v-card>
          <v-card-item>
            <v-card-title>Tính năng & Giới hạn</v-card-title>
          </v-card-item>
          <v-divider></v-divider>
          <v-list-item
            prepend-icon="mdi-account-group-outline"
            title="Số thành viên"
            :subtitle="`Tối đa ${subscriptionStore.features.team_members_limit} thành viên`"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-chart-line"
            title="Người dùng được theo dõi"
            :subtitle="`Tối đa ${subscriptionStore.features.tracked_users_limit} người dùng/tháng`"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-folder-multiple-outline"
            title="Số dự án"
            :subtitle="`Tối đa ${subscriptionStore.features.projects_limit} dự án`"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-history"
            title="Thời gian lưu trữ dữ liệu"
            :subtitle="`${subscriptionStore.features.data_retention_days} ngày`"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-test-tube"
            title="A/B Testing"
            :subtitle="subscriptionStore.features.enable_ab_testing ? 'Đã kích hoạt' : 'Không bao gồm'"
          ></v-list-item>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { useSubscriptionStore } from '@/stores/subscriptionStore';

const subscriptionStore = useSubscriptionStore();

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
</script>
