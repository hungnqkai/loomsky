<!-- 
File: src/views/tracking/WebsiteDetailView.vue (CẬP NHẬT)
- Giao diện chi tiết, tích hợp đầy đủ các component quản lý.
-->
<template>
  <div>
    <div v-if="websiteStore.loading" class="text-center pt-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>
    <div v-else-if="websiteStore.error">
      <v-alert type="error">{{ websiteStore.error }}</v-alert>
    </div>
    <div v-else-if="websiteStore.currentWebsite">
      <h1 class="text-h4 mb-2">{{ websiteStore.currentWebsite.name }}</h1>
      <p class="text-medium-emphasis mb-4">{{ websiteStore.currentWebsite.domain }}</p>

      <v-tabs v-model="tab" bg-color="primary" class="mb-4">
        <v-tab value="setup">Get started</v-tab>
        <v-tab value="datamaps">Data Dictionary</v-tab>
        <v-tab value="pixels">Pixels</v-tab>
        <v-tab value="events">Events & Conversions</v-tab>
        <v-tab value="filters">Auto event filter</v-tab>
        <v-tab value="blacklist">Blacklist</v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item value="setup">
          <v-card>
            <v-card-title>Cài đặt Tracking</v-card-title>
            <v-card-text>
              <p>Để bắt đầu, hãy làm theo các bước dưới đây cho nền tảng <strong>{{ websiteStore.currentWebsite.platform_type }}</strong> của bạn.</p>
              <div v-if="websiteStore.currentWebsite.platform_type === 'wordpress'" class="mt-4">
                <h4>Bước 1: Cài đặt Plugin</h4>
                <p>Tải xuống Plugin <strong>LoomSky Connector</strong> và cài đặt trên website WordPress của bạn.</p>
                <v-btn color="primary" class="mt-2" href="#" disabled>Tải Plugin (sắp có)</v-btn>
                <h4 class="mt-4">Bước 2: Kết nối Website</h4>
                <p>Sao chép API Key dưới đây và dán vào phần cài đặt của plugin LoomSky Connector trong trang quản trị WordPress.</p>
                <v-text-field :model-value="websiteStore.currentWebsite.api_key" readonly append-inner-icon="mdi-content-copy" @click:append-inner="copyApiKey" variant="outlined"></v-text-field>
              </div>
              <div v-else class="mt-4">
                  <h4>Bước 1: Chèn đoạn mã sau</h4>
                  <p>Sao chép và dán đoạn mã SDK này vào trước thẻ `&lt;/head&gt;` trên mọi trang của website bạn.</p>
                  <pre class="bg-grey-lighten-3 pa-4 rounded mt-2"><code>&lt;script async src="[https://cdn.loomsky.com/sdk.js](https://cdn.loomsky.com/sdk.js)" data-api-key="{{ websiteStore.currentWebsite.api_key }}"&gt;&lt;/script&gt;</code></pre>
              </div>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- (MỚI) Thêm Window Item cho Data Mapper -->
        <v-window-item value="datamaps">
          <data-mapper-manager :website-id="id" />
        </v-window-item>

        <v-window-item value="pixels">
          <pixel-manager 
            :website-id="id" 
            :platform-type="websiteStore.currentWebsite.platform_type"
          />
        </v-window-item>
        
        <v-window-item value="events">
           <event-manager 
            :website-id="id" 
            :platform-type="websiteStore.currentWebsite.platform_type"
           />
        </v-window-item>

        <v-window-item value="filters">
           <event-filter-manager :website-id="id" />
        </v-window-item>

        <v-window-item value="blacklist">
           <blacklist-manager :website-id="id" />
        </v-window-item>
      </v-window>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useWebsiteStore } from '@/stores/websiteStore';
import PixelManager from '@/components/tracking/PixelManager.vue';
import EventManager from '@/components/tracking/EventManager.vue';
import EventFilterManager from '@/components/tracking/EventFilterManager.vue';
import BlacklistManager from '@/components/tracking/BlacklistManager.vue';
import DataMapperManager from '@/components/tracking/DataMapperManager.vue';

const props = defineProps({
  id: { type: String, required: true },
});

const websiteStore = useWebsiteStore();
const tab = ref('setup');

onMounted(() => {
  websiteStore.fetchWebsiteById(props.id);
});

const copyApiKey = () => {
  navigator.clipboard.writeText(websiteStore.currentWebsite.api_key);
};
</script>

<style scoped>
pre { white-space: pre-wrap; word-break: break-all; }
</style>