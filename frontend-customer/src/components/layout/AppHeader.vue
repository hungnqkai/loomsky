<template>
  <v-app-bar flat color="background">
    <v-app-bar-nav-icon @click="$emit('toggle-sidebar')"></v-app-bar-nav-icon>
    <v-btn icon="mdi-magnify" class="mr-2"></v-btn>
    <v-spacer></v-spacer>

    <v-btn icon class="mr-2">
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" width="22" height="22" viewBox="0 0 24 24" class="iconify iconify--solar"><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18.75 9.71v-.705C18.75 5.136 15.726 2 12 2S5.25 5.136 5.25 9.005v.705a4.4 4.4 0 0 1-.692 2.375L3.45 13.81c-1.011 1.575-.239 3.716 1.52 4.214a25.8 25.8 0 0 0 14.06 0c1.759-.498 2.531-2.639 1.52-4.213l-1.108-1.725a4.4 4.4 0 0 1-.693-2.375Z"></path><path stroke-linecap="round" d="M7.5 19c.655 1.748 2.422 3 4.5 3s3.845-1.252 4.5-3M12 6v4" opacity=".5"></path></g></svg>
    </v-btn>

    <!-- Menu Người dùng -->
    <v-menu offset-y :close-on-content-click="false">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" icon>
          <v-avatar size="36">
            <v-img
              :src="userAvatar"
              :alt="authStore.user?.first_name"
            ></v-img>
          </v-avatar>
        </v-btn>
      </template>

      <!-- SỬ DỤNG COMPONENT LOOMSKYCARD MỚI -->
      <LoomSkyCard min-width="300" class="pa-2">
        <v-card-title class="text-h6 font-weight-bold mb-2">User Profile</v-card-title>
        <v-card-text>
          <!-- Phần thông tin user -->
          <div class="d-flex align-center">
            <v-avatar size="64">
              <v-img :src="userAvatar" :alt="authStore.user?.first_name"></v-img>
            </v-avatar>
            <div class="ml-4">
              <div class="font-weight-bold text-body-1">
                {{ authStore.user ? `${authStore.user.first_name} ${authStore.user.last_name}` : 'LoomSky User' }}
              </div>
              <div class="text-caption text-medium-emphasis text-capitalize">
                {{ authStore.user?.role || 'Member' }}
              </div>
              <div class="d-flex align-center text-caption text-medium-emphasis mt-1">
                 <v-icon size="x-small" class="mr-1">mdi-email-outline</v-icon>
                 <span>{{ authStore.user?.email }}</span>
              </div>
            </div>
          </div>

          <v-divider class="my-4"></v-divider>

          <!-- Danh sách các mục menu -->
          <v-list nav density="compact">
            <v-list-item
              to="/dashboard/profile"
              link
              rounded="lg"
              class="menu-item"
            >
              <template v-slot:prepend>
                <div class="menu-item-icon-wrapper bg-blue-lighten-5">
                  <v-icon color="info">mdi-account-outline</v-icon>
                </div>
              </template>
              <v-list-item-title class="font-weight-semibold">My Profile</v-list-item-title>
              <v-list-item-subtitle>Account Settings</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>

        <!-- Nút Đăng xuất -->
        <div class="pa-4 pt-0">
          <v-btn
            @click="onLogout"
            block
            color="primary"
            variant="flat"
            class="text-none"
          >
            Logout
          </v-btn>
        </div>
      </LoomSkyCard>
    </v-menu>

  </v-app-bar>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import defaultAvatar from '@/assets/images/default-avatar.jpg';
// Import component LoomSkyCard
import LoomSkyCard from '@/components/common/LoomSkyCard.vue';

defineEmits(['toggle-sidebar']);

const authStore = useAuthStore();

const userAvatar = computed(() => {
  if (authStore.user?.avatar_url) {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '');
    return `${apiBaseUrl}${authStore.user.avatar_url}`;
  }
  return defaultAvatar;
});

const onLogout = () => {
  authStore.handleLogout();
}
</script>

<style scoped lang="scss">
.menu-item {
  margin-bottom: 8px;

  .menu-item-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    margin-right: 16px;
  }
}
</style>
