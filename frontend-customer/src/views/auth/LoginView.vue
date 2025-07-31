<template>
  <v-card
    class="mx-auto pa-4 pb-8"
    elevation="8"
    max-width="448"
    rounded="lg"
  >
    <v-card-title class="text-center text-h5 font-weight-bold text-primary mb-2">
      Đăng nhập LoomSky
    </v-card-title>
    <v-card-subtitle class="text-center mb-6">
      Chào mừng bạn đã trở lại!
    </v-card-subtitle>

    <!-- Hiển thị thông báo lỗi nếu có -->
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
      <v-form @submit.prevent="onLogin">
        <div class="text-subtitle-1 text-medium-emphasis">Tài khoản</div>
        <v-text-field
          v-model="email"
          density="compact"
          placeholder="Nhập địa chỉ email"
          prepend-inner-icon="mdi-email-outline"
          variant="outlined"
          type="email"
          required
        />

        <div class="text-subtitle-1 text-medium-emphasis d-flex align-center justify-space-between">
          Mật khẩu
          <a
            class="text-caption text-decoration-none text-primary"
            href="/auth/forgot-password"
            rel="noopener noreferrer"
            target=""
          >
            Quên mật khẩu?</a>
        </div>
        <v-text-field
          v-model="password"
          :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
          :type="visible ? 'text' : 'password'"
          density="compact"
          placeholder="Nhập mật khẩu"
          prepend-inner-icon="mdi-lock-outline"
          variant="outlined"
          required
          @click:append-inner="visible = !visible"
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
          Đăng nhập
        </v-btn>
      </v-form>

      <v-card-text class="text-center">
        <a
          class="text-primary text-decoration-none"
          href="/auth/register"
          rel="noopener noreferrer"
          target=""
        >
          Chưa có tài khoản? Đăng ký ngay <v-icon icon="mdi-chevron-right"></v-icon>
        </a>
      </v-card-text>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Khởi tạo store
const authStore = useAuthStore()

// State cho form
const visible = ref(false)
const email = ref('')
const password = ref('')

// Hàm xử lý khi submit form
const onLogin = () => {
  if (email.value && password.value) {
    authStore.handleLogin({
      email: email.value,
      password: password.value,
    })
  }
}
</script>
