<template>
  <div class="triggers-list">
    <!-- Loading state -->
    <div v-if="loading" class="text-center py-4">
      <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
      <p class="mt-2 text--secondary">Loading triggers...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="!triggers || triggers.length === 0" class="empty-state text-center py-6">
      <v-icon size="48" color="grey-lighten-2" class="mb-3">mdi-cursor-default-click-outline</v-icon>
      <h4 class="text-h6 mb-2">No Event Triggers</h4>
      <p class="text--secondary mb-4">This pixel doesn't have any event triggers yet.</p>
      <v-btn
        color="primary"
        variant="outlined"
        @click="$emit('add-trigger')"
      >
        <v-icon start>mdi-plus</v-icon>
        Add First Trigger
      </v-btn>
    </div>

    <!-- Triggers table -->
    <div v-else class="triggers-table">
      <v-table density="compact">
        <thead>
          <tr>
            <th>Event</th>
            <th>Trigger Type</th>
            <th>Configuration</th>
            <th>Status</th>
            <th>Stats</th>
            <th width="120">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="trigger in triggers"
            :key="trigger.id"
            :class="{ 'trigger-disabled': !trigger.enabled }"
          >
            <!-- Event Name -->
            <td>
              <div class="d-flex align-center">
                <v-chip
                  size="small"
                  :color="getEventColor(trigger.event_name)"
                  variant="tonal"
                  class="mr-2"
                >
                  {{ trigger.event_name }}
                </v-chip>
                <v-icon
                  v-if="isFacebookEvent(trigger.event_name)"
                  size="16"
                  color="primary"
                  class="ml-1"
                  title="Facebook compatible event"
                >
                  mdi-facebook
                </v-icon>
              </div>
            </td>

            <!-- Trigger Type -->
            <td>
              <div class="d-flex align-center">
                <v-icon
                  :icon="getTriggerTypeIcon(trigger.trigger_type)"
                  size="16"
                  :color="getTriggerTypeColor(trigger.trigger_type)"
                  class="mr-2"
                ></v-icon>
                <span class="text-caption">
                  {{ getTriggerTypeLabel(trigger.trigger_type) }}
                </span>
              </div>
            </td>

            <!-- Configuration -->
            <td class="trigger-config">
              <div v-if="trigger.trigger_type === 'url_match'">
                <div class="config-label">URL Pattern:</div>
                <code class="config-value">{{ trigger.url_pattern }}</code>
                <div class="config-meta">
                  <v-chip size="x-small" variant="outlined">
                    {{ trigger.url_match_type }}
                  </v-chip>
                </div>
              </div>
              <div v-else-if="trigger.trigger_type === 'click_element'">
                <div class="config-label">CSS Selector:</div>
                <code class="config-value">{{ trigger.selector }}</code>
                <div v-if="trigger.element_text" class="config-meta">
                  Text: "{{ trigger.element_text }}"
                </div>
              </div>
            </td>

            <!-- Status -->
            <td>
              <v-switch
                v-model="trigger.enabled"
                @change="toggleTrigger(trigger)"
                color="success"
                density="compact"
                hide-details
                :loading="trigger.updating"
              ></v-switch>
              <div class="text-caption text--secondary">
                {{ trigger.enabled ? 'Active' : 'Disabled' }}
              </div>
            </td>

            <!-- Stats -->
            <td>
              <div class="trigger-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ trigger.fire_count }}</span>
                  <span class="stat-label">fires</span>
                </div>
                <div v-if="trigger.last_fired" class="stat-item">
                  <span class="stat-value">{{ formatLastFired(trigger.last_fired) }}</span>
                  <span class="stat-label">last fired</span>
                </div>
              </div>
            </td>

            <!-- Actions -->
            <td>
              <div class="d-flex align-center gap-1">
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-pencil"
                  @click="editTrigger(trigger)"
                  title="Edit trigger"
                ></v-btn>
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-delete"
                  color="error"
                  @click="deleteTrigger(trigger)"
                  title="Delete trigger"
                ></v-btn>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Event Trigger</v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete this event trigger?</p>
          <v-alert type="warning" variant="tonal" class="mt-3">
            <strong>{{ triggerToDelete?.event_name }}</strong> - 
            {{ getTriggerTypeLabel(triggerToDelete?.trigger_type) }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn 
            color="error"
            @click="confirmDelete"
            :loading="deleting"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useWebsiteStore } from '@/stores/websiteStore';
import { STANDARD_EVENTS, isFacebookCompatible } from '@/constants/eventStandards';

