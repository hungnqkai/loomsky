<template>
  <v-card
    class="mx-auto pa-6 text-center"
    elevation="8"
    max-width="500"
    rounded="lg"
  >
    <div v-if="authStore.loading">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <h2 class="mt-4">Đang xác thực email...</h2>
      <p>Vui lòng đợi trong giây lát.</p>
    </div>

    <div v-else-if="verificationStatus === 'success'">
      <v-icon icon="mdi-check-circle-outline" color="success" size="80"></v-icon>
      <h2 class="mt-4 text-success">Xác thực thành công!</h2>
      <p>Tài khoản của bạn đã được kích hoạt.</p>
      <v-btn color="primary" class="mt-4" to="/auth/login">
        Đi đến trang Đăng nhập
      </v-btn>
    </div>

    <div v-else-if="verificationStatus === 'error'">
      <v-icon icon="mdi-alert-circle-outline" color="error" size="80"></v-icon>
      <h2 class="mt-4 text-error">Xác thực thất bại</h2>
      <p>{{ authStore.error || 'Token không hợp lệ hoặc đã hết hạn.' }}</p>
      <v-btn color="primary" class="mt-4" to="/auth/login">
        Quay lại Đăng nhập
      </v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();
const verificationStatus = ref(''); // 'success' or 'error'

onMounted(async () => {
  const token = route.query.token;
  if (token) {
    const success = await authStore.handleVerifyEmail(token);
    verificationStatus.value = success ? 'success' : 'error';
  } else {
    authStore.error = 'Không tìm thấy token xác thực.';
    verificationStatus.value = 'error';
  }
});
</script>
