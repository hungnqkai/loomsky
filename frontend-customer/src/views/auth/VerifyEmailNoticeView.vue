<template>
  <v-card
    class="mx-auto pa-6 text-center"
    elevation="8"
    max-width="500"
    rounded="lg"
  >
    <v-icon icon="mdi-email-fast-outline" color="primary" size="80"></v-icon>
    <h2 class="text-h5 mt-4">Kiểm tra Hộp thư của bạn</h2>
    <p class="mt-2 text-medium-emphasis">
      Chúng tôi đã gửi một liên kết xác thực đến địa chỉ email bạn đã đăng ký.
      <br>
      Vui lòng kiểm tra hộp thư đến (và cả thư mục spam) để hoàn tất.
    </p>
    <v-btn color="primary" class="mt-6" to="/auth/login">
      Quay lại trang Đăng nhập
    </v-btn>
  </v-card>
</template>

<script setup>
// This component is purely presentational, no logic needed.
</script>
