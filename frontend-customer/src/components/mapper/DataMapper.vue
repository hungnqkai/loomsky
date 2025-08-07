<template>
  <v-app class="loomsky-mapper-app">
    <v-card
      elevation="0"
      class="mapper-popup"
      :style="{ top: popupPosition.y + 'px', left: popupPosition.x + 'px' }"
      v-show="!isMinimized"
    >
      <!-- Enhanced Header -->
      <div
        class="mapper-header"
        @mousedown.prevent="startDrag"
      >
        <div class="header-left">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.7,19L13.6,9.9C14.5,7.6 14,4.9 12.1,3C10.1,1 7.1,0.6 4.7,1.7L9,6L6,9L1.6,4.7C0.4,7.1 0.9,10.1 2.9,12.1C4.8,14 7.5,14.5 9.8,13.6L18.9,22.7C19.3,23.1 19.9,23.1 20.3,22.7L22.6,20.4C23.1,20 23.1,19.3 22.7,19Z" fill="white"/>
          </svg>
          <span class="header-title">Data Dictionary Tool</span>
          <v-chip
            v-if="isSelectionModeActive"
            size="x-small"
            color="warning"
            variant="flat"
            class="ml-2 pulse-animation"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" class="mr-1">
              <path d="M10,2H14A2,2 0 0,1 16,4V6H20A1,1 0 0,1 21,7V9A1,1 0 0,1 20,10H19V16A2,2 0 0,1 17,18H15V20A2,2 0 0,1 13,22H11A2,2 0 0,1 9,20V18H7A2,2 0 0,1 5,16V10H4A1,1 0 0,1 3,9V7A1,1 0 0,1 4,6H8V4A2,2 0 0,1 10,2M10,4V6H14V4H10M7,10V16H17V10H7Z" fill="currentColor"/>
            </svg>
            Selecting
          </v-chip>
        </div>
        <div class="header-actions">
          <v-tooltip text="Minimize" location="bottom">
            <template v-slot:activator="{ props }">
              <button 
                v-bind="props"
                class="header-btn" 
                @click="isMinimized = true"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M20,14H4V10H20" fill="currentColor"/>
                </svg>
              </button>
            </template>
          </v-tooltip>
          <v-tooltip text="Complete and close" location="bottom">
            <template v-slot:activator="{ props }">
              <button 
                v-bind="props"
                class="header-btn" 
                @click="closeMapper"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" fill="currentColor"/>
                </svg>
              </button>
            </template>
          </v-tooltip>
        </div>
      </div>

      <!-- Enhanced Tabs -->
      <div class="mapper-tabs">
        <button 
          class="tab" 
          :class="{ active: activeTab === 'setup' }"
          @click="activeTab = 'setup'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" class="mr-1">
            <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" fill="currentColor"/>
          </svg>
          Data mapping
        </button>
        <button 
          class="tab" 
          :class="{ active: activeTab === 'all' }"
          @click="activeTab = 'all'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" class="mr-1">
            <path d="M3,5H9V11H3V5M5,7V9H7V7H5M11,7H21V9H11V7M11,15H21V17H11V15M5,20L1.5,16.5L2.91,15.09L5,17.17L9.59,12.59L11,14L5,20Z" fill="currentColor"/>
          </svg>
          All
          <v-chip
            v-if="allMappings.length > 0"
            size="x-small"
            color="primary"
            variant="flat"
            class="ml-2 tab-badge"
          >
            {{ allMappings.length }}
          </v-chip>
        </button>
      </div>

      <!-- Content Container -->
      <div class="mapper-content">
        <!-- Setup Tab Content -->
        <div v-if="activeTab === 'setup'">
          <!-- Existing Mappings Chips -->
          <div v-if="allMappings.length > 0" class="mappings-section">
            <div class="section-header">
              <span>Already set up ({{ allMappings.length }})</span>
            </div>
            
            <div class="mapping-chips">
              <div
                v-for="mapping in allMappings"
                :key="mapping.id"
                class="mapping-chip"
                @click="editMapping(mapping)"
              >
                <div class="chip-icon" :style="{ color: getVariableColor(mapping.variable_name) }">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" v-html="getVariableIcon(mapping.variable_name)">
                  </svg>
                </div>
                <span>{{ getVariableTitle(mapping.variable_name) }}</span>
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24"
                  class="chip-close ml-1" 
                  @click.stop="deleteMapping(mapping)"
                >
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" fill="currentColor"/>
                </svg>
              </div>
            </div>

            <div class="section-divider"></div>
          </div>

          <!-- Selection Area or Form -->
          <div v-if="!selectedElementData" class="selection-area">
            <p class="selection-text">
              {{ allMappings.length > 0 ? 'Add new mappings to your site' : 'Click the button below to start selecting an element on your website.' }}
            </p>
            <button
              class="selection-btn"
              :class="{ 'warning': isSelectionModeActive }"
              @click="toggleSelectionMode"
            >
              <template v-if="!isSelectionModeActive">
                <svg width="20" height="20" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M12.0234 7.625C9.60719 7.625 7.64844 9.58375 7.64844 12C7.64844 14.4162 9.60719 16.375 12.0234 16.375C14.4397 16.375 16.3984 14.4162 16.3984 12C16.3984 9.58375 14.4397 7.625 12.0234 7.625ZM9.14844 12C9.14844 10.4122 10.4356 9.125 12.0234 9.125C13.6113 9.125 14.8984 10.4122 14.8984 12C14.8984 13.5878 13.6113 14.875 12.0234 14.875C10.4356 14.875 9.14844 13.5878 9.14844 12Z" fill="currentColor"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M12.0234 4.5C7.71145 4.5 3.99772 7.05632 2.30101 10.7351C1.93091 11.5375 1.93091 12.4627 2.30101 13.2652C3.99772 16.9439 7.71145 19.5002 12.0234 19.5002C16.3353 19.5002 20.049 16.9439 21.7458 13.2652C22.1159 12.4627 22.1159 11.5375 21.7458 10.7351C20.049 7.05633 16.3353 4.5 12.0234 4.5ZM3.66311 11.3633C5.12472 8.19429 8.32017 6 12.0234 6C15.7266 6 18.922 8.19429 20.3836 11.3633C20.5699 11.7671 20.5699 12.2331 20.3836 12.6369C18.922 15.8059 15.7266 18.0002 12.0234 18.0002C8.32017 18.0002 5.12472 15.8059 3.66311 12.6369C3.47688 12.2331 3.47688 11.7671 3.66311 11.3633Z" fill="currentColor"/>
                </svg>
              </template>
              <template v-else>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" fill="currentColor"/>
                </svg>
              </template>
              <span class="ml-2">{{ isSelectionModeActive ? 'Cancel' : 'Select Elements on Page' }}</span>
            </button>
          </div>

          <!-- Selected Element Form -->
          <div v-else class="element-form">
            <div class="element-preview">
              <div class="element-label">Selected element</div>
              <div class="element-selector">{{ selectedElementData.selector }}</div>
            </div>

            <div class="form-group">
              <label class="form-label">Data type</label>
              <v-select
                v-model="selectedElementData.variable_name"
                :items="dataVariableOptions"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="comfortable"
                hide-details
                class="form-select"
              ></v-select>
            </div>

            <div class="form-group">
              <label class="form-label">Page type</label>
              <v-select
                v-model="selectedElementData.page_context"
                :items="pageContextOptions"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="comfortable"
                clearable
                hide-details
                class="form-select"
              ></v-select>
            </div>

            <div class="form-actions">
              <button class="btn btn-secondary" @click="cancelSelection">Cancel</button>
              <button class="btn btn-primary" @click="saveMapping" :disabled="isSaving">
                <v-progress-circular v-if="isSaving" size="16" width="2" indeterminate class="mr-2"></v-progress-circular>
                Save
              </button>
            </div>
          </div>
        </div>

        <!-- All Mappings Tab Content -->
        <div v-else-if="activeTab === 'all'">
          <!-- Loading State -->
          <div v-if="isLoading" class="loading-state">
            <div v-for="n in 3" :key="n" class="mapping-skeleton">
              <v-skeleton-loader type="list-item-avatar-two-line"></v-skeleton-loader>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="allMappings.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" style="color: #bdbdbd;">
                <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" fill="currentColor"/>
              </svg>
            </div>
            <h3 class="empty-title">No mapping yet</h3>
            <p class="empty-text">
              Start creating data mapping from the "Setup" tab
            </p>
            <button class="empty-action" @click="activeTab = 'setup'">
              Start setup
            </button>
          </div>

          <!-- Mappings List -->
          <div v-else class="mappings-list">
            <div
              v-for="mapping in allMappings"
              :key="mapping.id"
              class="mapping-item"
              @mouseover="highlightElementBySelector(mapping.selector)"
              @mouseleave="clearManualHighlight"
            >
              <div class="mapping-icon" :class="getVariableColor(mapping.variable_name)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" v-html="getVariableIcon(mapping.variable_name)">
                </svg>
              </div>
              
              <div class="mapping-content">
                <div class="mapping-title">{{ getVariableTitle(mapping.variable_name) }}</div>
                <div class="mapping-selector">{{ mapping.selector }}</div>
                <div v-if="mapping.page_context" class="mapping-context">
                  {{ getPageContextTitle(mapping.page_context) }}
                </div>
              </div>
              
              <div class="mapping-actions">
                <button class="action-btn" @click="deleteMapping(mapping)">
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-card>
    
    <!-- Enhanced Minimized Button -->
    <button 
      v-show="isMinimized" 
      class="minimized-btn"
      @click="isMinimized = false"
    >
      <v-badge
        v-if="allMappings.length > 0"
        :content="allMappings.length"
        color="error"
        overlap
        offset-x="8"
        offset-y="8"
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M22.7,19L13.6,9.9C14.5,7.6 14,4.9 12.1,3C10.1,1 7.1,0.6 4.7,1.7L9,6L6,9L1.6,4.7C0.4,7.1 0.9,10.1 2.9,12.1C4.8,14 7.5,14.5 9.8,13.6L18.9,22.7C19.3,23.1 19.9,23.1 20.3,22.7L22.6,20.4C23.1,20 23.1,19.3 22.7,19Z" fill="currentColor"/>
        </svg>
      </v-badge>
      <svg v-else width="24" height="24" viewBox="0 0 24 24">
        <path d="M22.7,19L13.6,9.9C14.5,7.6 14,4.9 12.1,3C10.1,1 7.1,0.6 4.7,1.7L9,6L6,9L1.6,4.7C0.4,7.1 0.9,10.1 2.9,12.1C4.8,14 7.5,14.5 9.8,13.6L18.9,22.7C19.3,23.1 19.9,23.1 20.3,22.7L22.6,20.4C23.1,20 23.1,19.3 22.7,19Z" fill="currentColor"/>
      </svg>
    </button>
  </v-app>
