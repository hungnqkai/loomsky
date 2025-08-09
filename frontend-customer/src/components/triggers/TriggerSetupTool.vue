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

      <!-- Success Message -->
      <div v-if="showSuccessMessage" class="success-message">
        <v-icon color="success" size="24" class="mr-2">mdi-check-circle</v-icon>
        <span>{{ successMessage }}</span>
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

          <!-- Existing Events List -->
          <div v-if="existingTriggers.length > 0" class="existing-events-section">
            <div class="existing-events-header">
              <h4 class="existing-events-title">
                Events Already Setup ({{ existingTriggers.length }})
              </h4>
            </div>
            <div class="existing-events-list">
              <div 
                v-for="trigger in displayedTriggers" 
                :key="trigger.id"
                class="existing-event-item"
                :class="getTriggerTypeClass(trigger.trigger_type)"
              >
                <div class="event-icon">
                  {{ trigger.trigger_type === 'url_match' ? '🔗' : '👆' }}
                </div>
                <div class="event-details">
                  <div class="event-name">{{ trigger.event_name }}</div>
                  <div class="event-target">
                    <span v-if="trigger.trigger_type === 'url_match'">
                      URL: {{ trigger.url_pattern }}
                    </span>
                    <span v-else>
                      Element: {{ trigger.element_text || (trigger.selector ? trigger.selector.substring(0, 30) + '...' : 'N/A') }}
                    </span>
                  </div>
                </div>
                <div class="event-status">
                  <v-chip 
                    size="x-small" 
                    :color="trigger.enabled ? 'success' : 'warning'"
                    variant="flat"
                  >
                    {{ trigger.enabled ? 'Active' : 'Inactive' }}
                  </v-chip>
                </div>
              </div>
              
              <!-- See More/Less Button -->
              <div v-if="hasMoreEvents" class="see-more-section">
                <button 
                  class="see-more-btn"
                  @click="showAllEvents = !showAllEvents"
                >
                  <v-icon size="16" class="mr-1">
                    {{ showAllEvents ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                  </v-icon>
                  {{ showAllEvents ? `Hide ${existingTriggers.length - 3} events` : `See ${existingTriggers.length - 3} more events` }}
                </button>
              </div>
            </div>
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
          
          <!-- Remove Continue button - auto-advance -->
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
              <select 
                v-model="eventName" 
                class="native-select"
                style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
              >
                <option value="" disabled>Select event type</option>
                <option 
                  v-for="event in facebookEvents" 
                  :key="event.value" 
                  :value="event.value"
                >
                  {{ event.title }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="step-actions">
            <v-btn 
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
          
          <div v-if="!selectedElement" class="selection-mode">
            <div class="selection-info">
              <h4>Click on any element to track it</h4>
              <p>Move your mouse around the page and click on buttons, links, or other elements you want to track.</p>
            </div>
            
            <div class="selection-controls">
              <v-btn 
                :color="selectionMode ? 'error' : 'primary'"
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
              <h4>Element Selected!</h4>
            </div>
            
            <div class="element-details">
              <!-- Existing trigger warning -->
              <div v-if="selectedElement.hasExistingTrigger" class="existing-trigger-warning">
                <v-icon color="warning" class="mr-2">mdi-alert-circle</v-icon>
                <div>
                  <strong>This element already has a trigger:</strong>
                  <div class="existing-trigger-info">
                    Event: {{ selectedElement.existingTrigger.event_name }}
                  </div>
                </div>
              </div>
              
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
              <select 
                v-model="eventName" 
                class="native-select"
                style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
              >
                <option value="" disabled>Select event type</option>
                <option 
                  v-for="event in facebookEvents" 
                  :key="event.value" 
                  :value="event.value"
                >
                  {{ event.title }}
                </option>
              </select>
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
const showSuccessMessage = ref(false);
const successMessage = ref('');
const showAllEvents = ref(false);
const suggestionElements = ref([]);
const triggeredElements = ref([]);
const existingTriggers = ref([]);
let suggestionStyleTag = null;

// Form data
const urlPattern = ref('');
const urlMatchType = ref('contains');
const eventName = ref('');

// Dragging
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const popupPosition = ref({ x: 20, y: 50 });

// Refs
const popupRef = ref(null);
const headerRef = ref(null);

// Computed
const currentUrl = computed(() => window.location.href);

const displayedTriggers = computed(() => {
  if (showAllEvents.value || existingTriggers.value.length <= 3) {
    return existingTriggers.value;
  }
  return existingTriggers.value.slice(0, 3);
});

const hasMoreEvents = computed(() => {
  return existingTriggers.value.length > 3;
});

// Event Trigger specific suggestion styles (different from mapping data)
const suggestionStyles = `
  .loomsky-trigger-suggestion { 
    border: 3px dashed rgba(59, 130, 246, 0.7) !important; 
    transition: all 0.2s ease-in-out; 
    cursor: pointer !important;
    position: relative;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.3) !important;
  }
  .loomsky-trigger-suggestion:hover { 
    border-style: solid !important;
    border-color: rgba(59, 130, 246, 1) !important;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.6) !important;
    transform: scale(1.02) !important;
  }
  .loomsky-already-triggered { 
    border: 3px solid #8B5CF6 !important; 
    background: rgba(139, 92, 246, 0.1) !important;
    position: relative;
  }
`;

const urlMatchTypes = [
  { title: 'Contains', value: 'contains' },
  { title: 'Equals', value: 'equals' },
  { title: 'Starts with', value: 'starts_with' },
  { title: 'Ends with', value: 'ends_with' },
  { title: 'Regex', value: 'regex' }
];

const facebookEvents = computed(() => {
  try {
    const events = getFacebookCompatibleEvents();
    console.log('Facebook events loaded:', events);
    return events.map(event => ({
      title: event.title,
      value: event.name
    }));
  } catch (error) {
    console.error('Error loading Facebook events:', error);
    // Fallback to hardcoded events if import fails
    return [
      { title: 'Page View', value: 'PageView' },
      { title: 'View Content', value: 'ViewContent' },
      { title: 'Add to Cart', value: 'AddToCart' },
      { title: 'Add to Wishlist', value: 'AddToWishlist' },
      { title: 'Initiate Checkout', value: 'InitiateCheckout' },
      { title: 'Purchase', value: 'Purchase' },
      { title: 'Lead', value: 'Lead' },
      { title: 'Complete Registration', value: 'CompleteRegistration' },
      { title: 'Search', value: 'Search' },
      { title: 'Contact', value: 'Contact' }
    ];
  }
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
const getTriggerTypeClass = (triggerType) => {
  return triggerType === 'url_match' ? 'url-trigger' : 'click-trigger';
};

const resetToStep1 = () => {
  currentStep.value = 1;
  selectedTriggerType.value = null;
  selectedElement.value = null;
  urlPattern.value = '';
  urlMatchType.value = 'contains';
  eventName.value = '';
  selectionMode.value = false;
  showSuccessMessage.value = false;
};

const selectTriggerType = (type) => {
  selectedTriggerType.value = type;
  
  // Auto-advance to step 2
  nextTick(() => {
    nextStep();
    
    // If click_element, auto-start selection mode
    if (type === 'click_element') {
      toggleSelectionMode();
    }
  });
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
  
  const element = event.target.closest('.loomsky-trigger-suggestion, .loomsky-already-triggered') || event.target;
  const selector = generateCSSSelector(element);
  
  // Check if element already has a trigger
  const existingTrigger = existingTriggers.value.find(trigger => 
    trigger && trigger.trigger_type === 'click_element' && trigger.selector === selector
  );
  
  selectedElement.value = {
    element: element,
    selector: selector,
    text: element.textContent?.trim(),
    tagName: element.tagName.toLowerCase(),
    hasExistingTrigger: !!existingTrigger,
    existingTrigger: existingTrigger
  };
  
  // Pre-fill event name if existing trigger
  if (existingTrigger) {
    eventName.value = existingTrigger.event_name;
  }
  
  console.log('[LOOMSKY TRIGGER]: Element selected:', {
    selector,
    hasExistingTrigger: !!existingTrigger,
    text: element.textContent?.trim().substring(0, 50) + '...'
  });
  
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
    console.log('Save trigger props:', { 
      websiteId: props.websiteId, 
      pixelId: props.pixelId, 
      token: props.token?.substring(0, 10) + '...' 
    });
    
    console.log('Form data:', {
      selectedTriggerType: selectedTriggerType.value,
      eventName: eventName.value,
      urlPattern: urlPattern.value,
      urlMatchType: urlMatchType.value,
      selectedElement: selectedElement.value
    });
    
    // TEMPORARY: Skip save if pixelId is null
    if (!props.pixelId) {
      alert('Error: pixelId is null. Please check backend token data.');
      return;
    }
    
    const triggerData = {
      event_name: eventName.value,
      trigger_type: selectedTriggerType.value,
      enabled: true,
      setupToken: props.token  // Send setup token for user identification
    };
    
    if (selectedTriggerType.value === 'url_match') {
      triggerData.url_pattern = urlPattern.value;
      triggerData.url_match_type = urlMatchType.value;
    } else if (selectedTriggerType.value === 'click_element') {
      triggerData.selector = selectedElement.value.selector;
      triggerData.element_text = selectedElement.value.text;
    }
    
    console.log('Final payload to send:', JSON.stringify(triggerData, null, 2));
    
    // Send trigger data to backend via SDK public endpoint (no auth required)
    const API_BASE_URL = 'http://localhost:3000/api/v1';
    const response = await fetch(`${API_BASE_URL}/sdk/websites/${props.websiteId}/pixels/${props.pixelId}/triggers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(triggerData)
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Success response:', result);
      
      // Update existing triggers
      if (result.success && result.data) {
        existingTriggers.value.push(result.data);
        
        // Update highlights
        highlightExistingTriggers();
        
        // Show success message
        successMessage.value = `Event trigger "${result.data.event_name}" created successfully!`;
        showSuccessMessage.value = true;
        
        // Reset to step 1 after showing success
        setTimeout(() => {
          resetToStep1();
          
          // Reload existing triggers to refresh the list
          loadExistingTriggers().then(() => {
            highlightExistingTriggers();
          });
        }, 700);
        
        // Success - notify parent window
        window.parent.postMessage({
          type: 'LOOMSKY_TRIGGER_SETUP_COMPLETE',
          data: result.data
        }, '*');
      }
      
    } else {
      const errorData = await response.text();
      console.error('API Error:', response.status, errorData);
      throw new Error(`Failed to save trigger: ${response.status}`);
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

// Initialize suggestions and highlights for Event Triggers (only buttons/interactive elements)
const findInteractiveElements = () => {
  const selectors = [
    'button:not([type="hidden"])', 
    'a[href]', 
    'input[type="submit"]', 
    'input[type="button"]',
    '[role="button"]', 
    '[onclick]', 
    '.btn', 
    '.button',
    '[data-cy*="button"]',
    '[data-cy*="btn"]',
    '[data-testid*="button"]',
    '[data-testid*="btn"]',
    '[class*="btn"]',
    '[class*="button"]',
    'form input[type="submit"]',
    'form button'
  ];
  
  try {
    // First, remove any existing mapping data suggestions from buttons to avoid conflict
    document.querySelectorAll('.loomsky-interactive-suggestion').forEach(el => {
      if (el.matches('button, a[href], input[type="submit"], input[type="button"], [role="button"], .btn, .button')) {
        el.classList.remove('loomsky-interactive-suggestion');
      }
    });
    
    document.querySelectorAll(selectors.join(', ')).forEach(el => {
      // Skip popup elements and already processed elements
      if (!el.closest('#loomsky-trigger-host') && 
          !el.classList.contains('loomsky-trigger-suggestion') &&
          !el.closest('#loomsky-mapper-host') &&
          !el.classList.contains('loomsky-interactive-suggestion') &&
          !el.classList.contains('loomsky-already-mapped')) {
        el.classList.add('loomsky-trigger-suggestion');
        suggestionElements.value.push(el);
      }
    });
    console.log(`[LOOMSKY TRIGGER]: Found ${suggestionElements.value.length} interactive elements`);
  } catch (error) {
    console.warn('Error finding interactive elements:', error);
  }
};

const highlightExistingTriggers = () => {
  // Clear existing highlights
  triggeredElements.value.forEach(el => {
    if (el) el.classList.remove('loomsky-already-triggered');
  });
  triggeredElements.value = [];
  
  // Highlight elements that already have triggers
  if (Array.isArray(existingTriggers.value)) {
    existingTriggers.value.forEach(trigger => {
      if (trigger && trigger.trigger_type === 'click_element' && trigger.selector) {
        try {
          document.querySelectorAll(trigger.selector).forEach(el => {
            el.classList.add('loomsky-already-triggered');
            triggeredElements.value.push(el);
          });
        } catch (error) {
          console.warn('Error highlighting existing trigger:', error);
        }
      }
    });
  }
  
  console.log(`[LOOMSKY TRIGGER]: Highlighted ${triggeredElements.value.length} existing triggers`);
};

// Initialize
onMounted(async () => {
  // Add suggestion styles
  suggestionStyleTag = document.createElement('style');
  suggestionStyleTag.id = 'loomsky-trigger-suggestion-styles';
  suggestionStyleTag.innerHTML = suggestionStyles;
  document.head.appendChild(suggestionStyleTag);
  
  // Load existing triggers
  await loadExistingTriggers();
  
  // Set initial position
  nextTick(() => {
    if (popupRef.value) {
      popupRef.value.style.transform = `translate(${popupPosition.value.x}px, ${popupPosition.value.y}px)`;
    }
    
    // Add interactive suggestions after a short delay
    setTimeout(() => {
      console.log('[LOOMSKY TRIGGER]: Adding suggestions and highlights...');
      findInteractiveElements();
      highlightExistingTriggers();
    }, 500); // Increased delay to ensure page is fully loaded
  });
});

const loadExistingTriggers = async () => {
  try {
    const API_BASE_URL = 'http://localhost:3000/api/v1';
    // Use SDK endpoint that doesn't require auth
    const response = await fetch(`${API_BASE_URL}/sdk/pixels/${props.pixelId}/triggers?enabled=all`);
    if (response.ok) {
      const data = await response.json();
      console.log('Loaded existing triggers from SDK:', data);
      
      // SDK endpoint returns { success: true, data: { url_triggers: [...], click_triggers: [...] } }
      if (data.success && data.data) {
        existingTriggers.value = [
          ...(data.data.url_triggers || []),
          ...(data.data.click_triggers || [])
        ];
      } else {
        existingTriggers.value = [];
      }
      
      console.log(`Processed existing triggers: ${existingTriggers.value.length} triggers found`);
    } else {
      console.warn('Failed to load triggers:', response.status);
      existingTriggers.value = [];
    }
  } catch (error) {
    console.warn('Error loading existing triggers:', error);
    existingTriggers.value = [];
  }
};

const addMessageHandler = async (event) => {
  const { type, data } = event.data;
  
  if (type === 'LOOMSKY_TRIGGER_SETUP_COMPLETE') {
    // Reload triggers and update highlights
    await loadExistingTriggers();
    highlightExistingTriggers();
    
    // Send success message to parent
    window.parent.postMessage({
      type: 'LOOMSKY_TRIGGER_SAVED',
      data: data
    }, '*');
  }
};

onUnmounted(() => {
  if (selectionMode.value) {
    stopElementSelection();
  }
  
  // Clean up styles and highlights
  if (suggestionStyleTag) {
    suggestionStyleTag.remove();
  }
  
  suggestionElements.value.forEach(el => {
    if (el) el.classList.remove('loomsky-trigger-suggestion');
  });
  
  triggeredElements.value.forEach(el => {
    if (el) el.classList.remove('loomsky-already-triggered');
  });
  
  window.removeEventListener('message', addMessageHandler);
});
</script>

<style scoped>
.loomsky-trigger-app {
  background: transparent !important;
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
  width: 450px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
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
  background: #0067b8;
  color: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: move;
  user-select: none;
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
  max-height: 600px;
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
  font-size: 14px;
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

.existing-trigger-warning {
  background: #fff3cd;
  border: 1px solid #ffecb5;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.existing-trigger-info {
  font-size: 12px;
  color: #856404;
  margin-top: 4px;
  font-family: monospace;
  background: #ffeaa7;
  padding: 2px 6px;
  border-radius: 3px;
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

/* Success Message */
.success-message {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 12px 16px;
  margin: 0 20px 16px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Existing Events Section */
.existing-events-section {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
}

.existing-events-header {
  margin-bottom: 12px;
}

.existing-events-title {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  margin: 0;
  display: flex;
  align-items: center;
}

.existing-events-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.existing-event-item {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;
}

.existing-event-item:hover {
  border-color: #adb5bd;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.existing-event-item.url-trigger {
  border-left: 4px solid #17a2b8;
}

.existing-event-item.click-trigger {
  border-left: 4px solid #6f42c1;
}

.event-icon {
  font-size: 16px;
  width: 24px;
  text-align: center;
}

.event-details {
  flex: 1;
  min-width: 0;
}

.event-name {
  font-weight: 600;
  color: #495057;
  font-size: 13px;
  margin-bottom: 2px;
}

.event-target {
  font-size: 11px;
  color: #6c757d;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-status {
  flex-shrink: 0;
}

.see-more-section {
  margin-top: 8px;
  text-align: center;
}

.see-more-btn {
  background: none;
  border: 1px solid #dee2e6;
  color: #6c757d;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
}

.see-more-btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
  color: #495057;
}

/* Element Highlight */
.element-highlight {
  border: 2px solid #1877f2;
  background: rgba(24, 119, 242, 0.1);
  border-radius: 4px;
}

.save-btn {
  background: #0067b8 !important;
  color: white !important;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  font-size: 14px;
}

.save-btn:hover,
.back-btn:hover,
.reselect-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.back-btn,
.reselect-btn {
  border: none;
  border-radius: 10px;
  border: 1px solid #818181;
  padding: 12px 24px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  font-size: 14px;
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