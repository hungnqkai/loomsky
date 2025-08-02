<template>
  <!-- v-model="dialog" sẽ điều khiển việc đóng/mở dialog từ component cha -->
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <v-card rounded="lg">
      <v-card-title class="loomsky-h2">
        <v-icon :color="confirmColor" class="mr-2">{{ icon }}</v-icon>
        {{ title }}
      </v-card-title>
      <v-card-text class="py-4">
        <!-- Sử dụng v-html để có thể truyền message dạng HTML nếu cần -->
        <div v-html="message"></div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <!-- Nút Hủy (hành động phụ) -->
        <v-btn
          variant="text"
          @click="onCancel"
        >
          {{ cancelText }}
        </v-btn>
        <!-- Nút Xác nhận (hành động chính) -->
        <v-btn
          :color="confirmColor"
          variant="tonal"
          @click="onConfirm"
          :loading="loading"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue';

// Sử dụng v-model để component cha có thể điều khiển dialog
const dialog = defineModel({ type: Boolean, default: false });

const props = defineProps({
  title: { type: String, default: 'Xác nhận hành động' },
  message: { type: String, required: true },
  confirmText: { type: String, default: 'Xác nhận' },
  cancelText: { type: String, default: 'Hủy' },
  confirmColor: { type: String, default: 'primary' },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['confirm']);

// Tự động chọn icon dựa trên màu sắc
const icon = computed(() => {
  if (props.confirmColor === 'error') return 'mdi-alert-circle-outline';
  if (props.confirmColor === 'warning') return 'mdi-alert-outline';
  return 'mdi-help-circle-outline';
});

const onConfirm = () => {
  emit('confirm');
  // Không tự đóng dialog, để component cha quyết định sau khi xử lý xong
};

const onCancel = () => {
  dialog.value = false;
};
</script>
