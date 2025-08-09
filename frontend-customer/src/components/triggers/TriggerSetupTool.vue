<template>
  <v-app class="loomsky-trigger-app">
    <div 
      v-show="!minimized"
      class="trigger-popup"
      ref="popupRef"
      :class="{ dragging: isDragging }"
    >
      <!-- Facebook-Style Header -->
      <div 
        class="trigger-header"
        @mousedown="startDrag"
        ref="headerRef"
      >
        <div class="header-left">
          <div class="fb-icon">f</div>
          <span class="header-title">Event Trigger Setup</span>
        </div>
        <div class="header-actions">
          <button class="header-btn" @click="toggleMinimized">−</button>
          <button class="header-btn" @click="closeSetup">×</button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="trigger-content">
        <!-- Step 1: Choose Trigger Type -->
        <div v-if="currentStep === 1" class="step-content">
          <div class="step-indicator">
            <div class="step-dot active"></div>
            <div class="step-dot"></div>
            <span class="step-text">Step 1 of 2</span>
          </div>
          
          <h3 class="step-title">How do you want to track this event?</h3>
          
          <div class="trigger-options">
            <div 
              class="trigger-option"
              :class="{ selected: selectedTriggerType === 'url_match' }"
              @click="selectTriggerType('url_match')"
            >
              <div class="trigger-icon">🔗</div>
              <div class="trigger-info">
                <h4>Track by URL</h4>
                <p>Track when visitors view specific pages</p>
              </div>
            </div>
            
            <div 
              class="trigger-option"
              :class="{ selected: selectedTriggerType === 'click_element' }"
              @click="selectTriggerType('click_element')"
            >
              <div class="trigger-icon">👆</div>
              <div class="trigger-info">
                <h4>Track by Button Click</h4>
                <p>Track when visitors click specific buttons</p>
              </div>
            </div>
          </div>
          
          <div class="step-actions">
            <v-btn 
              color="primary"
              :disabled="!selectedTriggerType"
              @click="nextStep"
              class="continue-btn"
            >
              Continue
            </v-btn>
          </div>
        </div>

        <!-- Step 2A: URL Setup -->
        <div v-if="currentStep === 2 && selectedTriggerType === 'url_match'" class="step-content">
          <div class="step-indicator">
            <div class="step-dot completed"></div>
            <div class="step-dot active"></div>
            <span class="step-text">Step 2 of 2</span>
          </div>

          <h3 class="step-title">Set up URL tracking</h3>
          
          <div class="form-section">
            <div class="form-group">
              <label class="form-label">Current page URL:</label>
              <div class="url-display">{{ currentUrl }}</div>
            </div>
            
            <div class="form-group">
              <label class="form-label">URL pattern to track</label>
              <v-text-field
                v-model="urlPattern"
                placeholder="e.g., /product/, /checkout"
                variant="outlined"
                density="compact"
                hide-details="auto"
              />
              <small class="helper-text">Use wildcards: /product/* or exact matches</small>
            </div>
            
            <div class="form-group">
              <label class="form-label">URL match type</label>
              <v-select
                v-model="urlMatchType"
                :items="urlMatchTypes"
                variant="outlined"
                density="compact"
                hide-details
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">Facebook Event Type</label>
              <v-select
                v-model="eventName"
                :items="facebookEvents"
                variant="outlined"
                density="compact"
                hide-details
              />
            </div>
          </div>
          
          <div class="step-actions">
            <v-btn 
              variant="outlined"
              @click="previousStep"
              class="back-btn"
            >
              Back
            </v-btn>
            <v-btn 
              color="success"
              :loading="saving"
              :disabled="!isValidUrlTrigger"
              @click="saveTrigger"
              class="save-btn"
            >
              Save Trigger
            </v-btn>
          </div>
        </div>

        <!-- Step 2B: Click Element Setup -->
        <div v-if="currentStep === 2 && selectedTriggerType === 'click_element'" class="step-content">
          <div class="step-indicator">
            <div class="step-dot completed"></div>
            <div class="step-dot active"></div>
            <span class="step-text">Step 2 of 2</span>
          </div>

          <h3 class="step-title">Select element to track</h3>
          
          <div v-if="!selectedElement" class="selection-mode">
            <div class="selection-info">
              <v-icon size="48" color="primary" class="mb-4">mdi-cursor-default-click-outline</v-icon>
              <h4>Click on any element to track it</h4>
              <p>Move your mouse around the page and click on buttons, links, or other elements you want to track.</p>
            </div>
            
            <div class="selection-controls">
              <v-btn 
                :color="selectionMode ? 'error' : 'primary'"
                :variant="selectionMode ? 'tonal' : 'elevated'"
                @click="toggleSelectionMode"
                class="selection-btn"
              >
                <v-icon start>{{ selectionMode ? 'mdi-close' : 'mdi-cursor-default-click' }}</v-icon>
                {{ selectionMode ? 'Stop Selection' : 'Start Element Selection' }}
              </v-btn>
            </div>
          </div>

          <div v-else class="element-selected">
            <div class="selected-element-info">
              <v-icon size="24" color="success" class="mr-2">mdi-check-circle</v-icon>
              <h4>Element Selected!</h4>
            </div>
            
            <div class="element-details">
              <div class="detail-item">
                <label class="form-label">CSS Selector:</label>
                <code class="selector-display">{{ selectedElement.selector }}</code>
              </div>
              
              <div class="detail-item">
                <label class="form-label">Element Text:</label>
                <div class="text-display">{{ selectedElement.text || '(No text)' }}</div>
              </div>
              
              <div class="detail-item">
                <label class="form-label">Element Type:</label>
                <v-chip size="small" color="primary" variant="tonal">
                  {{ selectedElement.tagName }}
                </v-chip>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Facebook Event Type</label>
              <v-select
                v-model="eventName"
                :items="facebookEvents"
                variant="outlined"
                density="compact"
                hide-details
              />
            </div>
            
            <div class="selection-controls">
              <v-btn 
                variant="outlined"
                @click="clearSelection"
                class="reselect-btn"
              >
                Select Different Element
              </v-btn>
            </div>
          </div>
          
          <div class="step-actions">
            <v-btn 
              variant="outlined"
              @click="previousStep"
              class="back-btn"
            >
              Back
            </v-btn>
            <v-btn 
              color="success"
              :loading="saving"
              :disabled="!isValidClickTrigger"
              @click="saveTrigger"
              class="save-btn"
            >
              Save Trigger
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Minimized State -->
    <div 
      v-show="minimized"
      class="minimized-trigger"
      @click="toggleMinimized"
    >
      <v-icon color="white">mdi-cursor-default-click-outline</v-icon>
      <span>Event Setup</span>
    </div>

    <!-- Element Highlight Overlay -->
    <div 
      v-if="highlightedElement"
      class="element-highlight"
      :style="highlightStyle"
    ></div>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { STANDARD_EVENTS, getFacebookCompatibleEvents } from '@/constants/eventStandards';

// Props
const props = defineProps({
  websiteId: { type: String, required: true },
  pixelId: { type: String, required: true },
  token: { type: String, required: true }
});

// Reactive data
const currentStep = ref(1);
const selectedTriggerType = ref(null);
const minimized = ref(false);
const saving = ref(false);
const selectionMode = ref(false);
const selectedElement = ref(null);
const highlightedElement = ref(null);

// Form data
const urlPattern = ref('');
const urlMatchType = ref('contains');
const eventName = ref('ViewContent');

// Dragging
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const popupPosition = ref({ x: 100, y: 100 });

// Refs
const popupRef = ref(null);
const headerRef = ref(null);

// Computed
const currentUrl = computed(() => window.location.href);

const urlMatchTypes = [
  { title: 'Contains', value: 'contains' },
  { title: 'Equals', value: 'equals' },
  { title: 'Starts with', value: 'starts_with' },
  { title: 'Ends with', value: 'ends_with' },
  { title: 'Regex', value: 'regex' }
];

const facebookEvents = computed(() => {
  return getFacebookCompatibleEvents().map(event => ({
    title: event.title,
    value: event.name
  }));
});

const isValidUrlTrigger = computed(() => {
  return urlPattern.value && urlMatchType.value && eventName.value;
});

const isValidClickTrigger = computed(() => {
  return selectedElement.value && eventName.value;
});

const highlightStyle = computed(() => {
  if (!highlightedElement.value) return {};
  
  const rect = highlightedElement.value.getBoundingClientRect();
  return {
    position: 'fixed',
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    pointerEvents: 'none',
    zIndex: 9998
  };
});

// Methods
const selectTriggerType = (type) => {
  selectedTriggerType.value = type;
};

const nextStep = () => {
  if (currentStep.value === 1 && selectedTriggerType.value) {
    currentStep.value = 2;
    
    // Auto-fill URL pattern for URL triggers
    if (selectedTriggerType.value === 'url_match') {
      const url = new URL(window.location.href);
      urlPattern.value = url.pathname;
    }
  }
};

const previousStep = () => {
  if (currentStep.value === 2) {
    currentStep.value = 1;
    // Clear selection mode if going back
    if (selectionMode.value) {
      toggleSelectionMode();
    }
  }
};

const toggleMinimized = () => {
  minimized.value = !minimized.value;
};

const closeSetup = () => {
  if (confirm('Are you sure you want to close the setup tool? Any unsaved changes will be lost.')) {
    // Send message to parent window
    window.parent.postMessage({
      type: 'LOOMSKY_TRIGGER_SETUP_CANCELLED'
    }, '*');
  }
};

const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value;
  
  if (selectionMode.value) {
    startElementSelection();
  } else {
    stopElementSelection();
  }
};

const clearSelection = () => {
  selectedElement.value = null;
  toggleSelectionMode();
};

const startElementSelection = () => {
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('click', handleElementClick, true);
  document.body.style.cursor = 'crosshair';
};

const stopElementSelection = () => {
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('click', handleElementClick, true);
  document.body.style.cursor = 'default';
  highlightedElement.value = null;
};

const handleMouseOver = (event) => {
  // Don't highlight the popup itself
  if (event.target.closest('#loomsky-trigger-host')) {
    return;
  }
  
  highlightedElement.value = event.target;
};

const handleElementClick = (event) => {
  // Don't handle clicks on the popup
  if (event.target.closest('#loomsky-trigger-host')) {
    return;
  }
  
  event.preventDefault();
  event.stopPropagation();
  
  const element = event.target;
  const selector = generateCSSSelector(element);
  
  selectedElement.value = {
    element: element,
    selector: selector,
    text: element.textContent?.trim(),
    tagName: element.tagName.toLowerCase()
  };
  
  // Stop selection mode
  selectionMode.value = false;
  stopElementSelection();
};

const generateCSSSelector = (element) => {
  // Simple selector generation - can be enhanced
  let selector = element.tagName.toLowerCase();
  
  if (element.id) {
    selector += `#${element.id}`;
  } else if (element.className) {
    const classes = element.className.split(' ').filter(c => c.trim());
    if (classes.length > 0) {
      selector += '.' + classes.join('.');
    }
  }
  
  return selector;
};

const saveTrigger = async () => {
  saving.value = true;
  
  try {
    const triggerData = {
      event_name: eventName.value,
      trigger_type: selectedTriggerType.value,
      enabled: true
    };
    
    if (selectedTriggerType.value === 'url_match') {
      triggerData.url_pattern = urlPattern.value;
      triggerData.url_match_type = urlMatchType.value;
    } else if (selectedTriggerType.value === 'click_element') {
      triggerData.selector = selectedElement.value.selector;
      triggerData.element_text = selectedElement.value.text;
    }
    
    // Send trigger data to backend via API
    const response = await fetch(`/api/v1/websites/${props.websiteId}/pixels/${props.pixelId}/triggers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${props.token}`
      },
      body: JSON.stringify(triggerData)
    });
    
    if (response.ok) {
      // Success - notify parent window
      window.parent.postMessage({
        type: 'LOOMSKY_TRIGGER_SETUP_COMPLETE',
        data: triggerData
      }, '*');
    } else {
      throw new Error('Failed to save trigger');
    }
  } catch (error) {
    console.error('Error saving trigger:', error);
    alert('Failed to save trigger. Please try again.');
  } finally {
    saving.value = false;
  }
};

// Drag functionality
const startDrag = (event) => {
  isDragging.value = true;
  dragStart.value = {
    x: event.clientX - popupPosition.value.x,
    y: event.clientY - popupPosition.value.y
  };
  
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', endDrag);
};

const handleDrag = (event) => {
  if (!isDragging.value) return;
  
  popupPosition.value = {
    x: event.clientX - dragStart.value.x,
    y: event.clientY - dragStart.value.y
  };
  
  if (popupRef.value) {
    popupRef.value.style.transform = `translate(${popupPosition.value.x}px, ${popupPosition.value.y}px)`;
  }
};

const endDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', endDrag);
};

// Initialize
onMounted(() => {
  // Set initial position
  nextTick(() => {
    if (popupRef.value) {
      popupRef.value.style.transform = `translate(${popupPosition.value.x}px, ${popupPosition.value.y}px)`;
    }
  });
});

onUnmounted(() => {
  if (selectionMode.value) {
    stopElementSelection();
  }
});
</script>

<style scoped>
.loomsky-trigger-app {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
}

.loomsky-trigger-app .v-application__wrap {
  min-height: auto;
  flex: none;
}

.trigger-popup {
  position: fixed;
  top: 100px;
  left: 100px;
  width: 420px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
  overflow: hidden;
  pointer-events: auto;
  user-select: none;
  z-index: 10000;
}

.trigger-popup.dragging {
  cursor: grabbing;
}

/* Header */
.trigger-header {
  background: linear-gradient(135deg, #1877f2 0%, #4267B2 100%);
  color: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: grab;
}

.trigger-header:active {
  cursor: grabbing;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fb-icon {
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.header-title {
  font-weight: 600;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.header-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  transition: background 0.2s;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Content */
.trigger-content {
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Step Indicator */
.step-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ddd;
}

.step-dot.active {
  background: #1877f2;
}

.step-dot.completed {
  background: #42a942;
}

.step-text {
  font-size: 12px;
  color: #666;
  margin-left: 4px;
}

/* Step Title */
.step-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* Trigger Options */
.trigger-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trigger-option {
  border: 2px solid #e4e6ea;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
}

.trigger-option:hover {
  border-color: #1877f2;
  background: #f0f2f5;
}

.trigger-option.selected {
  border-color: #1877f2;
  background: #e3f2fd;
}

.trigger-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  border-radius: 50%;
}

.trigger-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.trigger-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

/* Form Section */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.url-display {
  background: #f0f2f5;
  padding: 8px 12px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
  color: #666;
}

.helper-text {
  color: #666;
  font-size: 11px;
  margin-top: 4px;
}

/* Element Selection */
.selection-mode {
  text-align: center;
  padding: 20px 0;
}

.selection-info h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
}

.selection-info p {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 13px;
  line-height: 1.4;
}

.selection-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.element-selected {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.selected-element-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.selected-element-info h4 {
  margin: 0;
  color: #28a745;
  font-size: 16px;
}

.element-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.selector-display {
  background: #e9ecef;
  padding: 6px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
}

.text-display {
  background: #e9ecef;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #495057;
}

/* Step Actions */
.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid #e4e6ea;
}

/* Minimized State */
.minimized-trigger {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #1877f2;
  color: white;
  padding: 12px 16px;
  border-radius: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
  transition: transform 0.2s;
}

.minimized-trigger:hover {
  transform: scale(1.05);
}

.minimized-trigger span {
  font-size: 14px;
  font-weight: 600;
}

/* Element Highlight */
.element-highlight {
  border: 2px solid #1877f2;
  background: rgba(24, 119, 242, 0.1);
  border-radius: 4px;
}

/* Responsive */
@media (max-width: 480px) {
  .trigger-popup {
    width: calc(100vw - 20px);
    left: 10px !important;
    top: 10px !important;
    transform: none !important;
  }
  
  .trigger-content {
    padding: 16px;
  }
  
  .step-actions {
    flex-direction: column;
  }
  
  .step-actions .v-btn {
    width: 100%;
  }
}
</style>