</template>

<script setup>
import { ref, onMounted, onUnmounted, toRaw } from 'vue';
import { generateCssSelector } from '../../utils/selectorGenerator';

const props = defineProps({
  api: { type: Object, required: true },
});

// --- STATE ---
const activeTab = ref('setup');
const isSelectionModeActive = ref(false);
const isSaving = ref(false);
const isLoading = ref(true);
const isMinimized = ref(false);
const allMappings = ref([]);
const selectedElementData = ref(null);
const popupPosition = ref({ x: 50, y: 20 });
const dragOffset = ref({ x: 0, y: 0 });
let suggestionStyleTag = null;
let highlightOverlayElement = null;
const mappedElements = ref([]);
const suggestionElements = ref([]);

// --- STATIC DATA ---
const dataVariableOptions = [
  { title: 'Product Name', value: 'product_name' },
  { title: 'Product Price', value: 'product_price' },
  { title: 'Product SKU', value: 'product_sku' },
  { title: 'Blog Title', value: 'blog_title' },
];
const pageContextOptions = [
  { title: 'Product page', value: 'product_page' },
  { title: 'Product category', value: 'product_category' },
  { title: 'Page', value: 'page' },
  { title: 'Blog detail', value: 'blog_detail' },
  { title: 'Blog category', value: 'blog_category' },
];
const suggestionStyles = `
  .loomsky-interactive-suggestion { border: 3px dashed rgba(22, 163, 74, 0.7) !important; transition: all 0.2s ease-in-out; cursor: pointer !important; }
  .loomsky-interactive-suggestion:hover { border-style: solid; outline-color: rgba(22, 163, 74, 1); box-shadow: 0 0 12px rgba(22, 163, 74, 0.5); }
  .loomsky-already-mapped { border: 3px solid #8A2BE2 !important; }
`;

