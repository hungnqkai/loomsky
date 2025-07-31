<template>
  <v-card
    class="mx-auto"
    elevation="8"
    max-width="600"
    rounded="lg"
  >
    <!-- NÂNG CẤP: Sử dụng v-form để quản lý validation -->
    <v-form ref="form" @submit.prevent>
      <v-stepper v-model="step" :items="items" show-actions>
        <template v-slot:item.1>
          <h3 class="text-h6">Thông tin tài khoản</h3>
          <br>
          <v-sheet border class="pa-4">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.first_name"
                    label="Tên"
                    variant="outlined"
                    density="compact"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.last_name"
                    label="Họ"
                    variant="outlined"
                    density="compact"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-text-field
                v-model="formData.email"
                label="Email"
                type="email"
                variant="outlined"
                density="compact"
                :rules="[rules.required, rules.email]"
              ></v-text-field>
              <v-text-field
                v-model="formData.password"
                label="Mật khẩu"
                type="password"
                variant="outlined"
                density="compact"
                :rules="[rules.required]"
              ></v-text-field>
          </v-sheet>
        </template>

        <template v-slot:item.2>
          <h3 class="text-h6">Thông tin công ty</h3>
          <br>
          <v-sheet border class="pa-4">
              <v-text-field
                v-model="formData.company_name"
                label="Tên công ty / tổ chức"
                variant="outlined"
                density="compact"
                :rules="[rules.required]"
              ></v-text-field>
              <v-checkbox
                v-model="formData.terms_accepted"
                :rules="[rules.terms]"
              >
                <template v-slot:label>
                  <div>
                    Tôi đồng ý với các
                    <a href="#" @click.stop>điều khoản và điều kiện</a>.
                  </div>
                </template>
              </v-checkbox>
          </v-sheet>
        </template>

        <template v-slot:actions>
          <v-btn v-if="step > 1" @click="prevStep" :disabled="authStore.loading">
            Quay lại
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn v-if="step < items.length" @click="nextStep" color="primary" :disabled="authStore.loading">
            Tiếp theo
          </v-btn>
          <v-btn v-else @click="onRegister" color="primary" :loading="authStore.loading">
            Hoàn tất
          </v-btn>
        </template>
      </v-stepper>
    </v-form>
     <v-alert
      v-if="authStore.error"
      type="error"
      variant="tonal"
      class="ma-4"
      density="compact"
    >
      {{ authStore.error }}
    </v-alert>
  </v-card>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const step = ref(1);
const items = ['Tài khoản', 'Công ty'];
const form = ref(null); // NÂNG CẤP: Thêm ref cho form

const formData = reactive({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  company_name: '',
  terms_accepted: false,
});

// NÂNG CẤP: Định nghĩa các luật validation
const rules = {
  required: value => !!value || 'Trường này là bắt buộc.',
  email: value => /.+@.+\..+/.test(value) || 'Email không hợp lệ.',
  terms: value => value === true || 'Bạn phải đồng ý với điều khoản.',
};

const nextStep = () => {
  if (step.value < items.length) {
    step.value++;
  }
};

const prevStep = () => {
  if (step.value > 1) {
    step.value--;
  }
};

// NÂNG CẤP: Hàm onRegister giờ sẽ validate trước khi gửi
const onRegister = async () => {
  const { valid } = await form.value.validate();

  if (valid) {
    authStore.handleRegister(formData);
  }
};
</script>
