<!-- 
File: src/views/tracking/WebsiteListView.vue (REDESIGNED)
- Modern card-based design with stats overview
-->
<template>
  <div class="website-list-view">
    <!-- Header Section -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">Website Management</h1>
          <p class="page-subtitle">Manage and monitor all your connected websites</p>
        </div>
        <div class="header-right">
          <v-btn 
            color="primary" 
            size="large"
            @click="dialog = true"
            prepend-icon="mdi-plus-circle"
            class="create-btn"
          >
            Add New Website
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Alert Messages -->
    <v-alert v-if="websiteStore.error" type="error" class="mb-6" closable @click:close="websiteStore.clearMessages()">
      {{ websiteStore.error }}
    </v-alert>
    <v-alert v-if="websiteStore.successMessage" type="success" class="mb-6" closable @click:close="websiteStore.clearMessages()">
      {{ websiteStore.successMessage }}
    </v-alert>

    <!-- Stats Overview Cards -->
    <div class="stats-section">
      <div class="stats-row">
        <v-card class="stats-card">
          <v-card-text class="stats-content">
            <v-avatar class="stats-icon total" size="48" rounded="lg">
              <v-icon color="white">mdi-web</v-icon>
            </v-avatar>
            <div class="stats-info">
              <div class="stats-number">{{ websiteStats.total }}</div>
              <div class="stats-label">Total Websites</div>
            </div>
          </v-card-text>
        </v-card>
        
        <v-card class="stats-card">
          <v-card-text class="stats-content">
            <v-avatar class="stats-icon connected" size="48" rounded="lg">
              <v-icon color="white">mdi-wifi</v-icon>
            </v-avatar>
            <div class="stats-info">
              <div class="stats-number">{{ websiteStats.connected }}</div>
              <div class="stats-label">Connected</div>
            </div>
          </v-card-text>
        </v-card>
        
        <v-card class="stats-card">
          <v-card-text class="stats-content">
            <v-avatar class="stats-icon active" size="48" rounded="lg">
              <v-icon color="white">mdi-chart-line</v-icon>
            </v-avatar>
            <div class="stats-info">
              <div class="stats-number">{{ websiteStats.events }}</div>
              <div class="stats-label">Monthly Events</div>
            </div>
          </v-card-text>
        </v-card>
        
        <v-card class="stats-card">
          <v-card-text class="stats-content">
            <v-avatar class="stats-icon issues" size="48" rounded="lg">
              <v-icon color="white">mdi-alert-circle</v-icon>
            </v-avatar>
            <div class="stats-info">
              <div class="stats-number">{{ websiteStats.issues }}</div>
              <div class="stats-label">Issues</div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <div class="content-header">
        <div class="search-box">
          <v-text-field
            v-model="searchTerm"
            placeholder="Search websites..."
            variant="outlined"
            density="compact"
            hide-details
            prepend-inner-icon="mdi-magnify"
            @input="filterWebsites"
          ></v-text-field>
        </div>
        <v-btn
          variant="outlined"
          prepend-icon="mdi-filter-variant"
          @click="showFilters = !showFilters"
        >
          Filter
        </v-btn>
      </div>

      <!-- Loading State -->
      <div v-if="websiteStore.loading" class="loading-state">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="text-body-1 mt-4">Loading websites...</p>
      </div>

      <!-- Website Cards Grid -->
      <div v-else-if="filteredWebsites.length > 0" class="websites-grid">
        <div 
          v-for="website in filteredWebsites" 
          :key="website.id"
          class="website-card"
          @click="goToDetail(website)"
        >
          <div class="card-header">
            <div class="website-info">
              <h3>{{ website.name }}</h3>
              <a :href="`https://${website.domain}`" class="website-url" @click.stop>
                {{ website.domain }}
              </a>
            </div>
            <div class="connection-status" :class="getConnectionStatusClass(website)">
              <div class="status-dot" :class="getStatusDotClass(website)"></div>
              {{ getConnectionStatus(website) }}
            </div>
          </div>

          <div class="card-body">
            <div class="platform-badge">
              <v-icon size="16">{{ getPlatformIcon(website.platform_type) }}</v-icon>
              {{ getPlatformLabel(website.platform_type) }}
            </div>
            
            <div class="stats-row-small">
              <div class="stat-item">
                <div class="stat-value">{{ website.pixels_count || 0 }}</div>
                <div class="stat-label">Pixels</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ formatNumber(website.events_count) || '0' }}</div>
                <div class="stat-label">Events</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ website.filters_count || 0 }}</div>
                <div class="stat-label">Filters</div>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <div class="last-activity">
              Last activity: {{ formatLastActivity(website.last_activity) }}
            </div>
            <div class="card-actions">
              <v-btn
                icon
                size="small"
                variant="text"
                @click.stop="goToDetail(website)"
              >
                <v-icon size="16">mdi-eye</v-icon>
                <v-tooltip activator="parent" location="top">View Details</v-tooltip>
              </v-btn>
              <v-btn
                icon
                size="small"
                variant="text"
                @click.stop="editItem(website)"
              >
                <v-icon size="16">mdi-cog</v-icon>
                <v-tooltip activator="parent" location="top">Settings</v-tooltip>
              </v-btn>
              <v-btn
                icon
                size="small"
                variant="text"
                color="error"
                @click.stop="deleteItem(website)"
              >
                <v-icon size="16">mdi-delete</v-icon>
                <v-tooltip activator="parent" location="top">Delete Website</v-tooltip>
              </v-btn>
              <v-btn
                icon
                size="small"
                variant="text"
                @click.stop="showWebsiteMenu(website, $event)"
              >
                <v-icon size="16">mdi-dots-horizontal</v-icon>
                <v-tooltip activator="parent" location="top">More Actions</v-tooltip>
              </v-btn>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <v-icon size="80" color="grey-lighten-1" class="mb-4">mdi-web-off</v-icon>
        <h3 class="empty-title">No websites found</h3>
        <p class="empty-message">
          {{ searchTerm ? 'No websites match your search criteria.' : 'Start by adding your first website to begin tracking.' }}
        </p>
        <v-btn v-if="!searchTerm" color="primary" size="large" @click="dialog = true">
          Add Your First Website
        </v-btn>
      </div>
    </div>

    <!-- Dialog for creating/editing website -->
    <v-dialog v-model="dialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditMode ? 'Chỉnh sửa Website' : 'Thêm Website Mới' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field
              v-model="editedItem.name"
              label="Tên Website"
              :rules="[rules.required]"
              variant="outlined"
            ></v-text-field>
            <v-text-field
              v-model="editedItem.domain"
              label="Tên miền (ví dụ: example.com)"
              :rules="[rules.required]"
              variant="outlined"
            ></v-text-field>
            <v-select
              v-model="editedItem.platform_type"
              :items="['wordpress', 'shopify', 'html', 'other']"
              label="Nền tảng"
              :rules="[rules.required]"
              variant="outlined"
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeDialog">Hủy</v-btn>
          <v-btn color="primary" @click="saveWebsite" :loading="websiteStore.loading">Lưu</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useWebsiteStore } from '@/stores/websiteStore';
