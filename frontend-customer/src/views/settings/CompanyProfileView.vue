<template>
  <div style="max-width:1000px">
    <!-- Giao diện loading khi chưa có dữ liệu -->
    <div v-if="clientStore.loading && !clientStore.client" class="text-center mt-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-medium-emphasis">Loading company data...</p>
    </div>

    <!-- Form chính, chỉ hiển thị khi đã có dữ liệu -->
    <v-form v-else-if="clientStore.client">
      <!-- Card 1: Thông tin chung -->
      <LoomSkyCard class="mb-10">
        <v-card-title class="loomsky-h2">General information</v-card-title>
        <v-card-text>
          <v-row>
            <!-- CẢI TIẾN: Khu vực Upload Logo -->
            <v-col cols="12" class="d-flex align-center">
              <div class="logo-uploader mr-6" @click="triggerFileInput">
                <v-avatar size="80" color="grey-lighten-3">
                  <!-- Ưu tiên hiển thị ảnh preview, sau đó mới đến ảnh từ server -->
                  <v-img :src="logoPreviewUrl || fullLogoUrl" :key="fullLogoUrl" alt="Logo">
                     <template v-slot:placeholder>
                        <div class="d-flex align-center justify-center fill-height">
                           <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                        </div>
                     </template>
                     <template v-slot:error>
                        <v-icon size="x-large">mdi-office-building-outline</v-icon>
                     </template>
                  </v-img>
                </v-avatar>
                <div class="logo-uploader-overlay">
                  <v-icon>mdi-camera-outline</v-icon>
                </div>
              </div>
              <div>
                <v-btn variant="tonal" @click="triggerFileInput">Upload photo</v-btn>
                <div class="text-caption text-medium-emphasis mt-2">Accept JPG, PNG, SVG. Max 2MB.</div>
                <!-- File input được ẩn đi -->
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  hidden
                  @change="onLogoSelect"
                />
              </div>
            </v-col>
            <v-col cols="12"><v-divider class="my-2"></v-divider></v-col>
            
            <!-- Các trường thông tin -->
            <v-col cols="12" md="6">
              <v-text-field v-model="clientForm.name" label="Company name" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="clientForm.domain" label="Website" variant="outlined" density="compact" placeholder="https://example.com"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="clientForm.industry" :items="industries" label="Lĩnh vực" variant="outlined" density="compact"></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="clientForm.company_size" :items="companySizes" label="Company size" variant="outlined" density="compact"></v-select>
            </v-col>
          </v-row>
        </v-card-text>
      </LoomSkyCard>

      <!-- Các Card khác giữ nguyên -->
      <!-- Card 2: Thông tin liên hệ & địa chỉ -->
      <LoomSkyCard class="mb-10">
        <v-card-title class="loomsky-h2">Contact information & address</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="clientForm.email"
                label="Email"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="clientForm.phone"
                label="Phone"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="clientForm.address"
                label="Address"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="clientForm.city"
                label="City"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
             <v-col cols="12" md="4">
              <v-text-field
                v-model="clientForm.postal_code"
                label="Zip code"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
             <v-col cols="12" md="4">
              <v-text-field
                v-model="clientForm.country"
                label="Country"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
      </LoomSkyCard>

      <!-- Card 3: Thông tin thanh toán -->
      <LoomSkyCard class="mb-10">
         <v-card-title class="loomsky-h2">Payment</v-card-title>
         <v-card-text>
            <v-text-field
                v-model="clientForm.billing_email"
                label="Email to receive invoice"
                variant="outlined"
                density="compact"
                hint="Invoices and payment notices will be sent here.."
                persistent-hint
            ></v-text-field>
             <v-text-field
                v-model="clientForm.tax_id"
                label="Tax code"
                variant="outlined"
                density="compact"
                class="mt-4"
            ></v-text-field>
         </v-card-text>
      </LoomSkyCard>

    </v-form>

    <!-- Header của trang, chứa tiêu đề và nút Lưu -->
    <div class="d-flex justify-end align-center mb-4">
      <v-btn
        class="loomsky-button-primary"
        color="primary"
        variant="flat"
        @click="onUpdateClient"
        :loading="clientStore.loading"
        :disabled="!isFormDirty"
      >
        Save changes
      </v-btn>
    </div>

    <!-- Thông báo thành công hoặc lỗi -->
    <v-alert v-if="clientStore.successMessage" type="success" variant="tonal" class="mb-4" density="compact" closable @click:close="clientStore.clearMessages()">{{ clientStore.successMessage }}</v-alert>
    <v-alert v-if="clientStore.error" type="error" variant="tonal" class="mb-4" density="compact" closable @click:close="clientStore.clearMessages()">{{ clientStore.error }}</v-alert>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { useClientStore } from '@/stores/clientStore';
import LoomSkyCard from '@/components/common/LoomSkyCard.vue';
import _ from 'lodash';

const clientStore = useClientStore();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '');

// --- State cho Upload Logo ---
const fileInput = ref(null); // Ref cho thẻ input file ẩn
const logoPreviewUrl = ref(null); // URL tạm thời để preview ảnh

// --- State cho form ---
const clientForm = reactive({
  name: '', domain: '', logo_url: '', email: '', phone: '',
  address: '', city: '', country: '', postal_code: '',
  industry: '', company_size: null, billing_email: '', tax_id: '',
});

const originalClientData = ref({});
const isFormDirty = computed(() => !_.isEqual(originalClientData.value, clientForm));

// SỬA LỖI: Thêm cache-busting query parameter vào URL của logo
const fullLogoUrl = computed(() => {
  if (!clientForm.logo_url) return null;
  // Thêm một timestamp vào URL để buộc trình duyệt tải lại ảnh mới
  return `${apiBaseUrl}${clientForm.logo_url}?t=${new Date().getTime()}`;
});


// --- Dữ liệu tĩnh cho v-select ---
const industries = ['Công nghệ', 'Bán lẻ', 'Giáo dục', 'Y tế', 'Tài chính', 'Khác'];
const companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

// --- Logic ---
onMounted(() => {
  if (!clientStore.client) {
    clientStore.fetchClient();
  }
});

watch(() => clientStore.client, (newClient) => {
  if (newClient) {
    const formKeys = Object.keys(clientForm);
    const clientDataForForm = _.pick(newClient, formKeys);
    Object.assign(clientForm, clientDataForForm);
    originalClientData.value = _.cloneDeep(clientDataForForm);
    // Xóa preview cũ khi dữ liệu từ store được cập nhật
    logoPreviewUrl.value = null;
  }
}, { immediate: true, deep: true });

const onUpdateClient = () => {
  const changedData = _.omitBy(clientForm, (value, key) => {
      return _.isEqual(value, originalClientData.value[key]);
  });
  if (Object.keys(changedData).length > 0) {
      clientStore.updateClient(changedData);
  }
};

// CẢI TIẾN: Logic cho Upload Logo
const triggerFileInput = () => {
  fileInput.value?.click();
};

const onLogoSelect = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Tạo URL preview ngay lập tức
  logoPreviewUrl.value = URL.createObjectURL(file);

  // Gọi action trong store để tải file lên
  clientStore.uploadLogo(file);

  // Reset input để có thể chọn lại cùng một file
  if(fileInput.value) fileInput.value.value = '';
};
</script>

<style scoped lang="scss">
.logo-uploader {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;

  .logo-uploader-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }

  &:hover .logo-uploader-overlay {
    opacity: 1;
  }
}
</style>
