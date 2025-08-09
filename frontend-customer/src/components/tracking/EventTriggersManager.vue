<template>
  <div class="event-triggers-container">
    <v-card class="header-section mb-6" rounded="lg" elevation="0">
      <!-- Header Section -->
      <div class="header">
        <div class="header-content">
          <div class="header-left">
            <h1 class="text-h5">Event Triggers</h1>
            <p class="text-body-1 text--secondary">Set up click and URL-based triggers to automatically fire Facebook events on your website. Create triggers for specific elements or pages.</p>
          </div>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="header-right">
        <button 
          class="add-btn" 
          @click="showPixelSelector = true"
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
            <path d="M9,4A4,4 0 0,0 5,8A4,4 0 0,0 9,12A4,4 0 0,0 13,8A4,4 0 0,0 9,4M15,12V10H23V12H15M15,16V14H23V16H15M15,20V18H23V20H15M2,20V18H13V20H2M2,16V14H13V16H2M2,12V10H13V12H2Z"/>
          </svg>
          Event Setup
        </button>

        <div class="stats-grid">
          <v-card rounded="lg" class="total" variant="tonal" style="min-width: 70px; max-width: 140px; ">
            <v-card-text class="pa-5 text-center">
              <div class="text-h4 stat-number">{{ totalTriggers }}</div>
              <div class="text-caption">Total Triggers</div>
            </v-card-text>
          </v-card>
          <v-card rounded="lg" class="active" variant="tonal" style="min-width: 70px; max-width: 140px; ">
            <v-card-text class="pa-5 text-center">
              <div class="text-h4 stat-number">{{ activeTriggers }}</div>
              <div class="text-caption">Active Triggers</div>
            </v-card-text>
          </v-card>
        </div>
      </div>
    </v-card>

    <!-- Triggers List Section -->
    <v-card rounded="lg" elevation="0" class="triggers-list-section">
      <v-card-title class="pb-4">
        <div class="d-flex align-center justify-space-between w-100">
          <div>
            <h2 class="text-h6">Event Triggers by Pixel</h2>
            <p class="text-caption text--secondary mb-0">Manage triggers grouped by pixel</p>
          </div>
        </div>
      </v-card-title>

      <v-card-text class="pt-0">
        <!-- Loading state -->
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          <p class="mt-4 text--secondary">Loading triggers...</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="!pixels || pixels.length === 0" class="text-center py-8">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-cursor-default-click-outline</v-icon>
          <h3 class="text-h6 mb-2">No Event Triggers Yet</h3>
          <p class="text--secondary mb-4">Start by adding pixels to your website, then set up event triggers.</p>
        </div>

        <!-- Triggers grouped by pixel -->
        <div v-else>
          <v-expansion-panels v-model="expandedPanels" multiple>
            <v-expansion-panel
              v-for="pixel in pixels"
              :key="pixel.id"
              :value="pixel.id"
            >
              <v-expansion-panel-title>
                <div class="d-flex align-center justify-space-between w-100">
                  <div class="d-flex align-center">
                    <v-chip
                      size="small"
                      color="primary"
                      variant="tonal"
                      class="mr-3"
                    >
                      {{ pixel.pixel_id }}
                    </v-chip>
                    <div>
                      <div class="font-weight-medium">Pixel ID: {{ pixel.pixel_id }}</div>
                      <div class="text-caption text--secondary">{{ getPixelTriggerCount(pixel.id) }} triggers</div>
                    </div>
                  </div>
                  <div class="d-flex align-center">
                    <v-btn
                      size="small"
                      color="primary"
                      variant="outlined"
                      @click.stop="openTriggerSetup(pixel.id)"
                    >
                      <v-icon start>mdi-plus</v-icon>
                      Add Trigger
                    </v-btn>
                  </div>
                </div>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <TriggersList
                  :website-id="websiteId"
                  :pixel-id="pixel.id"
                  @refresh="loadTriggers"
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </v-card-text>
    </v-card>

    <!-- Pixel Selector Dialog -->
    <v-dialog v-model="showPixelSelector" max-width="500">
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-cursor-default-click-outline</v-icon>
          Choose Pixel for Event Setup
        </v-card-title>

        <v-card-text class="pt-2">
          <p class="text--secondary mb-4">Select which pixel you want to set up event triggers for:</p>
          
          <div v-if="!pixels || pixels.length === 0" class="text-center py-4">
            <v-icon size="48" color="grey-lighten-2" class="mb-2">mdi-magnify</v-icon>
            <p class="text--secondary">No pixels found for this website.</p>
            <p class="text-caption">Add a pixel first to create event triggers.</p>
          </div>

          <v-list v-else>
            <v-list-item
              v-for="pixel in pixels"
              :key="pixel.id"
              @click="openTriggerSetup(pixel.id)"
              class="pixel-item"
              rounded="lg"
            >
              <template v-slot:prepend>
                <v-chip
                  size="small"
                  color="primary"
                  variant="tonal"
                >
                  {{ pixel.pixel_id }}
                </v-chip>
              </template>

              <v-list-item-title>Pixel ID: {{ pixel.pixel_id }}</v-list-item-title>
              <v-list-item-subtitle>{{ getPixelTriggerCount(pixel.id) }} existing triggers</v-list-item-subtitle>

              <template v-slot:append>
                <v-icon color="primary">mdi-chevron-right</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showPixelSelector = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useWebsiteStore } from '@/stores/websiteStore';
