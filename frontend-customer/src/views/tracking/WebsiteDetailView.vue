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
      <!-- Enhanced Website Header -->
      <div class="website-header">
        <div class="header-content">
          <div class="website-favicon">
            <v-icon size="36" color="white">mdi-web</v-icon>
          </div>
          <div class="website-info">
            <div>
              <h1 class="website-name">{{ websiteStore.currentWebsite.name }}</h1>
              <div class="website-domain">
                <span>{{ websiteStore.currentWebsite.domain }}</span>
                <div class="status-indicator">
                  <div class="status-dot" :class="getConnectionStatusClass()"></div>
                  <span>{{ getConnectionStatusText() }}</span>
                </div>
              </div>
            </div>
            
            <div class="header-stats" v-if="dashboardStats">
              <div class="stat-item">
                <div class="stat-number">{{ dashboardStats.dataMapping?.total || 0 }}</div>
                <div class="stat-label">Data Mappings</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ dashboardStats.totalPixels || 0 }}</div>
                <div class="stat-label">Active Pixels</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ dashboardStats.totalEvents || 0 }}</div>
                <div class="stat-label">Events</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ getLastActivityText() }}</div>
                <div class="stat-label">Last Activity</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Navigation Tabs -->
      <div class="nav-tabs">
        <button 
          v-for="tabItem in tabs" 
          :key="tabItem.value"
          class="nav-tab" 
          :class="{ active: tab === tabItem.value, completed: isTabCompleted(tabItem.value) }"
          @click="tab = tabItem.value"
        >
          <div class="tab-icon">
            <v-icon size="20">{{ tabItem.icon }}</v-icon>
          </div>
          <span>{{ tabItem.label }}</span>
          <div v-if="getTabBadgeCount(tabItem.value)" class="tab-badge">
            {{ getTabBadgeCount(tabItem.value) }}
          </div>
          <div class="setup-progress"></div>
        </button>
      </div>

      <!-- Content Area -->
      <div class="content-area">
        <!-- Setup Tab -->
        <div v-if="tab === 'setup'" class="tab-content active">
          <div class="setup-overview">
            <div class="setup-card" :class="{ completed: isTrackingSetupCompleted() }">
              <div class="setup-card-header">
                <div class="setup-icon tracking">
                  <v-icon color="white" size="24">mdi-radar</v-icon>
                </div>
                <div>
                  <div class="setup-title">Tracking Setup</div>
                </div>
              </div>
              <div class="setup-description">
                {{ getTrackingSetupDescription() }}
              </div>
              <button 
                class="setup-action" 
                :class="{ completed: isTrackingSetupCompleted() }"
                @click="showTrackingSetup = !showTrackingSetup"
              >
                {{ getTrackingSetupButtonText() }}
              </button>
              
              <!-- Expandable Tracking Setup Details -->
              <v-expand-transition>
                <div v-if="showTrackingSetup" class="mt-4 p-4 bg-grey-lighten-5 rounded">
                  <div v-if="websiteStore.currentWebsite.platform_type === 'wordpress'">
                    <h4 class="mb-2">WordPress Plugin Setup</h4>
                    <p class="mb-2">Install the LoomSky Connector plugin and use this API key:</p>
                    <v-text-field 
                      :model-value="websiteStore.currentWebsite.api_key" 
                      readonly 
                      append-inner-icon="mdi-content-copy" 
                      @click:append-inner="copyApiKey" 
                      variant="outlined"
                      density="compact"
                    ></v-text-field>
                  </div>
                  <div v-else>
                    <h4 class="mb-2">SDK Integration</h4>
                    <p class="mb-2">Add this code before the &lt;/head&gt; tag on all pages:</p>
                    <pre class="code-block">&lt;script async src="https://cdn.loomsky.com/sdk.js" data-api-key="{{ websiteStore.currentWebsite.api_key }}"&gt;&lt;/script&gt;</pre>
                  </div>
                </div>
              </v-expand-transition>
            </div>

            <div class="setup-card" :class="{ completed: isDataMappingCompleted() }">
              <div class="setup-card-header">
                <div class="setup-icon mapping">
                  <v-icon color="white" size="24">mdi-map</v-icon>
                </div>
                <div>
                  <div class="setup-title">Data Mapping</div>
                </div>
              </div>
              <div class="setup-description">
                Map important website elements like product prices, names, and categories for better tracking accuracy.
              </div>
              <button 
                class="setup-action" 
                :class="{ completed: isDataMappingCompleted() }"
                @click="tab = 'datamaps'"
              >
                {{ getDataMappingButtonText() }}
              </button>
            </div>

            <div class="setup-card" :class="{ completed: isPixelSetupCompleted() }">
              <div class="setup-card-header">
                <div class="setup-icon pixels">
                  <v-icon color="white" size="24">mdi-target</v-icon>
                </div>
                <div>
                  <div class="setup-title">Pixel Integration</div>
                </div>
              </div>
              <div class="setup-description">
                Connect your advertising pixels (Facebook, Google, TikTok) to automatically send conversion data.
              </div>
              <button class="setup-action" @click="tab = 'pixels'">
                Setup Pixels
              </button>
            </div>

            <div class="setup-card">
              <div class="setup-card-header">
                <div class="setup-icon events">
                  <v-icon color="white" size="24">mdi-lightning-bolt</v-icon>
                </div>
                <div>
                  <div class="setup-title">Custom Events</div>
                </div>
              </div>
              <div class="setup-description">
                Configure custom conversion events and goals to track specific user actions on your website.
              </div>
              <button class="setup-action" @click="tab = 'pixels'">
                Configure Events & Pixels
              </button>
            </div>
          </div>

          <!-- Feature Preview -->
          <div class="feature-preview" v-if="dashboardStats?.dataMapping?.mappings?.length">
            <div class="preview-header">
              <h3 class="preview-title">Your Data Mappings</h3>
              <div class="preview-badge">{{ dashboardStats.dataMapping.total }} Active</div>
            </div>
            <div class="preview-grid">
              <div 
                v-for="mapping in dashboardStats.dataMapping.mappings.slice(0, 3)" 
                :key="mapping.id"
                class="preview-item"
              >
                <div class="preview-icon" :class="getMappingIconClass(mapping.variable_name)">
                  <v-icon color="white" size="16">{{ getMappingIcon(mapping.variable_name) }}</v-icon>
                </div>
                <div class="preview-text">
                  <strong>{{ mapping.variable_name }}</strong>
                  <small>{{ mapping.selector }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Other Tabs -->
        <div v-if="tab === 'datamaps'" class="tab-content active">
          <data-mapper-manager :website-id="id" />
        </div>

        <div v-if="tab === 'pixels'" class="tab-content active">
          <pixel-manager 
            :website-id="id" 
            :platform-type="websiteStore.currentWebsite.platform_type"
          />
        </div>
        

        <div v-if="tab === 'filters'" class="tab-content active">
           <event-filter-manager :website-id="id" />
        </div>

        <div v-if="tab === 'blacklist'" class="tab-content active">
           <blacklist-manager :website-id="id" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useWebsiteStore } from '@/stores/websiteStore';
