<!-- 
File: src/components/tracking/PixelManager.vue (REDESIGNED with Sidebar)
- Replaced popup dialog with sidebar navigation drawer
- Added guided and advanced setup modes
- Integrated Events & Conversions configuration
- Predefined custom events and enhanced activation rules
-->
<template>
    <div class="pixel-manager">
        <!-- Enhanced Header Section -->
        <div class="header-section">
            <div class="header-content">
                <div class="header-left">
                    <h2 class="header-title text-h5">Facebook Pixels & Event Configuration</h2>
                    <p class="text-body-1 text--secondary header-description">
                        Connect Facebook Pixels with comprehensive event tracking and conversion optimization. Configure standard events, custom engagement tracking, and activation rules.
                    </p>
                </div>
                <v-btn class="add-pixel-btn" @click="openSidebar()">
                    <v-icon left>mdi-plus</v-icon>
                    Add New Pixel
                </v-btn>
            </div>
        </div>

        <!-- Main Content Card -->
        <v-card class="main-content" flat>
            <div class="content-header">
                <h3 class="content-title text-h6">Configured Pixels</h3>
                <p class="content-subtitle">Manage your Facebook Pixels and their event configurations</p>
            </div>

            <v-alert v-if="websiteStore.error" type="error" class="ma-4" closable @click:close="websiteStore.clearMessages()">
                {{ websiteStore.error }}
            </v-alert>
            <v-alert v-if="websiteStore.successMessage" type="success" class="ma-4" closable @click:close="websiteStore.clearMessages()">
                {{ websiteStore.successMessage }}
            </v-alert>

            <!-- Enhanced Data Table -->
            <v-data-table
                :headers="headers"
                :items="websiteStore.pixels"
                :loading="websiteStore.actionLoading"
                item-value="id"
                no-data-text="No pixels configured yet."
                class="custom-data-table"
            >
                <template v-slot:item.pixel_id="{ item }">
                    <span class="pixel-id-code">{{ item.pixel_id }}</span>
                </template>
                
                <template v-slot:item.events_count="{ item }">
                    <div class="events-count">
                        <v-chip 
                            size="small" 
                            class="count-badge standard"
                            v-if="getStandardEventsCount(item) > 0"
                        >
                            {{ getStandardEventsCount(item) }} Standard
                        </v-chip>
                        <v-chip 
                            size="small" 
                            class="count-badge custom"
                            v-if="getCustomEventsCount(item) > 0"
                        >
                            {{ getCustomEventsCount(item) }} Custom
                        </v-chip>
                        <v-chip 
                            size="small" 
                            class="count-badge conversion"
                            v-if="getConversionEventsCount(item) > 0"
                        >
                            {{ getConversionEventsCount(item) }} Conversions
                        </v-chip>
                    </div>
                </template>
                
                <template v-slot:item.actions="{ item }">
                    <div class="table-actions">
                        <v-btn
                            icon
                            size="small"
                            class="action-btn edit"
                            @click="openSidebar(item)"
                            title="Edit pixel"
                        >
                            <v-icon size="16">mdi-pencil</v-icon>
                        </v-btn>
                        <v-btn
                            icon
                            size="small"
                            class="action-btn delete"
                            @click="openDeleteDialog(item)"
                            title="Delete pixel"
                        >
                            <v-icon size="16">mdi-delete</v-icon>
                        </v-btn>
                    </div>
                </template>

                <template v-slot:no-data>
                    <div class="empty-state">
                        <div class="empty-icon">
                            <v-icon size="64" color="grey-lighten-2">mdi-facebook</v-icon>
                        </div>
                        <h3 class="empty-title text-h6">No Pixels Configured Yet</h3>
                        <p class="empty-text">
                            Get started by adding your first Facebook Pixel to begin tracking user interactions and optimizing your advertising campaigns.
                        </p>
                        <v-btn 
                            class="empty-action"
                            color="primary"
                            @click="openSidebar()"
                        >
                            <v-icon left>mdi-plus</v-icon>
                            Add Your First Pixel
                        </v-btn>
                    </div>
                </template>
            </v-data-table>
        </v-card>

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
    </div>

    <!-- Sidebar for Add/Edit Pixel (Full viewport height) -->
    <v-navigation-drawer
        v-model="sidebar"
        location="right"
        width="800"
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
                    <v-btn-toggle class="setup-mode-toggle" v-model="setupMode" mandatory variant="outlined" divided>
                        <v-btn class="mode-btn" value="guided" prepend-icon="mdi-wizard-hat">
                            Guided Setup
                        </v-btn>
                        <v-btn class="mode-btn" value="advanced" prepend-icon="mdi-cog">
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

// Event count calculation methods
const getStandardEventsCount = (item) => {
    if (!item?.tracking_config?.standard_events) return 0;
    return Array.isArray(item.tracking_config.standard_events) 
        ? item.tracking_config.standard_events.length 
        : 0;
};