import { useRouter } from 'vue-router';

const websiteStore = useWebsiteStore();
const router = useRouter();

// State
const dialog = ref(false);
const isEditMode = ref(false);
const form = ref(null);
const editedItem = reactive({ id: null, name: '', domain: '', platform_type: 'html' });
const rules = { required: v => !!v || 'Trường này là bắt buộc.' };

// Search and filter
const searchTerm = ref('');
const showFilters = ref(false);

// Platform configurations
const platformConfigs = {
  wordpress: { label: 'WordPress', icon: 'mdi-wordpress' },
  shopify: { label: 'Shopify', icon: 'mdi-shopping' },
  html: { label: 'HTML/JS', icon: 'mdi-code-tags' },
  react: { label: 'React App', icon: 'mdi-react' },
  other: { label: 'Other', icon: 'mdi-web' }
};

// Computed properties
const websiteStats = computed(() => {
  const websites = websiteStore.websites || [];
  const connected = websites.filter(w => w.is_connected).length;
  const totalEvents = websites.reduce((sum, w) => sum + (w.events_count || 0), 0);
  const issues = websites.filter(w => !w.is_connected).length;
  
  return {
    total: websites.length,
    connected,
    events: formatNumber(totalEvents),
    issues
  };
});

const filteredWebsites = computed(() => {
  let websites = websiteStore.websites || [];
  
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    websites = websites.filter(website => 
      website.name.toLowerCase().includes(term) ||
      website.domain.toLowerCase().includes(term) ||
      getPlatformLabel(website.platform_type).toLowerCase().includes(term)
    );
  }
  
  return websites;
});

// Methods
const getPlatformIcon = (platformType) => {
  return platformConfigs[platformType]?.icon || 'mdi-web';
};