import PixelManager from '@/components/tracking/PixelManager.vue';
import EventFilterManager from '@/components/tracking/EventFilterManager.vue';
import BlacklistManager from '@/components/tracking/BlacklistManager.vue';
import DataMapperManager from '@/components/tracking/DataMapperManager.vue';

const props = defineProps({
  id: { type: String, required: true },
});

const websiteStore = useWebsiteStore();
const tab = ref('setup');
const showTrackingSetup = ref(false);

// Tab configuration with icons and labels
const tabs = ref([
  { value: 'setup', label: 'Get Started', icon: 'mdi-rocket-launch' },
  { value: 'datamaps', label: 'Data Dictionary', icon: 'mdi-chart-bar' },
  { value: 'pixels', label: 'Pixels', icon: 'mdi-magnify' },
  { value: 'filters', label: 'Auto Event Filter', icon: 'mdi-cog' },
  { value: 'blacklist', label: 'Blacklist', icon: 'mdi-cancel' }
]);

// Computed properties for connection status
const connectionStatus = computed(() => websiteStore.connectionStatus);
const dashboardStats = computed(() => websiteStore.dashboardStats);

const getConnectionStatusClass = () => {
  if (!connectionStatus.value) return '';
  return connectionStatus.value.connected ? 'connected' : 'disconnected';
};

