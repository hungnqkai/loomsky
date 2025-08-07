<template>
  <div class="company-profile-container">
    <!-- Giao diện loading khi chưa có dữ liệu -->
    <div v-if="clientStore.loading && !clientStore.client" class="text-center mt-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-medium-emphasis">Loading company data...</p>
    </div>

    <!-- Form chính với layout 2 cột -->
    <v-form v-else-if="clientStore.client">
      <!-- Header với Save Button -->
      <div class="d-flex justify-end align-center mb-4">
        <v-btn
          class="loomsky-button-primary"
          :color="isFormDirty ? 'primary' : 'primary'"
          variant="flat"
          @click="onUpdateClient"
          :loading="clientStore.loading"
          :disabled="!isFormDirty"
          :prepend-icon="isFormDirty ? 'mdi-content-save' : 'mdi-check'"
        >
          {{ isFormDirty ? 'Save Changes' : 'Changes Saved' }}
        </v-btn>
      </div>

      <!-- Thông báo thành công hoặc lỗi -->
      <v-alert v-if="clientStore.successMessage" type="success" variant="tonal" class="mb-4" density="compact" closable @click:close="clientStore.clearMessages()">
        {{ clientStore.successMessage }}
      </v-alert>
      <v-alert v-if="clientStore.error" type="error" variant="tonal" class="mb-4" density="compact" closable @click:close="clientStore.clearMessages()">
        {{ clientStore.error }}
      </v-alert>

      <!-- Main Grid Layout -->
      <v-row class="profile-grid">
        <!-- Cột trái: Company Overview (Sticky) -->
        <v-col cols="12" md="4" class="company-overview-col">
          <div class="company-overview-sticky">

            <!-- Company Overview Card -->
            <LoomSkyCard class="company-overview-card">
              <v-card-title class="loomsky-h2 mb-4">Company Overview</v-card-title>
              
              <!-- Logo Section -->
              <div class="logo-section text-center mb-6">
                <div class="logo-uploader mx-auto mb-4" @click="triggerFileInput">
                  <v-avatar size="120" color="grey-lighten-3" class="company-logo-avatar">
                    <v-img :src="logoPreviewUrl || fullLogoUrl" :key="fullLogoUrl" alt="Company Logo">
                      <template v-slot:placeholder>
                        <div class="d-flex align-center justify-center fill-height">
                          <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                        </div>
                      </template>
                      <template v-slot:error>
                        <v-icon size="x-large">mdi-office-building-outline</v-icon>
                      </template>
                    </v-img>
                    <div class="logo-uploader-overlay">
                      <v-icon color="white">mdi-camera-outline</v-icon>
                    </div>
                  </v-avatar>
                </div>

                <h2 class="company-name">{{ clientForm.name || 'Company Name' }}</h2>
                <a v-if="clientForm.domain" :href="clientForm.domain" target="_blank" class="company-website">
                  <v-icon size="small" class="mr-1">mdi-link</v-icon>
                  {{ formatDomain(clientForm.domain) }}
                </a>

                <!-- File input ẩn -->
                <input ref="fileInput" type="file" accept="image/*" hidden @change="onLogoSelect" />
              </div>

              <!-- Quick Info -->
              <div class="quick-info">
                <div class="info-item">
                  <div class="info-icon">
                    <v-icon color="primary">mdi-domain</v-icon>
                  </div>
                  <div class="info-content">
                    <div class="info-label">Industry</div>
                    <div class="info-value">{{ clientForm.industry || 'Not specified' }}</div>
                  </div>
                </div>

                <div class="info-item">
                  <div class="info-icon">
                    <v-icon color="primary">mdi-account-group</v-icon>
                  </div>
                  <div class="info-content">
                    <div class="info-label">Company Size</div>
                    <div class="info-value">{{ clientForm.company_size || 'Not specified' }}</div>
                  </div>
                </div>

                <div class="info-item">
                  <div class="info-icon">
                    <v-icon color="primary">mdi-email</v-icon>
                  </div>
                  <div class="info-content">
                    <div class="info-label">Primary Email</div>
                    <div class="info-value">{{ clientForm.email || 'Not specified' }}</div>
                  </div>
                </div>

                <div class="info-item">
                  <div class="info-icon">
                    <v-icon color="primary">mdi-map-marker</v-icon>
                  </div>
                  <div class="info-content">
                    <div class="info-label">Location</div>
                    <div class="info-value">{{ formatLocation() }}</div>
                  </div>
                </div>
              </div>

              <!-- Status Badge -->
              <div class="mt-6">
                <v-chip 
                  :color="profileCompleteness >= 80 ? 'success' : 'warning'" 
                  variant="flat" 
                  size="small"
                  prepend-icon="mdi-check-circle"
                >
                  {{ profileCompleteness >= 80 ? 'Profile Complete' : `${profileCompleteness}% Complete` }}
                </v-chip>
              </div>
            </LoomSkyCard>
          </div>
        </v-col>

        <!-- Cột phải: Detailed Forms -->
        <v-col cols="12" md="8" class="detailed-forms-col">
          <!-- General Information -->
          <LoomSkyCard class="mb-6">
            <v-card-title class="loomsky-h2">General Information</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field 
                    v-model="clientForm.name" 
                    label="Company name" 
                    variant="outlined" 
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field 
                    v-model="clientForm.domain" 
                    label="Website" 
                    variant="outlined" 
                    density="compact" 
                    placeholder="https://example.com"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-select 
                    v-model="clientForm.industry" 
                    :items="industries" 
                    label="Industry" 
                    variant="outlined" 
                    density="compact"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="6">
                  <v-select 
                    v-model="clientForm.company_size" 
                    :items="companySizes" 
                    label="Company size" 
                    variant="outlined" 
                    density="compact"
                  ></v-select>
                </v-col>
              </v-row>
            </v-card-text>
          </LoomSkyCard>

          <!-- Contact Information & Address -->
          <LoomSkyCard class="mb-6">
            <v-card-title class="loomsky-h2">Contact Information & Address</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="clientForm.email"
                    label="Email"
                    variant="outlined"
                    density="compact"
                    type="email"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="clientForm.phone"
                    label="Phone"
                    variant="outlined"
                    density="compact"
                    type="tel"
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

          <!-- Payment Information -->
          <LoomSkyCard>
            <v-card-title class="loomsky-h2">Payment Information</v-card-title>
            <v-card-text>
              <v-text-field
                v-model="clientForm.billing_email"
                label="Email to receive invoice"
                variant="outlined"
                density="compact"
                hint="Invoices and payment notices will be sent here."
                persistent-hint
                type="email"
                class="mb-4"
              ></v-text-field>
              <v-text-field
                v-model="clientForm.tax_id"
                label="Tax code"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-card-text>
          </LoomSkyCard>
        </v-col>
      </v-row>
    </v-form>
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
const fileInput = ref(null);
const logoPreviewUrl = ref(null);