// --- DRAG LOGIC ---
const startDrag = (e) => {
  dragOffset.value = { x: e.clientX - popupPosition.value.x, y: e.clientY - popupPosition.value.y };
  document.addEventListener('mousemove', doDrag);
  document.addEventListener('mouseup', stopDrag);
};
const doDrag = (e) => {
  popupPosition.value = { x: e.clientX - dragOffset.value.x, y: e.clientY - dragOffset.value.y };
};
const stopDrag = () => {
  document.removeEventListener('mousemove', doDrag);
  document.removeEventListener('mouseup', stopDrag);
};

// --- MAIN LOGIC ---
const toggleSelectionMode = () => { isSelectionModeActive.value = !isSelectionModeActive.value; };
const cancelSelection = () => { selectedElementData.value = null; };

// Helper functions
const getVariableIcon = (variableName) => {
  const iconMap = {
    'product_name': `<path d="M5.5 7C5.5 5.61929 6.61929 4.5 8 4.5H16C17.3807 4.5 18.5 5.61929 18.5 7V17C18.5 18.3807 17.3807 19.5 16 19.5H8C6.61929 19.5 5.5 18.3807 5.5 17V7Z" stroke="currentColor" stroke-width="1.5"/><path d="M8.5 8.5H15.5M8.5 12H15.5M8.5 15.5H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    'product_price': `<path d="M12 1.5C17.7989 1.5 22.5 6.20101 22.5 12C22.5 17.799 17.7989 22.5 12 22.5C6.20101 22.5 1.5 17.799 1.5 12C1.5 6.20101 6.20101 1.5 12 1.5Z" stroke="currentColor" stroke-width="1.5"/><path d="M15.5 8.5C15.2239 7.91565 14.7721 7.44365 14.2 7.16795C13.6279 6.89224 12.9754 6.82781 12.35 7C11.7246 7.17219 11.1754 7.54794 10.7934 8.06218C10.4114 8.57643 10.2207 9.19894 10.25 9.83C10.25 12 12 12.75 12 12.75S13.75 13.5 13.75 15.17C13.7793 15.8011 13.5886 16.4236 13.2066 16.9378C12.8246 17.4521 12.2754 17.8278 11.65 18C11.0246 18.1722 10.3721 18.1078 9.8 17.8321C9.22792 17.5563 8.77608 17.0844 8.5 16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    'product_sku': `<path d="M2.5 6.5C2.5 4.84315 3.84315 3.5 5.5 3.5H18.5C20.1569 3.5 21.5 4.84315 21.5 6.5V17.5C21.5 19.1569 20.1569 20.5 18.5 20.5H5.5C3.84315 20.5 2.5 19.1569 2.5 17.5V6.5Z" stroke="currentColor" stroke-width="1.5"/><path d="M6 8V16M8 8V16M10 8V16M12 8V16M14 8V16M16 8V16M18 8V16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`
  };
  return iconMap[variableName] || `<path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z" stroke="currentColor" stroke-width="1.5"/>`;
};

const getVariableColor = (variableName) => {
  const colorMap = {
    'product_name': 'blue',
    'product_price': 'green', 
    'product_sku': 'orange'
  };
  return colorMap[variableName] || 'grey';
};

const getVariableTitle = (variableName) => {
  const option = dataVariableOptions.find(opt => opt.value === variableName);
  return option ? option.title.split(' (')[0] : variableName;
};

const getPageContextTitle = (pageContext) => {
  const option = pageContextOptions.find(opt => opt.value === pageContext);
  return option ? option.title.split(' (')[0] : pageContext;
};

const editMapping = (mapping) => {
  selectedElementData.value = {
    id: mapping.id,
    variable_name: mapping.variable_name,
    page_context: mapping.page_context,
    selector: mapping.selector,
  };
  highlightElementBySelector(mapping.selector);
};

const handleMouseOver = (e) => {
  if (!isSelectionModeActive.value) return;
  if (e.target.closest('#loomsky-mapper-host')) {
    highlightOverlayElement.style.display = 'none';
    return;
  }
  const target = e.target.closest('.loomsky-interactive-suggestion, .loomsky-already-mapped') || e.target;
  const rect = target.getBoundingClientRect();
  Object.assign(highlightOverlayElement.style, {
    display: 'block',
    width: `${rect.width}px`, height: `${rect.height}px`,
    top: `${rect.top + window.scrollY}px`, left: `${rect.left + window.scrollX}px`,
  });
};

const handleClick = (e) => {
  if (!isSelectionModeActive.value) return;
  const target = e.target.closest('.loomsky-interactive-suggestion, .loomsky-already-mapped') || e.target;
  if (target.closest('#loomsky-mapper-host')) return;
  e.preventDefault(); e.stopPropagation();
  const selector = generateCssSelector(target);
  const existingMapping = allMappings.value.find(m => m.selector === selector);
  selectedElementData.value = {
      id: existingMapping?.id || null,
      variable_name: existingMapping?.variable_name || null,
      page_context: existingMapping?.page_context || null,
      selector: selector,
  };
  isSelectionModeActive.value = false;
  activeTab.value = 'setup';
};

const saveMapping = async () => {
    if (!selectedElementData.value?.variable_name) {
        alert('Vui lòng chọn loại dữ liệu.');
        return;
    }
    isSaving.value = true;
    
    const plainPayload = toRaw(selectedElementData.value);

    window.opener.postMessage({
        type: 'LOOMSKY_SAVE_MAPPING',
        payload: plainPayload,
    }, '*');
    
    setTimeout(async () => {
        await fetchAndHighlight();
        isSaving.value = false;
        selectedElementData.value = null;
    }, 500);
};

const deleteMapping = async (mappingToDelete) => {
    if (confirm(`Are you sure you want to delete the mapping for "${getVariableTitle(mappingToDelete.variable_name)}"?`)) {
        const plainPayload = { id: toRaw(mappingToDelete).id };

        window.opener.postMessage({
            type: 'LOOMSKY_DELETE_MAPPING',
            payload: plainPayload,
        }, '*');
        
        allMappings.value = allMappings.value.filter(m => m.id !== mappingToDelete.id);
    }
};

const closeMapper = () => { window.opener.postMessage({ type: 'LOOMSKY_CLOSE_MAPPER' }, '*'); };

const fetchAndHighlight = async () => {
  isLoading.value = true;
  const mappings = await props.api.getDataMappings();
  if (mappings) {
    allMappings.value = mappings;
    highlightExistingMappings();
  }
  isLoading.value = false;
};

const highlightExistingMappings = () => {
    mappedElements.value.forEach(el => el.classList.remove('loomsky-already-mapped'));
    mappedElements.value = [];
    allMappings.value.forEach(mapping => {
        try {
            document.querySelectorAll(mapping.selector).forEach(el => {
                el.classList.add('loomsky-already-mapped');
                mappedElements.value.push(el);
            });
        } catch { }
    });
};

const highlightElementBySelector = (selector) => {
  if (!selector || !highlightOverlayElement) return;
  try {
    const target = document.querySelector(selector);
    if (target) {
      const rect = target.getBoundingClientRect();
      Object.assign(highlightOverlayElement.style, {
        display: 'block', width: `${rect.width}px`, height: `${rect.height}px`,
        top: `${rect.top + window.scrollY}px`, left: `${rect.left + window.scrollX}px`,
      });
    } else {
      highlightOverlayElement.style.display = 'none';
    }
  } catch { }
};

const clearManualHighlight = () => {
  if (highlightOverlayElement) {
    highlightOverlayElement.style.display = 'none';
  }
};

const findInteractiveElements = () => {
  const selectors = [ 'button', 'a[href]', 'input:not([type="hidden"])', '[role="button"]', '[onclick]', '[data-cy]', '[data-testid]', '.btn', '.button', '.price', '[class*="price"]' ];
  try {
    document.querySelectorAll(selectors.join(', ')).forEach(el => {
      if (!el.closest('#loomsky-mapper-host')) {
        el.classList.add('loomsky-interactive-suggestion');
        suggestionElements.value.push(el);
      }
    });
  } catch {}
};

// --- LIFECYCLE HOOKS ---
onMounted(async () => {
  suggestionStyleTag = document.createElement('style');
  suggestionStyleTag.id = 'loomsky-suggestion-styles';
  suggestionStyleTag.innerHTML = suggestionStyles;
  document.head.appendChild(suggestionStyleTag);

  highlightOverlayElement = document.createElement('div');
  highlightOverlayElement.id = 'loomsky-highlight-overlay';
  Object.assign(highlightOverlayElement.style, {
    position: 'absolute', backgroundColor: 'rgba(29, 109, 240, 0.25)', border: '2px solid #1d6df0',
    borderRadius: '4px', zIndex: '2147483646', pointerEvents: 'none',
    transition: 'all 0.1s ease-in-out', display: 'none',
  });
  document.body.appendChild(highlightOverlayElement);

  await fetchAndHighlight();
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('click', handleClick, true);
  setTimeout(findInteractiveElements, 100);
});

onUnmounted(() => {
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('click', handleClick, true);
  if (suggestionStyleTag) suggestionStyleTag.remove();
  if (highlightOverlayElement) highlightOverlayElement.remove();
  
  suggestionElements.value.forEach(el => { if (el) el.classList.remove('loomsky-interactive-suggestion'); });
  mappedElements.value.forEach(el => { if (el) el.classList.remove('loomsky-already-mapped'); });
});
</script>

<style>
.loomsky-mapper-app {
  background: transparent !important;
  position: static !important;
  pointer-events: auto;
}

.loomsky-mapper-app .v-application__wrap {
  min-height: 0 !important;
  position: static !important;
}

/* Enhanced Popup */
.mapper-popup { 
  position: fixed !important; 
  width: 450px !important; 
  z-index: 2147483647; 
  background: white;
  border-radius: 16px !important;
  overflow: hidden !important;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
  transform: none !important;
  border: none !important;
}

/* Enhanced Header */
.mapper-header {
  background: #0067b8;
  color: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: move;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-weight: 600;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-btn {
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 6px;
  color: white;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.header-btn:hover {
  background: rgba(255,255,255,0.2);
  transform: scale(1.05);
}

/* Enhanced Tabs */
.mapper-tabs {
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.tab {
  flex: 1;
  padding: 14px 20px;
  text-align: center;
  cursor: pointer;
  font-weight: 500;
  color: #64748b;
  background: transparent;
  border: none;
  transition: all 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.tab.active {
  color: #0067b8;
  background: white;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #0067b8;
}

.tab-badge {
  font-size: 11px !important;
  height: 18px !important;
  min-width: 18px !important;
}

/* Content */
.mapper-content {
  padding: 24px;
  max-height: 450px;
  overflow-y: auto;
}

.mapper-content::-webkit-scrollbar {
  width: 6px;
}

.mapper-content::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.mapper-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

/* Mappings Section */
.mappings-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.mapping-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.mapping-chip {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.mapping-chip:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.chip-icon {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chip-close {
  color: #94a3b8 !important;
  cursor: pointer;
  transition: color 0.2s;
}

.chip-close:hover {
  color: #ef4444 !important;
}

.section-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
  margin: 16px 0;
}

/* Selection Area */
.selection-area {
  text-align: center;
  padding: 20px 0;
}

.selection-text {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.selection-btn {
  background: #0067b8;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
  transition: all 0.2s;
  font-size: 14px;
}

.selection-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.selection-btn.warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.selection-btn.warning:hover {
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

/* Element Form */
.element-form {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  animation: fadeInUp 0.3s ease-out;
}

.element-preview {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.element-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
  font-weight: 500;
}

.element-selector {
  font-family: 'JetBrains Mono', 'Monaco', monospace;
  font-size: 12px;
  color: #374151;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
  word-break: break-all;
  border: 1px solid #e2e8f0;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.form-select {
  background: white !important;
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-secondary {
  background: white;
  color: #64748b;
  border-color: #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-primary {
  background: #0067b8;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #0067b8;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

/* Loading States */
.loading-state {
  padding: 16px;
}

.mapping-skeleton {
  margin-bottom: 12px;
}

/* Empty States */
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  background: #f3f4f6;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: #9ca3af;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.empty-text {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
}

.empty-action {
  background: #0067b8;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.empty-action:hover {
  background: #0067b8;
  transform: translateY(-1px);
}

/* Mappings List */
.mappings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mapping-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  animation: fadeIn 0.3s ease-out;
}

.mapping-item:hover {
  border-color: #0067b8;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
  transform: translateY(-1px);
}

.mapping-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.mapping-icon.blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
.mapping-icon.green { background: linear-gradient(135deg, #10b981, #047857); }
.mapping-icon.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
.mapping-icon.grey { background: linear-gradient(135deg, #6b7280, #4b5563); }

.mapping-content {
  flex: 1;
  min-width: 0;
}

.mapping-title {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  font-size: 14px;
}

.mapping-selector {
  font-family: 'JetBrains Mono', 'Monaco', monospace;
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 2px;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px solid #e5e7eb;
}

.mapping-context {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
}

.mapping-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.mapping-item:hover .mapping-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #fee2e2;
  color: #dc2626;
  transform: scale(1.1);
}

/* Enhanced Minimized Button */
.minimized-btn {
  position: fixed !important;
  top: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #0067b8;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
  transition: all 0.2s;
  z-index: 2147483647;
}

.minimized-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.pulse-animation {
  animation: pulse 2s infinite;
}

/* Override Vuetify styles */
.mapper-popup .v-card {
  box-shadow: none !important;
}

.mapper-popup .v-select .v-field {
  background: white !important;
}

.mapper-popup .v-select .v-field--focused {
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
}

.minimized-btn .v-badge__badge {
  bottom: calc(100%) !important;
  left: calc(100%) !important;
}
</style>