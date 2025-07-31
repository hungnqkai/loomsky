<template>
  <v-card
    class="mx-auto pa-6"
    elevation="8"
    max-width="500"
    rounded="lg"
  >
    <v-card-title class="text-center text-h5 font-weight-bold text-primary mb-2">
      Đặt lại mật khẩu
    </v-card-title>
    <v-card-subtitle class="text-center mb-6">
      Nhập mật khẩu mới cho tài khoản của bạn.
    </v-card-subtitle>

    <!-- Hiển thị thông báo thành công hoặc lỗi -->
    <v-alert
      v-if="authStore.successMessage"
      type="success"
      variant="tonal"
      class="mb-4"
      density="compact"
    >
      {{ authStore.successMessage }}
      <v-btn color="primary" block class="mt-4" to="/auth/login">
        Đi đến trang Đăng nhập
      </v-btn>
    </v-alert>
    <v-alert
      v-if="authStore.error"
      type="error"
      variant="tonal"
      class="mb-4"
      density="compact"
    >
      {{ authStore.error }}
    </v-alert>

    <v-card-text>
      <v-form @submit.prevent="onReset" v-if="!authStore.successMessage">
        <div class="text-subtitle-1 text-medium-emphasis">Mật khẩu mới</div>
        <v-text-field
          v-model="password"
          density="compact"
          placeholder="Nhập mật khẩu mới"
          prepend-inner-icon="mdi-lock-outline"
          variant="outlined"
          type="password"
          required
        />

        <div class="text-subtitle-1 text-medium-emphasis">Xác nhận mật khẩu</div>
        <v-text-field
          v-model="confirmPassword"
          density="compact"
          placeholder="Nhập lại mật khẩu mới"
          prepend-inner-icon="mdi-lock-check-outline"
          variant="outlined"
          type="password"
          required
        />

        <v-btn
          :loading="authStore.loading"
          :disabled="authStore.loading"
          type="submit"
          block
          class="mb-4"
          color="primary"
          size="large"
          variant="tonal"
        >
          Lưu mật khẩu mới
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();
const password = ref('');
const confirmPassword = ref('');
const token = ref('');

onMounted(() => {
  // Lấy token từ URL khi component được tạo
  token.value = route.query.token;
});

const onReset = () => {
  if (password.value && password.value === confirmPassword.value) {
    authStore.handleResetPassword({
      token: token.value,
      password: password.value,
    });
  } else if (password.value !== confirmPassword.value) {
    authStore.error = 'Mật khẩu xác nhận không khớp.';
  }
};

// Xóa thông báo khi người dùng rời khỏi trang
onUnmounted(() => {
  authStore.clearMessages();
});
</script>
