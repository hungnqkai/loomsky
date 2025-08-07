<!-- 
File: src/components/tracking/PixelManager.vue (REDESIGNED with Sidebar)
- Replaced popup dialog with sidebar navigation drawer
- Added guided and advanced setup modes
- Integrated Events & Conversions configuration
- Predefined custom events and enhanced activation rules
-->
<template>
    <v-card flat>
        <v-card-title class="d-flex justify-space-between align-center">
            <span>Facebook Pixels & Event Configuration</span>
            <v-btn color="primary" @click="openSidebar()">
                <v-icon left>mdi-plus</v-icon>
                Add New Pixel
            </v-btn>
        </v-card-title>
        <v-card-text>
            <v-alert v-if="websiteStore.error" type="error" class="mb-4" closable @click:close="websiteStore.clearMessages()">{{ websiteStore.error }}</v-alert>
            <v-alert v-if="websiteStore.successMessage" type="success" class="mb-4" closable @click:close="websiteStore.clearMessages()">{{ websiteStore.successMessage }}</v-alert>
            <v-data-table
                :headers="headers"
                :items="websiteStore.pixels"
                :loading="websiteStore.actionLoading"
                item-value="id"
                no-data-text="No pixels configured yet."
            >
                <template v-slot:item.actions="{ item }">
                    <v-icon small class="mr-2" @click="openSidebar(item)">mdi-pencil</v-icon>
                    <v-icon small color="error" @click="openDeleteDialog(item)">mdi-delete</v-icon>
                </template>
            </v-data-table>
        </v-card-text>

        <!-- Delete Dialog -->
        <v-dialog v-model="deleteDialog" max-width="500px">
            <v-card>
                <v-card-title class="text-h5">Confirm Delete</v-card-title>
                <v-card-text>Are you sure you want to delete Pixel <strong>{{ itemToDelete?.pixel_id }}</strong>?</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="closeDeleteDialog">Cancel</v-btn>
                    <v-btn color="error" @click="confirmDelete" :loading="websiteStore.actionLoading">Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>

    <!-- Sidebar for Add/Edit Pixel (Full viewport height) -->
    <v-navigation-drawer
        v-model="sidebar"
        location="right"
        width="700"
        temporary
        fixed
        app
        class="pixel-sidebar"
    >
            <!-- Sidebar Header -->
            <div class="sidebar-header">
                <div class="d-flex justify-space-between align-center">
                    <div>
                        <h2 class="text-h5 font-weight-bold">{{ isEditMode ? 'Edit Pixel' : 'Add New Pixel' }}</h2>
                        <p class="text-body-2 text-medium-emphasis mt-1">
                            {{ isEditMode ? 'Update pixel configuration and tracking settings' : 'Configure Facebook Pixel with tracking events' }}
                        </p>
                    </div>
                    <v-btn icon="mdi-close" variant="text" @click="closeSidebar"></v-btn>
                </div>
                
                <!-- Setup Mode Toggle -->
                <div class="setup-mode-toggle mt-4">
                    <v-btn-toggle v-model="setupMode" mandatory variant="outlined" divided>
                        <v-btn value="guided" prepend-icon="mdi-wizard-hat">
                            Guided Setup
                        </v-btn>
                        <v-btn value="advanced" prepend-icon="mdi-cog">
                            Advanced Setup
                        </v-btn>
                    </v-btn-toggle>
                </div>
            </div>

            <v-divider></v-divider>

            <!-- Sidebar Content -->
            <div class="sidebar-content">
                <!-- Guided Setup (Step-by-step wizard) -->
                <div v-if="setupMode === 'guided'" class="guided-setup">
                    <!-- Step Navigation -->
                    <div class="step-navigation">
                        <v-stepper v-model="currentStep" flat>
                            <v-stepper-header>
                                <v-stepper-item 
                                    v-for="step in guidedSteps" 
                                    :key="step.step"
                                    :value="step.step"
                                    :title="step.title"
                                    :subtitle="step.subtitle"
                                ></v-stepper-item>
                            </v-stepper-header>
                        </v-stepper>
                    </div>

                    <v-form ref="form" class="step-content">
                        <!-- Step 1: Basic Information -->
                        <div v-if="currentStep === 1" class="step-section">
                            <h3 class="text-h6 mb-3">Basic Pixel Information</h3>
                            <p class="text-body-2 text-medium-emphasis mb-4">
                                Enter your Facebook Pixel ID and Conversion API access token to get started.
                            </p>
                            
                            <v-text-field
                                v-model="editedItem.pixel_id"
                                label="Facebook Pixel ID"
                                :rules="[rules.required, rules.numeric]"
                                variant="outlined"
                                hint="Find this in your Facebook Events Manager"
                                persistent-hint
                                class="mb-4"
                            ></v-text-field>
                            
                            <v-text-field
                                v-model="editedItem.access_token"
                                label="Conversion API Access Token"
                                :rules="[rules.required]"
                                variant="outlined"
                                hint="Required for server-side event tracking"
                                persistent-hint
                            ></v-text-field>
                        </div>

                        <!-- Step 2: Standard Events -->
                        <div v-if="currentStep === 2" class="step-section">
                            <h3 class="text-h6 mb-3">Standard Events</h3>
                            <p class="text-body-2 text-medium-emphasis mb-4">
                                Select which Facebook standard events you want to track automatically.
                            </p>
                            <v-row>
                                <v-col v-for="event in standardEvents" :key="event.value" cols="12" md="6">
                                    <v-checkbox 
                                        v-model="editedItem.tracking_config.standard_events"
                                        :value="event.value"
                                        :label="event.title"
                                        hide-details
                                    ></v-checkbox>
                                </v-col>
                            </v-row>
                        </div>

                        <!-- Step 3: Custom Events -->
                        <div v-if="currentStep === 3" class="step-section">
                            <h3 class="text-h6 mb-3">Custom Events</h3>
                            <p class="text-body-2 text-medium-emphasis mb-4">
                                Choose custom events to track user engagement and behavior.
                            </p>
                            
                            <!-- Scroll Depth Events -->
                            <div class="mb-4">
                                <h4 class="text-subtitle-1 mb-2">Scroll Depth Tracking</h4>
                                <v-row>
                                    <v-col v-for="scrollEvent in scrollDepthEvents" :key="scrollEvent.value" cols="12" md="6">
                                        <v-checkbox 
                                            v-model="editedItem.tracking_config.custom_events"
                                            :value="scrollEvent.value"
                                            :label="scrollEvent.title"
                                            hide-details
                                        ></v-checkbox>
                                    </v-col>
                                </v-row>
                            </div>

                            <!-- Time Engagement Events -->
                            <div>
                                <h4 class="text-subtitle-1 mb-2">Time Engagement Tracking</h4>
                                <v-row>
                                    <v-col v-for="timeEvent in timeEngagementEvents" :key="timeEvent.value" cols="12" md="6">
                                        <v-checkbox 
                                            v-model="editedItem.tracking_config.custom_events"
                                            :value="timeEvent.value"
                                            :label="timeEvent.title"
                                            hide-details
                                        ></v-checkbox>
                                    </v-col>
                                </v-row>
                            </div>
                        </div>

                        <!-- Step 4: Conversion Events & Settings -->
                        <div v-if="currentStep === 4" class="step-section">
                            <h3 class="text-h6 mb-3">Conversion Events & Settings</h3>
                            <p class="text-body-2 text-medium-emphasis mb-4">
                                Configure conversion tracking and delivery settings.
                            </p>
                            
                            <!-- Conversion Events -->
                            <div class="mb-4">
                                <h4 class="text-subtitle-1 mb-2">Conversion Events</h4>
                                <v-row>
                                    <v-col v-for="event in availableConversionEvents" :key="event.value" cols="12" md="6">
                                        <v-checkbox 
                                            v-model="editedItem.tracking_config.conversion_events"
                                            :value="event.value"
                                            :label="event.title"
                                            hide-details
                                        ></v-checkbox>
                                    </v-col>
                                </v-row>
                            </div>

                            <!-- Tracking Settings -->
                            <div>
                                <h4 class="text-subtitle-1 mb-2">Tracking Settings</h4>
                                <v-row>
                                    <v-col cols="12" md="6">
                                        <v-checkbox 
                                            v-model="editedItem.tracking_config.send_page_view"
                                            label="Automatic PageView tracking"
                                            hide-details
                                        ></v-checkbox>
                                    </v-col>
                                    <v-col cols="12" md="6">
                                        <v-checkbox 
                                            v-model="editedItem.tracking_config.send_to_conversion_api"
                                            label="Send events to Conversion API"
                                            hide-details
                                        ></v-checkbox>
                                    </v-col>
                                    <v-col cols="12" md="6">
                                        <v-checkbox 
                                            v-model="editedItem.tracking_config.send_to_pixel"
                                            label="Send events to Facebook Pixel"
                                            hide-details
                                        ></v-checkbox>
                                    </v-col>
                                    <v-col cols="12" md="6">
                                        <v-checkbox 
                                            v-model="editedItem.tracking_config.enable_advanced_matching"
                                            label="Enable Advanced Matching"
                                            hide-details
                                        ></v-checkbox>
                                    </v-col>
                                </v-row>
                            </div>
                        </div>

                        <!-- Step 5: Activation Rules -->
                        <div v-if="currentStep === 5" class="step-section">
                            <h3 class="text-h6 mb-3">Activation Rules</h3>
                            <p class="text-body-2 text-medium-emphasis mb-4">
                                Define when this pixel should be active. Leave empty to activate on all pages.
                            </p>
                            
                            <div v-for="(rule, index) in editedItem.activation_rules" :key="index" class="d-flex align-center mb-3">
                                <v-select 
                                    v-model="rule.type" 
                                    :items="enhancedRuleTypes" 
                                    label="Rule Type" 
                                    density="compact" 
                                    hide-details 
                                    class="mr-2"
                                    style="flex: 0 0 200px;"
                                ></v-select>
                                <v-text-field 
                                    v-model="rule.value" 
                                    label="Value" 
                                    density="compact" 
                                    hide-details 
                                    class="mr-2"
                                ></v-text-field>
                                <v-btn 
                                    icon="mdi-delete" 
                                    size="small" 
                                    variant="text" 
                                    color="error" 
                                    @click="removeRule(index)"
                                ></v-btn>
                            </div>
                            
                            <v-btn variant="text" @click="addRule" class="mt-2">
                                <v-icon left>mdi-plus</v-icon>
                                Add Rule
                            </v-btn>
                        </div>

                        <!-- Step Navigation Buttons -->
                        <div class="step-navigation-buttons mt-6">
                            <v-row>
                                <v-col cols="6">
                                    <v-btn 
                                        v-if="currentStep > 1"
                                        variant="outlined" 
                                        @click="currentStep--"
                                        block
                                    >
                                        Previous
                                    </v-btn>
                                </v-col>
                                <v-col cols="6">
                                    <v-btn 
                                        v-if="currentStep < 5"
                                        color="primary" 
                                        @click="currentStep++"
                                        block
                                    >
                                        Next
                                    </v-btn>
                                    <v-btn 
                                        v-else
                                        color="success"
                                        @click="savePixel"
                                        :loading="websiteStore.actionLoading"
                                        block
                                    >
                                        Save Pixel
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </div>
                    </v-form>
                </div>

                <!-- Advanced Setup (All fields visible) -->
                <div v-else-if="setupMode === 'advanced'" class="advanced-setup">
                    <v-form ref="form">
                        <!-- Basic Information -->
                        <div class="mb-6">
                            <h3 class="text-h6 mb-3">Basic Information</h3>
                            <v-text-field
                                v-model="editedItem.pixel_id"
                                label="Facebook Pixel ID"
                                :rules="[rules.required, rules.numeric]"
                                variant="outlined"
                                hint="Find this in your Facebook Events Manager"
                                persistent-hint
                                class="mb-4"
                            ></v-text-field>
                            
                            <v-text-field
                                v-model="editedItem.access_token"
                                label="Conversion API Access Token"
                                :rules="[rules.required]"
                                variant="outlined"
                                hint="Required for server-side event tracking"
                                persistent-hint
                            ></v-text-field>
                        </div>

                        <v-divider class="my-6"></v-divider>

                        <!-- Standard Events -->
                        <div class="mb-6">
                            <h3 class="text-h6 mb-3">Standard Events</h3>
                            <v-row>
                                <v-col v-for="event in standardEvents" :key="event.value" cols="12" md="6">
                                    <v-checkbox 
                                        v-model="editedItem.tracking_config.standard_events"
                                        :value="event.value"
                                        :label="event.title"
                                        hide-details
                                    ></v-checkbox>
                                </v-col>
                            </v-row>
                        </div>

                        <v-divider class="my-6"></v-divider>

                        <!-- Custom Events -->
                        <div class="mb-6">
                            <h3 class="text-h6 mb-3">Custom Events</h3>
                            
                            <!-- Scroll Depth Events -->
                            <div class="mb-4">
                                <h4 class="text-subtitle-1 mb-2">Scroll Depth Tracking</h4>
                                <v-row>
                                    <v-col v-for="scrollEvent in scrollDepthEvents" :key="scrollEvent.value" cols="12" md="6">
                                        <v-checkbox 
                                            v-model="editedItem.tracking_config.custom_events"
                                            :value="scrollEvent.value"
                                            :label="scrollEvent.title"
                                            hide-details
                                        ></v-checkbox>
                                    </v-col>
                                </v-row>
                            </div>

                            <!-- Time Engagement Events -->
                            <div>
                                <h4 class="text-subtitle-1 mb-2">Time Engagement Tracking</h4>
                                <v-row>
                                    <v-col v-for="timeEvent in timeEngagementEvents" :key="timeEvent.value" cols="12" md="6">
                                        <v-checkbox 
                                            v-model="editedItem.tracking_config.custom_events"
                                            :value="timeEvent.value"
                                            :label="timeEvent.title"
                                            hide-details
                                        ></v-checkbox>
                                    </v-col>
                                </v-row>
                            </div>
                        </div>

                        <v-divider class="my-6"></v-divider>

                        <!-- Conversion Events -->
                        <div class="mb-6">
                            <h3 class="text-h6 mb-3">Conversion Events</h3>
                            <v-row>
                                <v-col v-for="event in availableConversionEvents" :key="event.value" cols="12" md="6">
                                    <v-checkbox 
                                        v-model="editedItem.tracking_config.conversion_events"
                                        :value="event.value"
                                        :label="event.title"
                                        hide-details
                                    ></v-checkbox>
                                </v-col>
                            </v-row>
                        </div>

                        <v-divider class="my-6"></v-divider>

                        <!-- Tracking Settings -->
                        <div class="mb-6">
                            <h3 class="text-h6 mb-3">Tracking Settings</h3>
                            <v-row>
                                <v-col cols="12" md="6">
                                    <v-checkbox 
                                        v-model="editedItem.tracking_config.send_page_view"
                                        label="Automatic PageView tracking"
                                        hide-details
                                    ></v-checkbox>
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-checkbox 
                                        v-model="editedItem.tracking_config.send_to_conversion_api"
                                        label="Send events to Conversion API"
                                        hide-details
                                    ></v-checkbox>
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-checkbox 
                                        v-model="editedItem.tracking_config.send_to_pixel"
                                        label="Send events to Facebook Pixel"
                                        hide-details
                                    ></v-checkbox>
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-checkbox 
                                        v-model="editedItem.tracking_config.enable_advanced_matching"
                                        label="Enable Advanced Matching"
                                        hide-details
                                    ></v-checkbox>
                                </v-col>
                            </v-row>
                        </div>

                        <v-divider class="my-6"></v-divider>

                        <!-- Activation Rules -->
                        <div class="mb-6">
                            <h3 class="text-h6 mb-3">Activation Rules</h3>
                            <p class="text-body-2 text-medium-emphasis mb-4">
                                Define when this pixel should be active. Leave empty to activate on all pages.
                            </p>
                            
                            <div v-for="(rule, index) in editedItem.activation_rules" :key="index" class="d-flex align-center mb-3">
                                <v-select 
                                    v-model="rule.type" 
                                    :items="enhancedRuleTypes" 
                                    label="Rule Type" 
                                    density="compact" 
                                    hide-details 
                                    class="mr-2"
                                    style="flex: 0 0 200px;"
                                ></v-select>
                                <v-text-field 
                                    v-model="rule.value" 
                                    label="Value" 
                                    density="compact" 
                                    hide-details 
                                    class="mr-2"
                                ></v-text-field>
                                <v-btn 
                                    icon="mdi-delete" 
                                    size="small" 
                                    variant="text" 
                                    color="error" 
                                    @click="removeRule(index)"
                                ></v-btn>
                            </div>
                            
                            <v-btn variant="text" @click="addRule" class="mt-2">
                                <v-icon left>mdi-plus</v-icon>
                                Add Rule
                            </v-btn>
                        </div>

                        <!-- Save Button -->
                        <div class="text-center">
                            <v-btn 
                                color="primary" 
                                size="large"
                                @click="savePixel"
                                :loading="websiteStore.actionLoading"
                            >
                                Save Pixel Configuration
                            </v-btn>
                        </div>
                    </v-form>
                </div>
            </div>
        </v-navigation-drawer>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useWebsiteStore } from '@/stores/websiteStore';