import TriggersList from '@/components/tracking/TriggersList.vue';

const props = defineProps({
  websiteId: { type: String, required: true }
});

const websiteStore = useWebsiteStore();

// Reactive data
const loading = ref(false);
const showPixelSelector = ref(false);
const expandedPanels = ref([]);
const pixels = ref([]);
const triggersByPixel = ref({});

// Computed properties
const totalTriggers = computed(() => {
  return Object.values(triggersByPixel.value)
    .flat()
    .length;
});

const activeTriggers = computed(() => {
  return Object.values(triggersByPixel.value)
    .flat()
    .filter(trigger => trigger.enabled)
    .length;
});

// Methods
const getPixelTriggerCount = (pixelId) => {
  return triggersByPixel.value[pixelId]?.length || 0;
};

const loadPixels = async () => {
  try {
    loading.value = true;
    await websiteStore.fetchPixels(props.websiteId);
    pixels.value = websiteStore.pixels || [];
  } catch (error) {
    console.error('Error loading pixels:', error);
  } finally {
    loading.value = false;
  }
};

const loadTriggers = async () => {
  if (!pixels.value.length) return;

  try {
    // Load triggers for each pixel
    const triggerPromises = pixels.value.map(async (pixel) => {
      const triggers = await websiteStore.fetchEventTriggers(props.websiteId, pixel.id);
      return { pixelId: pixel.id, triggers };
    });

    const results = await Promise.all(triggerPromises);
    
    // Group triggers by pixel
    triggersByPixel.value = {};
    results.forEach(({ pixelId, triggers }) => {
      triggersByPixel.value[pixelId] = triggers || [];
    });
  } catch (error) {
    console.error('Error loading triggers:', error);
  }
};

const openTriggerSetup = async (pixelId) => {
  showPixelSelector.value = false;
  
  try {
    console.log('Opening trigger setup for pixelId:', pixelId);
    console.log('Available pixels:', pixels.value.map(p => ({ id: p.id, pixel_id: p.pixel_id })));
    
    // Get pixel info
    const pixel = pixels.value.find(p => p.id === pixelId);
    if (!pixel) {
      throw new Error('Pixel not found');
    }
    
    console.log('Found pixel:', pixel);

    // Get website info
    const website = websiteStore.currentWebsite;
    if (!website) {
      throw new Error('Website not found');
    }

    // Start trigger setup session (similar to data mapping flow)
    websiteStore.actionLoading = true;
    
    const response = await websiteStore.initTriggerSetupSession(props.websiteId, pixelId);
    const setupToken = response.setup_token;

    // Open website in new tab with trigger setup tool
    let websiteUrl = website.domain;
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = 'https://' + websiteUrl;
    }
    
    const triggerUrl = new URL(websiteUrl);
    triggerUrl.searchParams.set('ls_trigger_setup_mode', 'true');
    triggerUrl.searchParams.set('ls_token', setupToken);

    const triggerWindow = window.open(triggerUrl.href, '_blank');
    
    if (!triggerWindow) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }

    // Listen for trigger setup completion
    window.addEventListener('message', handleTriggerSetupMessage);
    
  } catch (error) {
    console.error('Error opening trigger setup:', error);
    // Handle error (show snackbar, etc.)
  } finally {
    websiteStore.actionLoading = false;
  }
};

const handleTriggerSetupMessage = (event) => {
  if (event.data?.type === 'LOOMSKY_TRIGGER_SETUP_COMPLETE') {
    // Refresh triggers list
    loadTriggers();
    
    // Clean up event listener
    window.removeEventListener('message', handleTriggerSetupMessage);
  }
};

// Lifecycle
onMounted(async () => {
  await loadPixels();
  if (pixels.value.length > 0) {
    await loadTriggers();
    // Expand first panel by default
    expandedPanels.value = [pixels.value[0]?.id];
  }
});
</script>

<style scoped>
.event-triggers-container {
  max-width: 100%;
}

.header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.header-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
  pointer-events: none;
}

.header {
  position: relative;
  z-index: 1;
  padding: 24px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
}

.header-left h1 {
  margin-bottom: 8px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 0 24px 24px;
  position: relative;
  z-index: 1;
}

.add-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.add-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stats-grid {
  display: flex;
  gap: 16px;
}

.stat-number {
  font-weight: 700;
  color: #5d4e75;
}

.triggers-list-section {
  border: 1px solid #e0e0e0;
}

.pixel-item {
  border: 1px solid #e0e0e0;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.pixel-item:hover {
  background-color: #f5f5f5;
  border-color: #667eea;
}

.pixel-item:last-child {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
  
  .stats-grid {
    flex: 1;
    justify-content: flex-end;
  }
}
</style>