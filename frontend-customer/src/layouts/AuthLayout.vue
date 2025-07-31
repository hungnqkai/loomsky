<template>
  <div class="auth-layout d-flex align-center justify-center">
    <!-- Nội dung của các trang con (Login, Register...) sẽ được hiển thị ở đây -->
    <router-view />
  </div>
</template>

<script setup>
// Layout này không cần logic, chỉ cần template
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  /* Sử dụng màu nền từ design tokens của chúng ta */
  background-color: var(--loomsky-neutral-50);
}
</style>