import _ from 'lodash';

const props = defineProps({
  websiteId: { type: String, required: true },
  platformType: { type: String, default: 'html' }
});
const websiteStore = useWebsiteStore();

// UI State
const sidebar = ref(false);
const deleteDialog = ref(false);
const form = ref(null);
const setupMode = ref('guided');
const currentStep = ref(1);

// Headers for data table
const headers = [
    { title: 'Pixel ID', value: 'pixel_id' },
    { title: 'Events Configured', value: 'events_count', sortable: false },
    { title: 'Actions', value: 'actions', sortable: false, align: 'end' }
];

// Guided Setup Steps
const guidedSteps = [
    { step: 1, title: 'Basic Info', subtitle: 'Pixel ID & Token' },
    { step: 2, title: 'Standard Events', subtitle: 'Facebook Events' },
    { step: 3, title: 'Custom Events', subtitle: 'Engagement Tracking' },
    { step: 4, title: 'Conversions', subtitle: 'Goals & Settings' },
    { step: 5, title: 'Activation Rules', subtitle: 'When to Fire' }
];

// Default tracking configuration
const defaultTrackingConfig = {
  standard_events: ['PageView'],
  custom_events: [],
  conversion_events: [],
  send_page_view: true,
  send_to_conversion_api: true,
  send_to_pixel: true,
  enable_advanced_matching: false
};

