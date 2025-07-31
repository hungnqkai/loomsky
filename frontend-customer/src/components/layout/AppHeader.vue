<template>
  <v-app-bar color="primary" density="compact">
    <v-app-bar-title>LoomSky</v-app-bar-title>

    <v-spacer></v-spacer>

    <v-btn icon>
      <v-icon>mdi-magnify</v-icon>
    </v-btn>

    <v-btn icon>
      <v-icon>mdi-bell-outline</v-icon>
    </v-btn>

    <v-btn @click="onLogout" icon>
      <v-icon>mdi-logout</v-icon>
    </v-btn>
  </v-app-bar>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();

const onLogout = () => {
  authStore.handleLogout();
}
</script>
