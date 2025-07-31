<template>
  <div>
    <h1 class="mb-4">Hồ sơ & Cài đặt</h1>
    <v-card>
      <v-tabs v-model="tab" bg-color="primary">
        <v-tab value="profile">Thông tin cá nhân</v-tab>
        <v-tab value="password">Đổi mật khẩu</v-tab>
      </v-tabs>

      <v-card-text>
        <v-window v-model="tab">
          <v-window-item value="profile">
            <h3 class="mb-4">Cập nhật thông tin cá nhân</h3>
            <v-alert v-if="userStore.successMessage && tab === 'profile'" type="success" variant="tonal" class="mb-4" density="compact">{{ userStore.successMessage }}</v-alert>
            <v-alert v-if="userStore.error && tab === 'profile'" type="error" variant="tonal" class="mb-4" density="compact">{{ userStore.error }}</v-alert>
            <v-form @submit.prevent="onUpdateProfile">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profileForm.first_name"
                    label="Tên"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profileForm.last_name"
                    label="Họ"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-text-field
                :model-value="authStore.user?.email"
                label="Email"
                variant="outlined"
                density="compact"
                disabled
              ></v-text-field>
              <v-btn type="submit" color="primary" :loading="userStore.loading">Lưu thay đổi</v-btn>
            </v-form>
          </v-window-item>

          <v-window-item value="password">
            <h3 class="mb-4">Thay đổi mật khẩu</h3>
            <v-alert v-if="userStore.successMessage && tab === 'password'" type="success" variant="tonal" class="mb-4" density="compact">{{ userStore.successMessage }}</v-alert>
            <v-alert v-if="userStore.error && tab === 'password'" type="error" variant="tonal" class="mb-4" density="compact">{{ userStore.error }}</v-alert>
            <v-form @submit.prevent="onChangePassword">
              <v-text-field
                v-model="passwordForm.oldPassword"
                label="Mật khẩu cũ"
                type="password"
                variant="outlined"
                density="compact"
              ></v-text-field>
              <v-text-field
                v-model="passwordForm.newPassword"
                label="Mật khẩu mới"
                type="password"
                variant="outlined"
                density="compact"
              ></v-text-field>
              <v-text-field
                v-model="passwordForm.confirmPassword"
                label="Xác nhận mật khẩu mới"
                type="password"
                variant="outlined"
                density="compact"
              ></v-text-field>
              <v-btn type="submit" color="primary" :loading="userStore.loading">Đổi mật khẩu</v-btn>
            </v-form>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';

const tab = ref('profile');
const authStore = useAuthStore();
const userStore = useUserStore();

const profileForm = reactive({
  first_name: '',
  last_name: '',
});

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

onMounted(() => {
  if (authStore.user) {
    profileForm.first_name = authStore.user.first_name;
    profileForm.last_name = authStore.user.last_name;
  }
});

const onUpdateProfile = () => {
  userStore.updateProfile({ ...profileForm });
};

const onChangePassword = () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    userStore.error = 'Mật khẩu mới không khớp.';
    return;
  }
  // SỬA LỖI: Gửi đi đầy đủ 3 trường mà API yêu cầu
  userStore.changePassword({
    current_password: passwordForm.oldPassword,
    new_password: passwordForm.newPassword,
    new_password_confirmation: passwordForm.confirmPassword,
  });
};

watch(tab, () => {
  userStore.clearMessages();
});

onUnmounted(() => {
  userStore.clearMessages();
});
</script>