const getConnectionStatusText = () => {
  if (!connectionStatus.value) return 'Unknown';
  return connectionStatus.value.connected ? 'Connected' : 'Disconnected';
};

const getLastActivityText = () => {
  if (!dashboardStats.value?.lastActivity) return 'Never';
  const lastActivity = new Date(dashboardStats.value.lastActivity);
  const now = new Date();
  const diffMs = now - lastActivity;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffHours < 1) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

// Tab completion and badge logic
const isTabCompleted = (tabValue) => {
  if (!dashboardStats.value) return false;
  
  switch (tabValue) {
    case 'setup':
      return dashboardStats.value.trackingSetup?.isSetup && dashboardStats.value.dataMapping?.configured;
    case 'datamaps':
      return dashboardStats.value.dataMapping?.configured;
    case 'pixels':
      return dashboardStats.value.totalPixels > 0;
    default:
      return false;
  }
};

const getTabBadgeCount = (tabValue) => {
  if (!dashboardStats.value) return null;
  
  switch (tabValue) {
    case 'datamaps':
      return dashboardStats.value.dataMapping?.total || null;
    case 'pixels':
      return dashboardStats.value.totalPixels || null;
    case 'events':
      return dashboardStats.value.totalEvents || null;
    case 'filters':
      return dashboardStats.value.totalFilters || null;
    case 'blacklist':
      return dashboardStats.value.totalBlacklisted || null;
    default:
      return null;
  }
};

// Setup card logic
const isTrackingSetupCompleted = () => {
  return dashboardStats.value?.trackingSetup?.isSetup || false;
};

const getTrackingSetupDescription = () => {
  const trackingSetup = dashboardStats.value?.trackingSetup;
  if (!trackingSetup?.isSetup) {
    const method = websiteStore.currentWebsite?.platform_type === 'wordpress' ? 'WordPress plugin' : 'SDK';
    return `Install and configure the LoomSky ${method} to start tracking events on your website.`;
  }
  
  const method = trackingSetup.method === 'plugin' ? 'WordPress plugin' : 'SDK';
  const status = trackingSetup.status === 'active' ? 'actively tracking' : 'configured but inactive';
  return `Your website is connected via ${method} and ${status} events automatically.`;
};

const getTrackingSetupButtonText = () => {
  const trackingSetup = dashboardStats.value?.trackingSetup;
  if (!trackingSetup?.isSetup) return 'Setup Tracking';
  return trackingSetup.status === 'active' ? '✓ Active' : '✓ Connected';
};

const isDataMappingCompleted = () => {
  return dashboardStats.value?.dataMapping?.configured || false;
};

const getDataMappingButtonText = () => {
  const total = dashboardStats.value?.dataMapping?.total || 0;
  if (total === 0) return 'Setup Mappings';
  return `✓ ${total} Mappings`;
};

const isPixelSetupCompleted = () => {
  return (dashboardStats.value?.totalPixels || 0) > 0;
};

// Data mapping preview helpers
const getMappingIcon = (variableName) => {
  const name = variableName.toLowerCase();
  if (name.includes('price') || name.includes('amount')) return 'mdi-currency-usd';
  if (name.includes('product') || name.includes('name')) return 'mdi-package-variant';
  if (name.includes('category')) return 'mdi-tag';
  if (name.includes('email')) return 'mdi-email';
  return 'mdi-code-braces';
};

