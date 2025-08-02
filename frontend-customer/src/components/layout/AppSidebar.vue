<template>
  <v-navigation-drawer
    app
    class="loomsky-sidebar"
    :rail="rail"
    :expand-on-hover="rail"
    permanent
  >
    <!-- Phần Logo & Tên User -->
    <v-list>
      <v-list-item
        prepend-avatar="https://placehold.co/40x40/6366f1/ffffff?text=L"
        title="LoomSky"
        class="font-weight-bold text-primary"
      ></v-list-item>

    </v-list>

    <v-divider></v-divider>

    <!-- Các mục điều hướng đã được tinh gọn -->
    <v-list nav density="compact">
      <v-list-item
        prepend-icon="mdi-view-dashboard-outline"
        title="Dashboard"
        value="dashboard"
        to="/dashboard"
        exact
      ></v-list-item>
      
      <!-- CÁC MỤC CHỨC NĂNG CHÍNH SẼ Ở ĐÂY -->
      
      <v-divider></v-divider>

      <!-- Chỉ còn một link duy nhất đến khu vực Cài đặt -->
      <v-list-item
        prepend-icon="mdi-cog-outline"
        title="Cài đặt"
        value="settings"
        to="/dashboard/settings"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>

defineProps({
  rail: {
    type: Boolean,
    default: true,
  }
});
</script>
