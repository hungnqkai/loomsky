<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4">Cài đặt Công ty</h1>
      <v-btn
        color="primary"
        @click="onUpdateClient"
        :loading="clientStore.loading"
        :disabled="!isFormDirty"
      >
        Lưu thay đổi
      </v-btn>
    </div>

    <!-- Thông báo -->
    <v-alert v-if="clientStore.successMessage" type="success" variant="tonal" class="mb-4" density="compact">{{ clientStore.successMessage }}</v-alert>
    <v-alert v-if="clientStore.error" type="error" variant="tonal" class="mb-4" density="compact">{{ clientStore.error }}</v-alert>

    <div v-if="clientStore.loading && !clientStore.client" class="text-center mt-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Đang tải cài đặt...</p>
    </div>

    <v-form v-else>
      <v-row>
        <!-- Cột bên trái -->
        <v-col cols="12" md="8">
          <!-- Thông tin chung -->
          <v-card class="mb-6">
            <v-card-title>Thông tin chung</v-card-title>
            <v-card-text>
              <v-row>
                <!-- THÊM LẠI: Khu vực Upload Logo -->
                <v-col cols="12" class="d-flex align-center">
                  <v-avatar size="80" class="mr-4" color="grey-lighten-2">
                    <v-img v-if="clientForm.logo_url" :src="apiBaseUrl + clientForm.logo_url" alt="Logo"></v-img>
                    <v-icon v-else>mdi-office-building</v-icon>
                  </v-avatar>
                  <div>
                    <v-file-input
                      label="Thay đổi logo"
                      @change="onLogoSelect"
                      accept="image/*"
                      variant="outlined"
                      density="compact"
                      hide-details
                      prepend-icon="mdi-camera"
                    ></v-file-input>
                    <div class="text-caption mt-1">Chấp nhận JPG, PNG, SVG. Tối đa 2MB.</div>
                  </div>
                </v-col>
                <v-col cols="12"><v-divider class="my-2"></v-divider></v-col>
                <!-- Kết thúc khu vực Upload Logo -->

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="clientForm.name"
                    label="Tên công ty"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="clientForm.domain"
                    label="Tên miền website"
                    variant="outlined"
                    density="compact"
                    placeholder="https://example.com"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="clientForm.industry"
                    :items="industries"
                    label="Lĩnh vực"
                    variant="outlined"
                    density="compact"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="clientForm.company_size"
                    :items="companySizes"
                    label="Quy mô công ty"
                    variant="outlined"
                    density="compact"
                  ></v-select>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Thông tin liên hệ & địa chỉ -->
          <v-card>
            <v-card-title>Thông tin liên hệ & địa chỉ</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="clientForm.email"
                    label="Email liên hệ chính"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="clientForm.phone"
                    label="Số điện thoại công ty"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="clientForm.address"
                    label="Địa chỉ"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="clientForm.city"
                    label="Thành phố"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                 <v-col cols="12" md="4">
                  <v-text-field
                    v-model="clientForm.postal_code"
                    label="Mã bưu điện"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                 <v-col cols="12" md="4">
                  <v-text-field
                    v-model="clientForm.country"
                    label="Quốc gia"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Cột bên phải -->
        <v-col cols="12" md="4">
           <!-- Thông tin thanh toán -->
           <v-card>
             <v-card-title>Thanh toán</v-card-title>
             <v-card-text>
                <v-text-field
                    v-model="clientForm.billing_email"
                    label="Email nhận hóa đơn"
                    variant="outlined"
                    density="compact"
                    hint="Hóa đơn và thông báo thanh toán sẽ được gửi đến đây."
                    persistent-hint
                ></v-text-field>
                 <v-text-field
                    v-model="clientForm.tax_id"
                    label="Mã số thuế"
                    variant="outlined"
                    density="compact"
                    class="mt-4"
                ></v-text-field>
             </v-card-text>
           </v-card>
        </v-col>
      </v-row>
    </v-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { useClientStore } from '@/stores/clientStore';
import _ from 'lodash';

const clientStore = useClientStore();
// Lấy URL gốc của API để hiển thị ảnh logo
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '');

// --- State cho form ---
const clientForm = reactive({
  name: '', domain: '', logo_url: '', email: '', phone: '',
  address: '', city: '', country: '', postal_code: '',
  industry: '', company_size: null, billing_email: '', tax_id: '',
});

const originalClientData = ref({});
const isFormDirty = computed(() => !_.isEqual(originalClientData.value, clientForm));

// --- Dữ liệu tĩnh cho v-select ---
const industries = ['Công nghệ', 'Bán lẻ', 'Giáo dục', 'Y tế', 'Tài chính', 'Khác'];
const companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

// --- Logic ---
onMounted(() => {
  clientStore.fetchClient();
});

watch(() => clientStore.client, (newClient) => {
  if (newClient) {
    Object.assign(clientForm, _.pick(newClient, Object.keys(clientForm)));
    originalClientData.value = _.cloneDeep(clientForm);
  }
}, { immediate: true, deep: true });

const onUpdateClient = () => {
  // Chỉ gửi những trường đã thay đổi để tối ưu
  const changedData = _.omitBy(clientForm, (value, key) => {
      return _.isEqual(value, originalClientData.value[key]);
  });
  if (Object.keys(changedData).length > 0) {
      clientStore.updateClient(changedData);
  }
};

// THÊM LẠI: Logic Upload Logo
const onLogoSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    clientStore.uploadLogo(file);
  }
};
</script>