const getMappingIconClass = (variableName) => {
  const name = variableName.toLowerCase();
  if (name.includes('price') || name.includes('amount')) return 'price';
  if (name.includes('product') || name.includes('name')) return 'product';
  if (name.includes('category')) return 'category';
  return 'default';
};

onMounted(() => {
  websiteStore.fetchWebsiteById(props.id);
});

const copyApiKey = () => {
  navigator.clipboard.writeText(websiteStore.currentWebsite.api_key);
};
</script>

<style scoped>
/* Enhanced Website Header */
.website-header {
  background: linear-gradient(135deg, #0067b8 0%, #0052a3 100%);
  color: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 103, 184, 0.2);
}

.website-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 100%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: float 8s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(180deg); }
}

.header-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 24px;
}

.website-favicon {
  width: 64px;
  height: 64px;
  background: rgba(255,255,255,0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255,255,255,0.3);
}

.website-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 50px;
}

.website-name {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.2;
}

.website-domain {
  font-size: 16px;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 40px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9em;
  opacity: 0.9;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-dot.connected {
  background: #10b981;
}

.status-dot.disconnected {
  background: #ef4444;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.header-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  width: 100%;
}

.stat-item {
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  border: 1px solid rgba(255,255,255,0.2);
}

.stat-number {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.85em;
  opacity: 0.8;
}

/* Enhanced Navigation Tabs */
.nav-tabs {
  background: white;
  border-radius: 12px;
  padding: 8px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  display: flex;
  gap: 4px;
  overflow-x: auto;
}

.nav-tab {
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
  position: relative;
  min-width: fit-content;
}

.nav-tab:hover {
  background: #f3f4f6;
  color: #374151;
}

.nav-tab.active {
  background: #0067b8;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 103, 184, 0.3);
}

.tab-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-badge {
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
}

.nav-tab.active .tab-badge {
  background: rgba(255,255,255,0.2);
  color: white;
}

.setup-progress {
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: #10b981;
  border-radius: 2px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-tab.completed .setup-progress {
  opacity: 1;
}

/* Content Area */
.content-area {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  min-height: 500px;
  position: relative;
  overflow: hidden;
}

.tab-content {
  padding: 32px;
}

/* Setup Tab Content */
.setup-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.setup-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
}

.setup-card:hover {
  border-color: #0067b8;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.setup-card.completed {
  border-color: #10b981;
  background: #f0fdf4;
}

.setup-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.setup-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.setup-icon.tracking { background: #0067b8; }
.setup-icon.mapping { background: #10b981; }
.setup-icon.pixels { background: #f59e0b; }
.setup-icon.events { background: #8b5cf6; }

.setup-title {
  font-size: 1.2em;
  font-weight: 600;
  color: #111827;
}

.setup-description {
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 16px;
}

.setup-action {
  background: #0067b8;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.setup-action:hover {
  background: #0052a3;
  transform: translateY(-1px);
}

.setup-action.completed {
  background: #10b981;
}

.code-block {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  font-family: monospace;
  font-size: 12px;
  overflow-x: auto;
}

/* Feature Preview */
.feature-preview {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12px;
  padding: 24px;
  margin-top: 32px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.preview-title {
  font-size: 1.3em;
  font-weight: 600;
  color: #111827;
}

.preview-badge {
  background: #0067b8;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 500;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.preview-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
}

.preview-icon.price { background: #3b82f6; }
.preview-icon.product { background: #10b981; }
.preview-icon.category { background: #f59e0b; }
.preview-icon.default { background: #6b7280; }

.preview-text {
  flex: 1;
}

.preview-text strong {
  display: block;
  font-weight: 600;
  color: #111827;
  margin-bottom: 2px;
}

.preview-text small {
  color: #6b7280;
  font-size: 0.85em;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .website-name {
    font-size: 2em;
  }

  .setup-overview {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .nav-tabs {
    padding: 6px;
    gap: 2px;
  }

  .nav-tab {
    padding: 10px 16px;
    font-size: 13px;
  }

  .tab-content {
    padding: 24px 20px;
  }
}
</style>