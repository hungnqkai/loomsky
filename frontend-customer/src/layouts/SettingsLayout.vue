<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-6">Cài đặt</h1>
    <v-row>
      <!-- Cột 1: Menu Dọc -->
      <v-col cols="12" md="2">
        <v-list nav density="compact">
          <v-list-item
            v-for="item in menuItems"
            :key="item.value"
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            :value="item.value"
            rounded="lg"
          ></v-list-item>
        </v-list>
      </v-col>

      <!-- Cột 2: Nội dung trang con -->
      <v-col cols="12" md="10">
        <!-- 
          <router-view> sẽ render component con tương ứng 
          với đường dẫn (ví dụ: /settings/profile sẽ render CompanyProfileView)
        -->
        <router-view v-slot="{ Component }">
          <v-fade-transition leave-absolute>
            <component :is="Component" />
          </v-fade-transition>
        </router-view>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const menuItems = ref([
  {
    title: 'Hồ sơ Công ty',
    value: 'profile',
    icon: 'mdi-office-building-outline',
    to: '/dashboard/settings/profile',
  },
  {
    title: 'Đội nhóm',
    value: 'team',
    icon: 'mdi-account-group-outline',
    to: '/dashboard/settings/team',
  },
  {
    title: 'Thanh toán',
    value: 'billing',
    icon: 'mdi-credit-card-outline',
    to: '/dashboard/settings/billing',
  },
  // Dễ dàng thêm các mục mới trong tương lai
  // {
  //   title: 'Bảo mật',
  //   value: 'security',
  //   icon: 'mdi-lock-outline',
  //   to: '/dashboard/settings/security',
  // },
]);
</script>
