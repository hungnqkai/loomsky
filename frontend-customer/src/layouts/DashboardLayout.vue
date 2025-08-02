<template>
  <v-layout>
    <!-- Truyền trạng thái `rail` xuống AppSidebar như một prop bình thường -->
    <app-sidebar :rail="rail" />

    <!-- Lắng nghe sự kiện `toggle-sidebar` từ AppHeader -->
    <app-header @toggle-sidebar="toggleSidebar" />

    <!-- Nội dung chính của các trang -->
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

const subscriptionStore = useSubscriptionStore();

// 'rail' là nguồn chân lý duy nhất cho trạng thái của sidebar.
// true = thu gọn (hover được), false = mở rộng (đã ghim).
const rail = ref(true);

// Hàm này chỉ thay đổi trạng thái "ghim", không can thiệp vào hover.
const toggleSidebar = () => {
  rail.value = !rail.value;
};

onMounted(() => {
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
