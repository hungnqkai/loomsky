<template>
  <v-card class="mx-auto pa-6" elevation="8" max-width="500" rounded="lg">
    <v-card-title class="text-center text-h5 font-weight-bold text-primary mb-2">
      Chào mừng tới LoomSky
    </v-card-title>
    <v-card-subtitle class="text-center mb-6">
      Hoàn tất đăng ký để tham gia đội của bạn.
    </v-card-subtitle>

    <v-alert v-if="successMessage" type="success" variant="tonal" class="mb-4">
      {{ successMessage }}
      <v-btn color="primary" block class="mt-4" to="/auth/login">Đi đến trang Đăng nhập</v-btn>
    </v-alert>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <v-card-text v-if="!successMessage">
      <v-form @submit.prevent="handleAccept">
        <v-text-field
          v-model="form.first_name"
          label="Tên"
          variant="outlined"
          density="compact"
          required
        ></v-text-field>
        <v-text-field
          v-model="form.last_name"
          label="Họ"
          variant="outlined"
          density="compact"
          required
        ></v-text-field>
        <v-text-field
          v-model="form.password"
          label="Mật khẩu"
          type="password"
          variant="outlined"
          density="compact"
          required
        ></v-text-field>
        <v-btn type="submit" :loading="loading" block color="primary" size="large">
          Hoàn tất
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import authService from '@/services/authService';

const route = useRoute();
const token = ref('');

const form = reactive({
  first_name: '',
  last_name: '',
  password: '',
});

const loading = ref(false);
const error = ref(null);
const successMessage = ref(null);

onMounted(() => {
  token.value = route.query.token;
  if (!token.value) {
    error.value = 'Không tìm thấy token mời. Vui lòng kiểm tra lại đường dẫn.';
  }
});

const handleAccept = async () => {
  if (!form.first_name || !form.last_name || !form.password) {
    error.value = 'Vui lòng điền đầy đủ thông tin.';
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const response = await authService.acceptInvitation({
      ...form,
      token: token.value,
    });
    successMessage.value = response.data.message;
  } catch (err) {
    error.value = err.response?.data?.error || 'Đã có lỗi xảy ra.';
  } finally {
    loading.value = false;
  }
};
</script>