<template>
  <v-navigation-drawer
    expand-on-hover
    rail
  >
    <v-list>
      <!-- THÊM LINK BỌC NGOÀI V-LIST-ITEM -->
      <router-link to="/dashboard/profile" class="text-decoration-none text-white">
        <v-list-item
          prepend-avatar="https://randomuser.me/api/portraits/women/85.jpg"
          :title="authStore.user?.first_name || 'LoomSky User'"
          :subtitle="authStore.user?.email || ''"
        ></v-list-item>
      </router-link>
    </v-list>

    <v-divider></v-divider>

    <v-list density="compact" nav>
      <v-list-item
        prepend-icon="mdi-view-dashboard"
        title="Dashboard"
        value="dashboard"
        to="/dashboard"
        exact
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-account-group-outline"
        title="Team"
        value="team"
        to="/dashboard/team"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-cog-outline"
        title="Settings"
        value="settings"
        to="/dashboard/settings"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
</script>