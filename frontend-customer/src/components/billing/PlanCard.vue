<template>
  <!-- Sử dụng LoomSkyCard làm nền tảng -->
  <LoomSkyCard class="d-flex flex-column" height="100%">
    <v-card-title class="text-h6 font-weight-bold">{{ plan.name }}</v-card-title>
    <v-card-subtitle>{{ plan.description }}</v-card-subtitle>

    <v-card-text>
      <!-- Hiển thị giá -->
      <div class="d-flex align-baseline mb-4">
        <span class="text-h4 font-weight-bold">${{ plan.price_monthly }}</span>
        <span class="text-medium-emphasis ml-1">/ tháng</span>
      </div>

      <!-- Danh sách tính năng -->
      <v-list density="compact" class="bg-transparent">
        <v-list-item
          v-for="(value, key) in plan.features"
          :key="key"
          class="px-0"
        >
          <template v-slot:prepend>
            <v-icon color="success" size="small" class="mr-2">mdi-check</v-icon>
          </template>
          <v-list-item-title class="text-body-2">{{ formatFeature(key, value) }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card-text>

    <v-spacer></v-spacer>

    <!-- Nút hành động -->
    <v-card-actions class="pa-4">
      <v-btn
        color="primary"
        variant="tonal"
        block
        @click="$emit('upgrade', plan)"
      >
        Nâng cấp
      </v-btn>
    </v-card-actions>
  </LoomSkyCard>
</template>

<script setup>
import LoomSkyCard from '@/components/common/LoomSkyCard.vue';

defineProps({
  plan: {
    type: Object,
    required: true,
  },
});

defineEmits(['upgrade']);

// Hàm tiện ích để định dạng tên tính năng cho dễ đọc
const formatFeature = (key, value) => {
    const keyMap = {
        team_members_limit: "thành viên",
        tracked_users_limit: "người dùng được theo dõi/tháng",
        projects_limit: "dự án",
        data_retention_days: "ngày lưu trữ dữ liệu",
        enable_ab_testing: "A/B Testing",
        api_access: "API Access"
    };
    const name = keyMap[key] || key.replace(/_/g, ' ');
    if (typeof value === 'boolean') {
        return value ? `Hỗ trợ ${name}` : `Không hỗ trợ ${name}`;
    }
    if (typeof value === 'object' && value !== null) {
        return value.enabled ? `Hỗ trợ ${name}` : `Không hỗ trợ ${name}`;
    }
    return `Tối đa ${value} ${name}`;
}
</script>
