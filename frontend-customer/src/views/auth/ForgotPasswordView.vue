<template>
  <v-card
    class="mx-auto pa-6"
    elevation="8"
    max-width="500"
    rounded="lg"
  >
    <v-card-title class="text-center text-h5 font-weight-bold text-primary mb-2">
      Quên mật khẩu
    </v-card-title>
    <v-card-subtitle class="text-center mb-6">
      Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.
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
      <v-form @submit.prevent="onRequest" v-if="!authStore.successMessage">
        <div class="text-subtitle-1 text-medium-emphasis">Địa chỉ Email</div>
        <v-text-field
          v-model="email"
          density="compact"
          placeholder="Nhập địa chỉ email"
          prepend-inner-icon="mdi-email-outline"
          variant="outlined"
          type="email"
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
          Gửi hướng dẫn
        </v-btn>
      </v-form>

      <div class="text-center mt-4">
        <router-link to="/auth/login" class="text-primary text-decoration-none">
          <v-icon icon="mdi-chevron-left"></v-icon> Quay lại trang Đăng nhập
        </router-link>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const email = ref('');

const onRequest = () => {
  if (email.value) {
    authStore.handleForgotPassword({ email: email.value });
  }
};

// Xóa thông báo khi người dùng rời khỏi trang
onUnmounted(() => {
  authStore.clearMessages();
});
</script>