const defaultItem = { 
  id: null, 
  pixel_id: '', 
  access_token: '', 
  activation_rules: [],
  tracking_config: _.cloneDeep(defaultTrackingConfig)
};
const editedItem = reactive(_.cloneDeep(defaultItem));
const itemToDelete = ref(null);
const isEditMode = computed(() => !!editedItem.id);
const rules = { 
    required: v => !!v || 'This field is required.', 
    numeric: v => /^\d+$/.test(v) || 'Pixel ID should contain only numbers.' 
};

// Facebook Standard Events
const standardEvents = [
  { title: 'Page View', value: 'PageView' },
  { title: 'View Content', value: 'ViewContent' },
  { title: 'Search', value: 'Search' },
  { title: 'Add to Cart', value: 'AddToCart' },
  { title: 'Add to Wishlist', value: 'AddToWishlist' },
  { title: 'Initiate Checkout', value: 'InitiateCheckout' },
  { title: 'Add Payment Info', value: 'AddPaymentInfo' },
  { title: 'Purchase', value: 'Purchase' },
  { title: 'Lead', value: 'Lead' },
  { title: 'Complete Registration', value: 'CompleteRegistration' },
  { title: 'Contact', value: 'Contact' },
  { title: 'Find Location', value: 'FindLocation' }
];