const props = defineProps({
  websiteId: { type: String, required: true },
  pixelId: { type: String, required: true }
});

const emit = defineEmits(['refresh', 'add-trigger']);

const websiteStore = useWebsiteStore();

// Reactive data
const loading = ref(false);
const deleting = ref(false);
const showDeleteDialog = ref(false);
const triggerToDelete = ref(null);
const triggers = ref([]);

// Methods
const loadTriggers = async () => {
  try {
    loading.value = true;
    const response = await websiteStore.fetchEventTriggers(props.websiteId, props.pixelId);
    triggers.value = response || [];
  } catch (error) {
    console.error('Error loading triggers:', error);
    triggers.value = [];
  } finally {
    loading.value = false;
  }
};

const toggleTrigger = async (trigger) => {
  const originalState = trigger.enabled;
  trigger.updating = true;

  try {
    await websiteStore.updateEventTrigger(
      props.websiteId,
      props.pixelId,
      trigger.id,
      { enabled: trigger.enabled }
    );
    emit('refresh');
  } catch (error) {
    console.error('Error toggling trigger:', error);
    // Revert state on error
    trigger.enabled = originalState;
  } finally {
    trigger.updating = false;
  }
};

const editTrigger = (trigger) => {
  // TODO: Implement edit functionality
  // Could open a dialog or navigate to edit page
  console.log('Edit trigger:', trigger);
};

const deleteTrigger = (trigger) => {
  triggerToDelete.value = trigger;
  showDeleteDialog.value = true;
};

const confirmDelete = async () => {
  if (!triggerToDelete.value) return;

  try {
    deleting.value = true;
    await websiteStore.deleteEventTrigger(
      props.websiteId,
      props.pixelId,
      triggerToDelete.value.id
    );
    showDeleteDialog.value = false;
    triggerToDelete.value = null;
    emit('refresh');
    await loadTriggers(); // Refresh local data
  } catch (error) {
    console.error('Error deleting trigger:', error);
  } finally {
    deleting.value = false;
  }
};

// Helper methods
const getEventColor = (eventName) => {
  const event = Object.values(STANDARD_EVENTS).find(e => e.name === eventName);
  if (!event) return 'grey';
  
  const colorMap = {
    'navigation': 'blue',
    'ecommerce': 'green',
    'conversion': 'orange',
    'engagement': 'purple',
    'interaction': 'red'
  };
  
  return colorMap[event.category.key] || 'grey';
};

const isFacebookEvent = (eventName) => {
  return isFacebookCompatible(eventName);
};

const getTriggerTypeIcon = (type) => {
  return type === 'url_match' ? 'mdi-link' : 'mdi-cursor-default-click';
};

const getTriggerTypeColor = (type) => {
  return type === 'url_match' ? 'blue' : 'green';
};

const getTriggerTypeLabel = (type) => {
  return type === 'url_match' ? 'URL Match' : 'Click Element';
};

const formatLastFired = (timestamp) => {
  if (!timestamp) return 'Never';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  
  if (diffMs < 60000) return 'Just now';
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
  return `${Math.floor(diffMs / 86400000)}d ago`;
};

// Lifecycle
onMounted(() => {
  loadTriggers();
});

// Expose refresh method to parent
defineExpose({
  refresh: loadTriggers
});
</script>

<style scoped>
.triggers-list {
  min-height: 200px;
}

.trigger-disabled {
  opacity: 0.6;
}

.trigger-config {
  max-width: 300px;
}

.config-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #666;
  margin-bottom: 2px;
}

.config-value {
  font-size: 0.8rem;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  word-break: break-all;
  display: block;
  margin-bottom: 4px;
}

.config-meta {
  font-size: 0.7rem;
  color: #888;
}

.trigger-stats {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-weight: 600;
  font-size: 0.8rem;
}

.stat-label {
  font-size: 0.7rem;
  color: #666;
}

.empty-state {
  background: #f9f9f9;
  border-radius: 8px;
  border: 2px dashed #ddd;
}

.triggers-table :deep(.v-table) {
  border-radius: 8px;
  overflow: hidden;
}

.triggers-table :deep(.v-table__wrapper) {
  border-radius: 8px;
}

.triggers-table :deep(th) {
  background-color: #f5f5f5;
  font-weight: 600;
  font-size: 0.85rem;
}

.triggers-table :deep(td) {
  vertical-align: top;
  padding-top: 12px;
  padding-bottom: 12px;
}
</style>