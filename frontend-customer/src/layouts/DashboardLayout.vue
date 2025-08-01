<template>
  <v-layout>
    <!-- Sidebar (Navigation Drawer) -->
    <app-sidebar />

    <!-- Header (App Bar) -->
    <app-header />

    <!-- Nội dung chính của các trang -->
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { onMounted } from 'vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

const subscriptionStore = useSubscriptionStore();

onMounted(() => {
  // Khi layout dashboard được tải, kiểm tra xem đã có dữ liệu subscription chưa.
  // Nếu chưa có, gọi API để lấy về.
  if (!subscriptionStore.subscription) {
    subscriptionStore.fetchSubscription();
  }
});
</script>

<style scoped>
.v-main {
  background-color: var(--loomsky-neutral-50);
}
</style>
