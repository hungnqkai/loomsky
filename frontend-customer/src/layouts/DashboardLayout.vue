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
import AppHeader from '@/components/layout/AppHeader.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
</script>

<style scoped>
.v-main {
  background-color: var(--loomsky-neutral-50);
}
</style>