// Predefined Custom Events
const scrollDepthEvents = [
  { title: '25% Scroll Depth', value: 'scroll_25' },
  { title: '50% Scroll Depth', value: 'scroll_50' },
  { title: '75% Scroll Depth', value: 'scroll_75' },
  { title: '90% Scroll Depth', value: 'scroll_90' }
];

const timeEngagementEvents = [
  { title: '10 Seconds Time', value: 'time_10s' },
  { title: '30 Seconds Time', value: 'time_30s' },
  { title: '1 Minute Time', value: 'time_1m' },
  { title: '1.5 Minutes Time', value: 'time_1_5m' },
  { title: '2 Minutes Time', value: 'time_2m' },
  { title: '3 Minutes Time', value: 'time_3m' },
  { title: '5 Minutes Time', value: 'time_5m' }
];

// Available Conversion Events
const availableConversionEvents = [
  { title: 'Purchase', value: 'Purchase' },
  { title: 'Lead', value: 'Lead' },
  { title: 'Complete Registration', value: 'CompleteRegistration' },
  { title: 'Add to Cart', value: 'AddToCart' },
  { title: 'Initiate Checkout', value: 'InitiateCheckout' },
  { title: 'Contact', value: 'Contact' }
];

// Enhanced Rule Types
const enhancedRuleTypes = [
    { title: 'URL contains', value: 'url_contains' },
    { title: 'URL does not contain', value: 'url_not_contains' },
    { title: 'URL starts with', value: 'url_starts_with' },
    { title: 'URL ends with', value: 'url_ends_with' },
    { title: 'Query parameter exists', value: 'query_param_exists' }
];