const getPlatformLabel = (platformType) => {
  return platformConfigs[platformType]?.label || platformType;
};

const getConnectionStatus = (website) => {
  return website.is_connected ? 'Connected' : 'Disconnected';
};

const getConnectionStatusClass = (website) => {
  return website.is_connected ? 'status-connected' : 'status-disconnected';
};

const getStatusDotClass = (website) => {
  return website.is_connected ? 'dot-connected' : 'dot-disconnected';
};

const formatNumber = (number) => {
  if (!number) return '0';
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
  return number.toString();
};

const formatLastActivity = (lastActivity) => {
  if (!lastActivity) return 'Never';
  
  const now = new Date();
  const activity = new Date(lastActivity);
  const diffMs = now - activity;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return activity.toLocaleDateString();
};

const filterWebsites = () => {
  // Trigger reactive update
};

const goToDetail = (website) => {
  router.push({ name: 'website-detail', params: { id: website.id } });
};

const editItem = (website) => {
  isEditMode.value = true;
  Object.assign(editedItem, {
    id: website.id,
    name: website.name,
    domain: website.domain,
    platform_type: website.platform_type
  });
  dialog.value = true;
};

const deleteItem = (website) => {
  if (confirm(`Are you sure you want to delete "${website.name}"? This action cannot be undone and will remove all associated data including pixels, events, and filters.`)) {
    websiteStore.deleteWebsite(website.id);
  }
};

const showWebsiteMenu = (website, event) => {
  // Show context menu or options
  console.log('Show menu for:', website.name);
};

const closeDialog = () => {
  dialog.value = false;
  isEditMode.value = false;
  Object.assign(editedItem, { id: null, name: '', domain: '', platform_type: 'html' });
};

const saveWebsite = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  if (isEditMode.value) {
    const success = await websiteStore.updateWebsite(editedItem.id, editedItem);
    if (success) closeDialog();
  } else {
    const success = await websiteStore.createWebsite(editedItem);
    if (success) closeDialog();
  }
};

// Load data on mount
onMounted(() => {
  websiteStore.fetchWebsites();
});
</script>

<style scoped>
.website-list-view {
  background: #f8fafc;
  min-height: 100vh;
}

/* Header Styles */
.page-header {
  background: white;
  padding: 2rem 2rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: #718096;
  font-size: 1.1rem;
}

.create-btn {
  transition: all 0.2s;
}

.create-btn:hover {
  transform: translateY(-1px);
}

/* Stats Section */
.stats-section {
  max-width: 1400px;
  margin: 0 auto 2rem;
  padding: 0 2rem;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stats-card {
  transition: all 0.2s;
  border-radius: 12px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1) !important;
}

.stats-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stats-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stats-icon.connected {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stats-icon.active {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stats-icon.issues {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stats-number {
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  line-height: 1;
}

.stats-label {
  color: #718096;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Main Content */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.search-box {
  max-width: 400px;
  width: 100%;
  flex: 1;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Website Cards Grid */
.websites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.5rem;
}

.website-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  cursor: pointer;
}

.website-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 1.5rem 1.5rem 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.website-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.25rem;
}

.website-url {
  color: #0067b8;
  font-size: 0.9rem;
  text-decoration: none;
}

.website-url:hover {
  text-decoration: underline;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-connected {
  background: #f0fff4;
  color: #22543d;
}

.status-disconnected {
  background: #fffbeb;
  color: #744210;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-connected {
  background: #22c55e;
}

.dot-disconnected {
  background: #f59e0b;
}

.card-body {
  padding: 1rem 1.5rem;
}

.platform-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: #f1f5f9;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 1rem;
}

.stats-row-small {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1rem 0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0067b8;
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: #718096;
  margin-top: 0.25rem;
}

.card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-activity {
  font-size: 0.8rem;
  color: #718096;
  flex: 1;
}

.card-actions {
  display: flex;
  gap: 0.25rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.empty-message {
  color: #718096;
  margin-bottom: 2rem;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .stats-row {
    grid-template-columns: 1fr;
  }

  .websites-grid {
    grid-template-columns: 1fr;
  }

  .content-header {
    flex-direction: column;
    gap: 1rem;
  }

  .page-header,
  .stats-section,
  .main-content {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .search-box {
    max-width: none;
  }
}

/* Vuetify overrides */
.v-btn.create-btn {
  text-transform: none;
}
</style>