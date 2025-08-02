<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-6">User Profile</h1>

    <!-- Card 1: Cập nhật thông tin cá nhân -->
    <LoomSkyCard class="mb-6">
      <v-card-title class="text-h6">Thông tin cá nhân</v-card-title>
      <v-card-text>
        <!-- Thông báo thành công hoặc lỗi cho form này -->
        <v-alert v-if="profileSuccess" type="success" variant="tonal" class="mb-4" density="compact">{{ profileSuccess }}</v-alert>
        <v-alert v-if="profileError" type="error" variant="tonal" class="mb-4" density="compact">{{ profileError }}</v-alert>
        
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
            hint="Không thể thay đổi địa chỉ email."
            persistent-hint
          ></v-text-field>
          
          <v-card-actions class="pa-0 mt-4">
            <v-spacer></v-spacer>
            <v-btn 
              type="submit" 
              color="primary" 
              variant="tonal"
              :loading="userStore.loading"
            >
              Lưu thay đổi
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </LoomSkyCard>

    <!-- Card 2: Thay đổi mật khẩu -->
    <LoomSkyCard>
      <v-card-title class="text-h6">Thay đổi mật khẩu</v-card-title>
      <v-card-text>
        <!-- Thông báo thành công hoặc lỗi cho form này -->
        <v-alert v-if="passwordSuccess" type="success" variant="tonal" class="mb-4" density="compact">{{ passwordSuccess }}</v-alert>
        <v-alert v-if="passwordError" type="error" variant="tonal" class="mb-4" density="compact">{{ passwordError }}</v-alert>

        <v-form @submit.prevent="onChangePassword" ref="passwordFormRef">
          <v-text-field
            v-model="passwordForm.current_password"
            label="Mật khẩu hiện tại"
            type="password"
            variant="outlined"
            density="compact"
            class="mb-2"
          ></v-text-field>
          <v-text-field
            v-model="passwordForm.new_password"
            label="Mật khẩu mới"
            type="password"
            variant="outlined"
            density="compact"
            class="mb-2"
          ></v-text-field>
          <v-text-field
            v-model="passwordForm.new_password_confirmation"
            label="Xác nhận mật khẩu mới"
            type="password"
            variant="outlined"
            density="compact"
          ></v-text-field>

          <v-card-actions class="pa-0 mt-4">
            <v-spacer></v-spacer>
            <v-btn 
              type="submit" 
              color="primary" 
              variant="tonal"
              :loading="userStore.loading"
            >
              Đổi mật khẩu
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </LoomSkyCard>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import LoomSkyCard from '@/components/common/LoomSkyCard.vue';

const authStore = useAuthStore();
const userStore = useUserStore();

// --- State cho Form Thông tin ---
const profileForm = reactive({
  first_name: '',
  last_name: '',
});
const profileSuccess = ref('');
const profileError = ref('');

// --- State cho Form Mật khẩu ---
const passwordFormRef = ref(null);
const passwordForm = reactive({
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
});
const passwordSuccess = ref('');
const passwordError = ref('');

// --- Vòng đời Component ---
onMounted(() => {
  if (authStore.user) {
    profileForm.first_name = authStore.user.first_name;
    profileForm.last_name = authStore.user.last_name;
  }
});

// Xóa thông báo khi người dùng rời khỏi trang
onUnmounted(() => {
  userStore.clearMessages();
});

// Theo dõi store để cập nhật thông báo riêng cho từng form
watch(() => userStore.successMessage, (newVal) => {
  if (newVal.includes('thông tin')) profileSuccess.value = newVal;
  if (newVal.includes('mật khẩu')) passwordSuccess.value = newVal;
});
watch(() => userStore.error, (newVal) => {
  if (newVal.includes('Cập nhật')) profileError.value = newVal;
  if (newVal.includes('Đổi')) passwordError.value = newVal;
});

// --- Logic xử lý ---
const onUpdateProfile = async () => {
  // Xóa thông báo cũ
  profileSuccess.value = '';
  profileError.value = '';
  await userStore.updateProfile({ ...profileForm });
};

const onChangePassword = async () => {
  // Xóa thông báo cũ
  passwordSuccess.value = '';
  passwordError.value = '';

  if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
    passwordError.value = 'Mật khẩu mới không khớp.';
    return;
  }
  
  const success = await userStore.changePassword({ ...passwordForm });
  if (success) {
    // Reset form sau khi đổi mật khẩu thành công
    passwordFormRef.value?.reset();
  }
};
</script>