// Activation Rules methods
const addRule = () => {
    if (!Array.isArray(editedItem.activation_rules)) {
        editedItem.activation_rules = [];
    }
    editedItem.activation_rules.push({ type: 'url_contains', value: '' });
};

const removeRule = (index) => {
    editedItem.activation_rules.splice(index, 1);
};

// Dialog/Sidebar methods
const openSidebar = (item) => {
    if (item) {
        const itemData = _.cloneDeep(item);
        // Ensure tracking_config exists with defaults
        if (!itemData.tracking_config) {
            itemData.tracking_config = _.cloneDeep(defaultTrackingConfig);
        } else {
            // Merge with defaults to ensure all fields exist
            itemData.tracking_config = { ...defaultTrackingConfig, ...itemData.tracking_config };
        }
        Object.assign(editedItem, itemData);
    } else {
        Object.assign(editedItem, _.cloneDeep(defaultItem));
    }
    
    // Reset sidebar state
    currentStep.value = 1;
    setupMode.value = 'guided';
    sidebar.value = true;
};

const closeSidebar = () => {
    sidebar.value = false;
    form.value?.resetValidation();
};

const savePixel = async () => {
    const { valid } = await form.value.validate();
    if (!valid) return;
    
    const payload = _.cloneDeep(editedItem);
    let success = false;
    if (isEditMode.value) {
        success = await websiteStore.updatePixel(props.websiteId, editedItem.id, payload);
    } else {
        success = await websiteStore.addPixel(props.websiteId, payload);
    }
    if (success) closeSidebar();
};