const getCustomEventsCount = (item) => {
    if (!item?.tracking_config?.custom_events) return 0;
    return Array.isArray(item.tracking_config.custom_events) 
        ? item.tracking_config.custom_events.length 
        : 0;
};

const getConversionEventsCount = (item) => {
    if (!item?.tracking_config?.conversion_events) return 0;
    return Array.isArray(item.tracking_config.conversion_events) 
        ? item.tracking_config.conversion_events.length 
        : 0;
};

// Load data on mount
onMounted(() => {
    websiteStore.fetchPixels(props.websiteId);
});
</script>

<style scoped>
/* Main Container */
.pixel-manager {
    padding: 0;
}

/* Enhanced Header Section */
.header-section {
    color: black;
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
    background: white;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.header-content {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
}

.header-left {
    flex: 1;
}

.header-title {
    font-weight: 600;
    margin-bottom: 8px;
    line-height: 1.2;
}

.header-description {
    opacity: 0.9;
    font-size: 1.1em;
    line-height: 1.6;
    max-width: 600px;
}

.add-pixel-btn {
    background: var(--loomsky-primary);
    color: white;
    padding: 25px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    text-transform: capitalize;
}

.add-pixel-btn:hover {
    transform: translateY(-2px);
}

/* Main Content */
.main-content {
    border-radius: 16px !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important;
    overflow: hidden;
}

.content-header {
    padding: 24px 32px;
    border-bottom: 1px solid #e2e8f0;
}

.content-title {
    font-size: 1.5em;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
}

.content-subtitle {
    color: #6b7280;
    font-size: 1em;
}

/* Enhanced Data Table */
.custom-data-table {
    background: transparent;
}

.custom-data-table :deep(.v-table) {
    background: transparent;
}

.custom-data-table :deep(.v-table__wrapper) {
    border-radius: 0;
}

.custom-data-table :deep(thead th) {
    background: #f8fafc !important;
    color: #374151 !important;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 0.85em;
    height: 56px;
    border-bottom: 1px solid #e2e8f0 !important;
}

.custom-data-table :deep(tbody tr) {
    border-bottom: 1px solid #f1f5f9;
    transition: background-color 0.2s ease;
}

.custom-data-table :deep(tbody tr:hover) {
    background: #f8fafc !important;
}

.custom-data-table :deep(tbody td) {
    padding: 20px 16px;
    height: 72px;
}

.pixel-id-code {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    background: #f1f5f9;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 0.9em;
    font-weight: 500;
    color: #1f2937;
}

/* Events Count Badges */
.events-count {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.count-badge {
    font-weight: 500;
    font-size: 0.8em;
}

.count-badge.standard {
    background: #1877f2 !important;
    color: white !important;
}

.count-badge.custom {
    background: #10b981 !important;
    color: white !important;
}

.count-badge.conversion {
    background: #f59e0b !important;
    color: white !important;
}

/* Table Actions */
.table-actions {
    display: flex;
    gap: 8px;
}

.action-btn {
    transition: all 0.3s ease;
}

.action-btn.edit {
    background: #f0f9ff !important;
    color: #0369a1 !important;
}

.action-btn.delete {
    background: #fef2f2 !important;
    color: #dc2626 !important;
}

.action-btn:hover {
    transform: scale(1.1);
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: 80px 32px;
    color: #6b7280;
}

.empty-icon {
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
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
}

.empty-action {
    font-weight: 600;
    text-transform: none;
    letter-spacing: normal;
}

/* Sidebar Styling */
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
    padding: 24px 32px;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
    flex-shrink: 0;
}

.setup-mode-toggle {
    width: 100%;
}

.sidebar-content {
    padding: 32px;
    flex: 1;
    overflow-y: auto;
    height: 0;
}

.step-navigation {
    margin-bottom: 24px;
}

.step-section {
    min-height: 400px;
}

.step-navigation-buttons {
    border-top: 1px solid #e2e8f0;
    padding-top: 16px;
}

.guided-setup h3,
.advanced-setup h3 {
    color: #111827;
    font-weight: 600;
}

.guided-setup h4,
.advanced-setup h4 {
    color: #374151;
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

/* Responsive Design */
@media (max-width: 768px) {
    .header-content {
        flex-direction: column;
        gap: 20px;
        text-align: center;
    }
    
    .header-title {
        font-size: 1.6em;
    }
    
    .header-description {
        font-size: 1em;
    }
    
    .pixel-sidebar {
        width: 100vw !important;
    }
    
    .events-count {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }
}

.mode-btn {
    width: 100%;
    flex-shrink: unset;
}

.v-btn--active.mode-btn {
    background: #1877f2;
    color: #fff;
}

.v-stepper-item {
    flex-direction: column;
    gap: 15px;
    padding: 20px
}

.v-stepper-item__title {
    padding-bottom: 5px;
}

.v-stepper-item__subtitle {
    text-align: center;
}
</style>