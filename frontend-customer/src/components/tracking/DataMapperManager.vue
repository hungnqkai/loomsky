<template>
  <div class="data-dictionary-container">
    <v-card class="header-section mb-6" rounded="lg" elevation="0">
      <!-- Header Section -->
      <div class="header">
        <div class="header-content">
          <div class="header-left">
            <h1 class="text-h5">Data Dictionary</h1>
            <p class="text-body-1 text--secondary">"Teach" LoomSky where important data (prices, product names, etc.) is located on your website. These mappings will be applied to the entire website.</p>
          </div>
          
        </div>
      </div>

      <!-- Stats Section -->
      <div class="header-right">
        <button 
            class="add-btn" 
            @click="startSetupSession"
            :disabled="websiteStore.actionLoading"
          >
            <v-progress-circular 
              v-if="websiteStore.actionLoading" 
              size="20" 
              width="2" 
              indeterminate 
              class="mr-2"
            ></v-progress-circular>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.7,19L13.6,9.9C14.5,7.6 14,4.9 12.1,3C10.1,1 7.1,0.6 4.7,1.7L9,6L6,9L1.6,4.7C0.4,7.1 0.9,10.1 2.9,12.1C4.8,14 7.5,14.5 9.8,13.6L18.9,22.7C19.3,23.1 19.9,23.1 20.3,22.7L22.6,20.4C23.1,20 23.1,19.3 22.7,19Z"/>
            </svg>
            Add Data Dictionary
          </button>

          <div class="stats-grid">
            <v-card rounded="lg" class="total" variant="tonal" style="min-width: 70px; max-width: 140px; ">
              <v-card-text class="pa-5 text-center">
                <div class="text-h4 stat-number">{{ totalMappings }}</div>
                <div class="text-caption">Total Mappings</div>
              </v-card-text>
            </v-card>
            <v-card rounded="lg" class="pages" variant="tonal" style="min-width: 70px; max-width: 140px; ">
              <v-card-text class="pa-5 text-center">
                <div class="text-h4 stat-number">{{ pagesCovered }}</div>
                <div class="text-caption">Pages Covered</div>
              </v-card-text>
            </v-card>
          </div>
      </div>
      
    </v-card>
    <!-- Alerts -->
    <div class="content">
      <v-alert v-if="websiteStore.error" type="error" class="mb-4" closable @click:close="websiteStore.clearMessages()">
        {{ websiteStore.error }}
      </v-alert>
      <v-alert v-if="websiteStore.successMessage" type="success" class="mb-4" closable @click:close="websiteStore.clearMessages()">
        {{ websiteStore.successMessage }}
      </v-alert>

      <!-- Search & Filter Section -->
      <div class="section-header">
        <h2 class="section-title text-h6">Data Mappings</h2>
        <div class="search-filter">
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search mappings..." 
            v-model="searchTerm"
          >
          <button 
            class="filter-btn" 
            :class="{ active: selectedPageType === 'all' }"
            @click="selectedPageType = 'all'"
          >
            All
          </button>
          <button 
            v-for="pageType in availablePageTypes" 
            :key="pageType"
            class="filter-btn" 
            :class="{ active: selectedPageType === pageType }"
            @click="selectedPageType = pageType"
          >
            {{ getPageTypeDisplayName(pageType) }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="websiteStore.loading" class="loading-state">
        <div v-for="n in 3" :key="n" class="mapping-skeleton">
          <v-skeleton-loader type="card"></v-skeleton-loader>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredMappings.length === 0 && !searchTerm && selectedPageType === 'all'" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3 class="empty-title">No Data Mappings Yet</h3>
        <p class="empty-text">Get started by creating your first data mapping to help LoomSky understand your website structure.</p>
        <button class="empty-action" @click="startSetupSession">Create First Mapping</button>
      </div>

      <!-- No Results State -->
      <div v-else-if="filteredMappings.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3 class="empty-title">No Results Found</h3>
        <p class="empty-text">Try adjusting your search or filter criteria.</p>
        <button class="empty-action" @click="clearFilters">Clear Filters</button>
      </div>

      <!-- Mappings Grid -->
      <div v-else class="mappings-grid">
        <div
          v-for="mapping in filteredMappings"
          :key="mapping.id"
          class="mapping-card"
          :class="getVariableTypeClass(mapping.variable_name)"
          @mouseenter="highlightElementBySelector(mapping.selector)"
          @mouseleave="clearManualHighlight"
        >
          <div class="status-indicator"></div>
          <div class="mapping-header">
            <div class="mapping-type">
              <div class="type-icon" :class="getVariableTypeClass(mapping.variable_name)">
                {{ getVariableIcon(mapping.variable_name) }}
              </div>
              <div class="type-info">
                <h3>{{ getVariableTitle(mapping.variable_name) }}</h3>
                <span v-if="mapping.page_context" class="type-context">
                  {{ getPageContextTitle(mapping.page_context) }}
                </span>
              </div>
            </div>
            <div class="mapping-actions">
              <button class="action-btn edit" title="Edit mapping" @click="editMapping(mapping)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                </svg>
              </button>
              <button class="action-btn delete" title="Delete mapping" @click="openDeleteDialog(mapping)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="selector-code">{{ mapping.selector }}</div>
        </div>
      </div>
    </div>

    <!-- Delete Dialog -->
    <ConfirmDialog
      v-model="deleteDialog"
      title="Confirm deletion"
      :message="`Are you sure you want to delete the mapping for <strong>${itemToDelete?.variable_name}</strong>?`"
      confirm-text="Delete"
      confirm-color="error"
      :loading="websiteStore.actionLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useWebsiteStore } from '@/stores/websiteStore';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';

const props = defineProps({
  websiteId: { type: String, required: true },
});

const websiteStore = useWebsiteStore();
let mapperWindow = null;

// Reactive data
const searchTerm = ref('');
const selectedPageType = ref('all');

// Computed properties
const totalMappings = computed(() => websiteStore.dataMappings.length);

const pagesCovered = computed(() => {
  const contexts = websiteStore.dataMappings
    .map(m => m.page_context)
    .filter(Boolean);
  return [...new Set(contexts)].length;
});

const lastUpdated = computed(() => {
  if (websiteStore.dataMappings.length === 0) return 'Never';
  
  const dates = websiteStore.dataMappings
    .map(m => new Date(m.updated_at || m.created_at))
    .filter(date => !isNaN(date));
  
  if (dates.length === 0) return 'Never';
  
  const latest = new Date(Math.max(...dates));
  const now = new Date();
  const diffMs = now - latest;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return latest.toLocaleDateString();
});

const availablePageTypes = computed(() => {
  const pageTypes = websiteStore.dataMappings
    .map(m => m.page_context)
    .filter(Boolean);
  return [...new Set(pageTypes)].sort();
});

const filteredMappings = computed(() => {
  let mappings = websiteStore.dataMappings;
  
  // Filter by page type
  if (selectedPageType.value !== 'all') {
    mappings = mappings.filter(m => m.page_context === selectedPageType.value);
  }
  
  // Filter by search term
  if (searchTerm.value.trim()) {
    const term = searchTerm.value.toLowerCase().trim();
    mappings = mappings.filter(m => 
      m.variable_name.toLowerCase().includes(term) ||
      m.selector.toLowerCase().includes(term) ||
      (m.page_context && m.page_context.toLowerCase().includes(term))
    );
  }
  
  return mappings;
});

// Methods
const clearFilters = () => {
  searchTerm.value = '';
  selectedPageType.value = 'all';
};

const getPageTypeDisplayName = (pageType) => {
  return pageType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getVariableTypeClass = (variableName) => {
  const typeMap = {
    'product_price': 'price',
    'sale_price': 'price',
    'regular_price': 'price',
    'product_name': 'product',
    'product_title': 'product',
    'category_name': 'category',
    'category': 'category',
    'product_description': 'description',
    'description': 'description',
    'product_image': 'image',
    'image_url': 'image'
  };
  return typeMap[variableName] || 'default';
};

const getVariableIcon = (variableName) => {
  const iconMap = {
    'product_price': '$',
    'sale_price': '$',
    'regular_price': '$',
    'product_name': '📦',
    'product_title': '📦',
    'category_name': '🏷️',
    'category': '🏷️',
    'product_description': '📝',
    'description': '📝',
    'product_image': '🖼️',
    'image_url': '🖼️'
  };
  return iconMap[variableName] || '📄';
};

const getVariableTitle = (variableName) => {
  const titleMap = {
    'product_price': 'Product Price',
    'sale_price': 'Sale Price',
    'regular_price': 'Regular Price',
    'product_name': 'Product Name',
    'product_title': 'Product Title',
    'category_name': 'Category Name',
    'category': 'Category',
    'product_description': 'Product Description',
    'description': 'Description',
    'product_image': 'Product Image',
    'image_url': 'Image URL'
  };
  return titleMap[variableName] || variableName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getPageContextTitle = (pageContext) => {
  if (!pageContext) return '';
  return pageContext.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const highlightElementBySelector = (selector) => {
  // Dashboard không thể highlight elements trên website khác domain
  // Chỉ log để debug
  console.log('Would highlight selector:', selector);
};

const clearManualHighlight = () => {
  // Không cần làm gì trên dashboard
};

const editMapping = (mapping) => {
  // Implement edit functionality
  console.log('Edit mapping:', mapping);
};

// Delete Dialog Logic
const deleteDialog = ref(false);
const itemToDelete = ref(null);

const openDeleteDialog = (item) => {
  itemToDelete.value = item;
  deleteDialog.value = true;
};

const confirmDelete = async () => {
  if (itemToDelete.value) {
    await websiteStore.deleteDataMapping(props.websiteId, itemToDelete.value.id);
    deleteDialog.value = false;
  }
};

// Mapper Logic
const startSetupSession = async () => {
  const token = await websiteStore.initSetupSession(props.websiteId);
  if (!token) return;

  const domain = websiteStore.currentWebsite?.domain;
  if (!domain) {
    websiteStore.error = "Không tìm thấy tên miền của website.";
    return;
  }

  const url = domain.startsWith('http') ? domain : `https://${domain}`;
  const mapperUrl = new URL(url);
  mapperUrl.searchParams.set('ls_setup_mode', 'true');
  mapperUrl.searchParams.set('ls_token', token);

  mapperWindow = window.open(mapperUrl.href, '_blank');
  window.addEventListener('message', handleMapperMessage);
};

const handleMapperMessage = async (event) => {
  const { type, payload } = event.data;

  if (type === 'LOOMSKY_SAVE_MAPPING') {
    const success = await websiteStore.addDataMapping(props.websiteId, payload);
    if (success) {
      console.log('[LOOMSKY APP]: Lưu thành công, đang tải lại danh sách...');
      await websiteStore.fetchDataMappings(props.websiteId);
    }
  }

  if (type === 'LOOMSKY_CLOSE_MAPPER') {
    if (mapperWindow) mapperWindow.close();
    cleanupListener();
  }
};

const cleanupListener = () => {
  window.removeEventListener('message', handleMapperMessage);
  mapperWindow = null;
};

// Lifecycle
onMounted(() => {
  console.log('[LOOMSKY APP]: DataMapperManager đã được mount.');
  websiteStore.fetchDataMappings(props.websiteId);
  window.addEventListener('message', handleMapperMessage);
});

onUnmounted(() => {
  console.log('[LOOMSKY APP]: DataMapperManager sắp bị unmount.');
  cleanupListener();
});
</script>

<style scoped>
.data-dictionary-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
  overflow: hidden;
}

/* Header Section */
.header {
  color: black;
  padding: 30px;
  position: relative;
  overflow: hidden;
  width: 100%;
}

.header-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 30px;
}

.header-left h1 {
  font-size: 2.5em;
  font-weight: 700;
  margin-bottom: 10px;
}

.header-left p {
  font-size: 1.1em;
  opacity: 0.9;
  line-height: 1.6;
  max-width: 600px;
}

.add-btn {
  background: var(--loomsky-primary);
  border: 2px solid rgba(255,255,255,0.3);
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  
}

.add-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.add-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Stats Section */
.stats-grid {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  padding: 30px 0;
  background: #f8fafc;
  width: 100%;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.total {border-left-color: #f59e0b;}
.pages { border-left-color: #10b981; }

.stat-number {
  font-weight: 700;
  margin-bottom: 8px;
}

.total { color: #f59e0b; }
.pages { color: #10b981; }

/* Content Section */
.content {
  padding: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.5em;
  font-weight: 600;
  color: #1e293b;
}

.search-filter {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 200px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.filter-btn {
  padding: 10px 16px;
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.filter-btn:hover {
  background: #e2e8f0;
}

.filter-btn.active {
  background: #3b82f6;
  color: white;
}

/* Loading State */
.loading-state {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.mapping-skeleton {
  height: 200px;
}

/* Mappings Grid */
.mappings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.mapping-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.mapping-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  transition: all 0.3s ease;
}

.mapping-card.price::before { background: #3b82f6; }
.mapping-card.product::before { background: #10b981; }
.mapping-card.category::before { background: #f59e0b; }
.mapping-card.description::before { background: #8b5cf6; }
.mapping-card.image::before { background: #ef4444; }
.mapping-card.default::before { background: #64748b; }

.mapping-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  border-color: #cbd5e1;
}

.mapping-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.mapping-type {
  display: flex;
  align-items: center;
  gap: 10px;
}

.type-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
}

.type-icon.price { background: #3b82f6; }
.type-icon.product { background: #10b981; }
.type-icon.category { background: #f59e0b; }
.type-icon.description { background: #8b5cf6; }
.type-icon.image { background: #ef4444; }
.type-icon.default { background: #64748b; }

.type-info h3 {
  font-size: 1.1em;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.type-context {
  font-size: 0.85em;
  color: #64748b;
  padding: 2px 8px;
  background: #f1f5f9;
  border-radius: 4px;
}

.mapping-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.action-btn.edit {
  background: #f0f9ff;
  color: #0369a1;
}

.action-btn.delete {
  background: #fef2f2;
  color: #dc2626;
}

.action-btn:hover {
  transform: scale(1.1);
}

.selector-code {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 12px;
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
  color: #374151;
  margin-top: 12px;
  word-break: break-all;
}

.status-indicator {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 4em;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.5em;
  font-weight: 600;
  margin-bottom: 12px;
  color: #374151;
}

.empty-text {
  font-size: 1em;
  line-height: 1.6;
  margin-bottom: 24px;
}

.empty-action {
  background: #3b82f6;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.empty-action:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.header-section {
    background: white;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important;
    display: flex;
}

.header-right {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .mappings-grid {
    grid-template-columns: 1fr;
  }

  .search-filter {
    flex-direction: column;
    align-items: stretch;
  }

  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
}
</style>