// --- State cho form ---
const clientForm = reactive({
  name: '', domain: '', logo_url: '', email: '', phone: '',
  address: '', city: '', country: '', postal_code: '',
  industry: '', company_size: null, billing_email: '', tax_id: '',
});

const originalClientData = ref({});
const isFormDirty = computed(() => !_.isEqual(originalClientData.value, clientForm));

// Cache-busting URL cho logo
const fullLogoUrl = computed(() => {
  if (!clientForm.logo_url) return null;
  return `${apiBaseUrl}${clientForm.logo_url}?t=${new Date().getTime()}`;
});

// Tính toán profile completeness
const profileCompleteness = computed(() => {
  const fields = ['name', 'domain', 'email', 'phone', 'address', 'city', 'country', 'industry', 'company_size'];
  const filledFields = fields.filter(field => clientForm[field] && clientForm[field].toString().trim());
  return Math.round((filledFields.length / fields.length) * 100);
});

// --- Dữ liệu tĩnh cho v-select ---
const industries = ['Công nghệ', 'Bán lẻ', 'Giáo dục', 'Y tế', 'Tài chính', 'Khác'];
const companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

// --- Utility Functions ---
const formatDomain = (domain) => {
  if (!domain) return '';
  return domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
};

const formatLocation = () => {
  const parts = [clientForm.city, clientForm.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Not specified';
};

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

// Logic cho Upload Logo
const triggerFileInput = () => {
  fileInput.value?.click();
};

const onLogoSelect = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  logoPreviewUrl.value = URL.createObjectURL(file);
  clientStore.uploadLogo(file);

  if (fileInput.value) fileInput.value.value = '';
};
</script>

<style scoped lang="scss">
.company-profile-container {
  max-width: 1200px;
  margin: 0 auto;
}

.profile-grid {
  margin-top: 0;
}

.company-overview-col {
  position: relative;
}

.company-overview-sticky {
  position: sticky;
  top: 24px;
  height: fit-content;
}

.save-button-container {
  @media (max-width: 959px) {
    display: none; // Ẩn sticky button trên mobile
  }
}

.company-overview-card {
  .logo-section {
    .logo-uploader {
      position: relative;
      cursor: pointer;
      display: inline-block;
      
      .company-logo-avatar {
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;
        
        &:hover {
          transform: translateY(-2px);
        }
      }

      .logo-uploader-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        border-radius: 50%;
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

    .company-name {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--loomsky-text-title);
      margin-bottom: 8px;
      line-height: 1.3;
    }

    .company-website {
      color: var(--loomsky-primary);
      text-decoration: none;
      font-size: 0.875rem;
      display: inline-flex;
      align-items: center;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }

  .quick-info {
    .info-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--loomsky-neutral-100);
      
      &:last-child {
        border-bottom: none;
      }

      .info-icon {
        width: 40px;
        height: 40px;
        background: var(--loomsky-neutral-50);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        flex-shrink: 0;
      }

      .info-content {
        flex: 1;
        min-width: 0;

        .info-label {
          font-size: 0.75rem;
          color: var(--loomsky-text-body);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
          font-weight: 500;
        }

        .info-value {
          color: var(--loomsky-text-title);
          font-weight: 500;
          word-break: break-word;
        }
      }
    }
  }
}

.detailed-forms-col {
  .loomsky-card {
    :deep(.v-card-text) {
      padding-top: 0;
    }
  }
}

// Responsive
@media (max-width: 959px) {
  .company-overview-sticky {
    position: static;
  }
  
  .company-overview-card {
    margin-bottom: 24px;
    
    .logo-section {
      .company-name {
        font-size: 1.25rem;
      }
    }
  }
}

@media (max-width: 599px) {
  .company-overview-card {
    .logo-section {
      .logo-uploader .company-logo-avatar {
        width: 80px;
        height: 80px;
      }
      
      .company-name {
        font-size: 1.125rem;
      }
    }
  }
}
</style>