const openDeleteDialog = (item) => { itemToDelete.value = item; deleteDialog.value = true; };
const closeDeleteDialog = () => { deleteDialog.value = false; itemToDelete.value = null; };
const confirmDelete = async () => {
    if (itemToDelete.value) {
        const success = await websiteStore.deletePixel(props.websiteId, itemToDelete.value.id);
        if (success) closeDeleteDialog();
    }
};

// Load data on mount
onMounted(() => {
    websiteStore.fetchPixels(props.websiteId);
});
</script>

<style scoped>
.pixel-sidebar {
    z-index: 2010 !important;
    position: fixed !important;
    top: 0 !important;
    height: 100vh !important;
}

.pixel-sidebar :deep(.v-navigation-drawer__content) {
    height: 100vh !important;
    display: flex;
    flex-direction: column;
}

.sidebar-header {
    padding: 24px;
    border-bottom: 1px solid rgba(0,0,0,0.12);
    background: #f8fafc;
    flex-shrink: 0;
}

.setup-mode-toggle {
    width: 100%;
}

.sidebar-content {
    padding: 24px;
    flex: 1;
    overflow-y: auto;
    height: 0; /* Force flex behavior */
}

.step-navigation {
    margin-bottom: 24px;
}

.step-section {
    min-height: 400px;
}

.step-navigation-buttons {
    border-top: 1px solid rgba(0,0,0,0.12);
    padding-top: 16px;
}

.guided-setup h3,
.advanced-setup h3 {
    color: #1a202c;
    font-weight: 600;
}

.guided-setup h4,
.advanced-setup h4 {
    color: #2d3748;
    font-weight: 500;
}

.v-checkbox {
    margin-bottom: 8px;
}

.v-stepper {
    box-shadow: none !important;
}

.v-stepper-header {
    box-shadow: none !important;
    padding: 0;
}
</style>