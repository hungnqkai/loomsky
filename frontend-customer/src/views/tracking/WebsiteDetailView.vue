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
                @click="openTrackingSetupModal"
              >
                {{ getTrackingSetupButtonText() }}
              </button>
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

            <div class="setup-card" :class="{ completed: isEventFilterCompleted() }">
              <div class="setup-card-header">
                <div class="setup-icon filters">
                  <v-icon color="white" size="24">mdi-filter</v-icon>
                </div>
                <div>
                  <div class="setup-title">Auto Event Filter</div>
                </div>
              </div>
              <div class="setup-description">
                Automatically filter and manage events based on URLs, domains, and user behaviors to reduce noise and focus on meaningful data.
              </div>
              <button 
                class="setup-action" 
                :class="{ completed: isEventFilterCompleted() }"
                @click="tab = 'filters'"
              >
                {{ getEventFilterButtonText() }}
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

    <!-- Enhanced Tracking Setup Modal -->
    <v-dialog v-model="trackingSetupModal" max-width="1000" persistent>
      <v-card class="tracking-setup-modal">
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="modal-header-content">
            <div class="modal-icon">
              <v-icon size="28" color="white">mdi-radar</v-icon>
            </div>
            <div>
              <h2 class="modal-title">Tracking Setup Guide</h2>
              <p class="modal-subtitle">
                {{ websiteStore.currentWebsite?.platform_type === 'wordpress' ? 'WordPress Plugin' : 'JavaScript SDK' }} 
                Installation for {{ websiteStore.currentWebsite?.name }}
              </p>
            </div>
            <v-btn icon="mdi-close" variant="text" @click="closeTrackingSetupModal" class="close-btn"></v-btn>
          </div>
          
          <!-- Progress Stepper -->
          <div class="progress-stepper">
            <div class="stepper-line">
              <div class="stepper-progress" :style="{ width: ((currentSetupStep - 1) / 3) * 100 + '%' }"></div>
            </div>
            <div 
              v-for="step in setupSteps" 
              :key="step.step"
              class="stepper-item"
              :class="{ 
                active: currentSetupStep === step.step, 
                completed: currentSetupStep > step.step 
              }"
            >
              <div class="stepper-circle">
                <v-icon v-if="currentSetupStep > step.step" size="16">mdi-check</v-icon>
                <span v-else>{{ step.step }}</span>
              </div>
              <div class="stepper-label">{{ step.title }}</div>
            </div>
          </div>
        </div>

        <!-- Modal Content -->
        <div class="modal-content">
          <!-- Step 1: Platform & Requirements -->
          <div v-if="currentSetupStep === 1" class="setup-step">
            <div class="step-content">
              <h3 class="step-title">Platform Detection & Requirements</h3>
              <p class="step-description">
                We've detected your platform and prepared the optimal setup method for your website.
              </p>

              <div class="platform-detection">
                <div class="platform-card" :class="{ active: websiteStore.currentWebsite?.platform_type === 'wordpress' }">
                  <div class="platform-icon wordpress">
                    <v-icon size="32" color="white">mdi-wordpress</v-icon>
                  </div>
                  <div class="platform-info">
                    <h4>WordPress Plugin</h4>
                    <p>Easy installation via plugin directory</p>
                    <div class="platform-features">
                      <div class="feature-item">
                        <v-icon size="16" color="green">mdi-check-circle</v-icon>
                        <span>Automatic event tracking</span>
                      </div>
                      <div class="feature-item">
                        <v-icon size="16" color="green">mdi-check-circle</v-icon>
                        <span>WooCommerce integration</span>
                      </div>
                      <div class="feature-item">
                        <v-icon size="16" color="green">mdi-check-circle</v-icon>
                        <span>No coding required</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="platform-card" :class="{ active: websiteStore.currentWebsite?.platform_type !== 'wordpress' }">
                  <div class="platform-icon sdk">
                    <v-icon size="32" color="white">mdi-code-braces</v-icon>
                  </div>
                  <div class="platform-info">
                    <h4>JavaScript SDK</h4>
                    <p>Universal tracking for any website</p>
                    <div class="platform-features">
                      <div class="feature-item">
                        <v-icon size="16" color="green">mdi-check-circle</v-icon>
                        <span>Cross-platform compatibility</span>
                      </div>
                      <div class="feature-item">
                        <v-icon size="16" color="green">mdi-check-circle</v-icon>
                        <span>Custom event tracking</span>
                      </div>
                      <div class="feature-item">
                        <v-icon size="16" color="green">mdi-check-circle</v-icon>
                        <span>Advanced customization</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="requirements-section">
                <h4 class="requirements-title">
                  <v-icon left>mdi-information</v-icon>
                  Requirements
                </h4>
                <div class="requirements-list">
                  <div class="requirement-item">
                    <v-icon size="16" color="green">mdi-check</v-icon>
                    <span>Admin access to your website</span>
                  </div>
                  <div class="requirement-item">
                    <v-icon size="16" color="green">mdi-check</v-icon>
                    <span v-if="websiteStore.currentWebsite?.platform_type === 'wordpress'">WordPress 5.0 or higher</span>
                    <span v-else>HTML/JavaScript editing capabilities</span>
                  </div>
                  <div class="requirement-item">
                    <v-icon size="16" color="green">mdi-check</v-icon>
                    <span>Valid SSL certificate (HTTPS)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Installation Instructions -->
          <div v-if="currentSetupStep === 2" class="setup-step">
            <div class="step-content">
              <h3 class="step-title">Installation Instructions</h3>
              
              <!-- WordPress Plugin Instructions -->
              <div v-if="websiteStore.currentWebsite?.platform_type === 'wordpress'" class="installation-guide">
                <div class="guide-section">
                  <h4 class="guide-title">
                    <span class="step-number">1</span>
                    Download & Install Plugin
                  </h4>
                  <p class="guide-description">
                    Install the LoomSky Connector plugin from WordPress admin dashboard.
                  </p>
                  
                  <div class="installation-methods">
                    <div class="method-card">
                      <div class="method-header">
                        <v-icon color="primary">mdi-wordpress</v-icon>
                        <h5>Via WordPress Admin</h5>
                      </div>
                      <ol class="method-steps">
                        <li>Go to <strong>Plugins → Add New</strong></li>
                        <li>Search for <strong>"LoomSky Connector"</strong></li>
                        <li>Click <strong>Install Now</strong> then <strong>Activate</strong></li>
                      </ol>
                    </div>
                    
                    <div class="method-card">
                      <div class="method-header">
                        <v-icon color="secondary">mdi-download</v-icon>
                        <h5>Manual Installation</h5>
                      </div>
                      <ol class="method-steps">
                        <li>Download plugin from <a href="#" target="_blank">loomsky.com/plugin</a></li>
                        <li>Upload via <strong>Plugins → Add New → Upload</strong></li>
                        <li>Activate the plugin</li>
                      </ol>
                      <v-btn variant="outlined" size="small" class="download-btn">
                        <v-icon left size="16">mdi-download</v-icon>
                        Download Plugin
                      </v-btn>
                    </div>
                  </div>
                </div>

                <div class="guide-section">
                  <h4 class="guide-title">
                    <span class="step-number">2</span>
                    Configure API Key
                  </h4>
                  <p class="guide-description">
                    Copy your unique API key and paste it in the plugin settings.
                  </p>
                  
                  <div class="api-key-section">
                    <label class="api-key-label">Your API Key:</label>
                    <div class="api-key-input">
                      <code class="api-key">{{ websiteStore.currentWebsite?.api_key }}</code>
                      <v-btn 
                        icon="mdi-content-copy" 
                        size="small" 
                        variant="text" 
                        @click="copyApiKey"
                        :color="copiedApiKey ? 'green' : 'primary'"
                      ></v-btn>
                    </div>
                    <p class="api-key-hint">
                      Go to <strong>Settings → LoomSky</strong> in your WordPress admin and paste this key.
                    </p>
                  </div>
                </div>
              </div>

              <!-- SDK Instructions -->
              <div v-else class="installation-guide">
                <div class="guide-section">
                  <h4 class="guide-title">
                    <span class="step-number">1</span>
                    Add Tracking Code
                  </h4>
                  <p class="guide-description">
                    Add the following code to the &lt;head&gt; section of your website, before the closing &lt;/head&gt; tag.
                  </p>
                  
                  <div class="code-section">
                    <div class="code-header">
                      <span class="code-language">HTML</span>
                      <v-btn 
                        size="small" 
                        variant="text" 
                        @click="copyTrackingCode"
                        :color="copiedTrackingCode ? 'green' : 'primary'"
                      >
                        <v-icon left size="16">{{ copiedTrackingCode ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
                        {{ copiedTrackingCode ? 'Copied!' : 'Copy Code' }}
                      </v-btn>
                    </div>
                    <pre class="code-block">{{ trackingCodeSnippet }}</pre>
                  </div>
                </div>

                <div class="guide-section">
                  <h4 class="guide-title">
                    <span class="step-number">2</span>
                    Platform-Specific Instructions
                  </h4>
                  
                  <div class="platform-instructions">
                    <div class="instruction-tabs">
                      <button 
                        v-for="platform in platformInstructions" 
                        :key="platform.id"
                        class="instruction-tab"
                        :class="{ active: activePlatformTab === platform.id }"
                        @click="activePlatformTab = platform.id"
                      >
                        <v-icon size="20">{{ platform.icon }}</v-icon>
                        {{ platform.name }}
                      </button>
                    </div>
                    
                    <div class="instruction-content">
                      <div 
                        v-for="platform in platformInstructions" 
                        :key="platform.id"
                        v-show="activePlatformTab === platform.id"
                        class="instruction-panel"
                      >
                        <ol class="instruction-steps">
                          <li v-for="(step, index) in platform.steps" :key="index" v-html="step"></li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Testing & Validation -->
          <div v-if="currentSetupStep === 3" class="setup-step">
            <div class="step-content">
              <h3 class="step-title">Testing & Validation</h3>
              <p class="step-description">
                Let's verify that the tracking is working correctly on your website.
              </p>

              <div class="testing-section">
                <div class="test-card">
                  <div class="test-header">
                    <div class="test-icon" :class="{ success: connectionTestPassed, testing: testingConnection }">
                      <v-icon v-if="testingConnection" size="24">mdi-loading</v-icon>
                      <v-icon v-else-if="connectionTestPassed" size="24" color="white">mdi-check</v-icon>
                      <v-icon v-else size="24" color="white">mdi-wifi</v-icon>
                    </div>
                    <div>
                      <h4>Connection Test</h4>
                      <p>{{ getConnectionTestStatus() }}</p>
                    </div>
                  </div>
                  <v-btn 
                    :loading="testingConnection" 
                    :disabled="connectionTestPassed"
                    @click="testConnection"
                    color="primary"
                    variant="outlined"
                  >
                    {{ connectionTestPassed ? 'Connected' : 'Test Connection' }}
                  </v-btn>
                </div>

                <div class="test-card">
                  <div class="test-header">
                    <div class="test-icon" :class="{ success: eventsTestPassed, testing: testingEvents }">
                      <v-icon v-if="testingEvents" size="24">mdi-loading</v-icon>
                      <v-icon v-else-if="eventsTestPassed" size="24" color="white">mdi-check</v-icon>
                      <v-icon v-else size="24" color="white">mdi-lightning-bolt</v-icon>
                    </div>
                    <div>
                      <h4>Event Tracking</h4>
                      <p>{{ getEventsTestStatus() }}</p>
                    </div>
                  </div>
                  <v-btn 
                    :loading="testingEvents" 
                    :disabled="!connectionTestPassed || eventsTestPassed"
                    @click="testEvents"
                    color="primary"
                    variant="outlined"
                  >
                    {{ eventsTestPassed ? 'Working' : 'Test Events' }}
                  </v-btn>
                </div>
              </div>

              <div v-if="connectionTestPassed && eventsTestPassed" class="success-section">
                <div class="success-card">
                  <v-icon size="48" color="green">mdi-check-circle</v-icon>
                  <h3>Setup Complete!</h3>
                  <p>Your website is now successfully connected and tracking events automatically.</p>
                  
                  <div class="next-steps">
                    <h4>What's Next?</h4>
                    <ul>
                      <li>Set up data mapping for better tracking accuracy</li>
                      <li>Configure advertising pixels (Facebook, Google, etc.)</li>
                      <li>Create custom conversion events</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: Troubleshooting (Optional) -->
          <div v-if="currentSetupStep === 4" class="setup-step">
            <div class="step-content">
              <h3 class="step-title">Troubleshooting</h3>
              <p class="step-description">
                Having issues? Here are common problems and their solutions.
              </p>

              <div class="troubleshooting-section">
                <div class="faq-item" v-for="faq in troubleshootingFAQs" :key="faq.id">
                  <div class="faq-question" @click="faq.expanded = !faq.expanded">
                    <v-icon>{{ faq.expanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
                    <h4>{{ faq.question }}</h4>
                  </div>
                  <v-expand-transition>
                    <div v-if="faq.expanded" class="faq-answer" v-html="faq.answer"></div>
                  </v-expand-transition>
                </div>
              </div>

              <div class="support-section">
                <h4>Need More Help?</h4>
                <div class="support-options">
                  <v-btn color="primary" variant="outlined">
                    <v-icon left>mdi-message-text</v-icon>
                    Live Chat Support
                  </v-btn>
                  <v-btn color="secondary" variant="outlined">
                    <v-icon left>mdi-book-open-variant</v-icon>
                    Documentation
                  </v-btn>
                  <v-btn color="info" variant="outlined">
                    <v-icon left>mdi-video</v-icon>
                    Video Tutorials
                  </v-btn>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <div class="footer-navigation">
            <v-btn 
              v-if="currentSetupStep > 1" 
              @click="currentSetupStep--"
              variant="outlined"
            >
              <v-icon left>mdi-chevron-left</v-icon>
              Previous
            </v-btn>
            <div class="spacer"></div>
            <v-btn 
              v-if="currentSetupStep < 4"
              @click="currentSetupStep++"
              color="primary"
              :disabled="!canProceedToNextStep()"
            >
              Next
              <v-icon right>mdi-chevron-right</v-icon>
            </v-btn>
            <v-btn 
              v-if="currentSetupStep === 3 && connectionTestPassed && eventsTestPassed"
              @click="finishSetup"
              color="success"
            >
              <v-icon left>mdi-check</v-icon>
              Finish Setup
            </v-btn>
            <v-btn 
              v-if="currentSetupStep === 4"
              @click="closeTrackingSetupModal"
              color="primary"
            >
              Close
            </v-btn>
          </div>
        </div>
      </v-card>
    </v-dialog>
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

// Enhanced Tracking Setup Modal
const trackingSetupModal = ref(false);
const currentSetupStep = ref(1);
const copiedApiKey = ref(false);
const copiedTrackingCode = ref(false);
const activePlatformTab = ref('html');
const connectionTestPassed = ref(false);
const eventsTestPassed = ref(false);
const testingConnection = ref(false);
const testingEvents = ref(false);

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

const isEventFilterCompleted = () => {
  return (dashboardStats.value?.totalFilters || 0) > 0;
};

const getEventFilterButtonText = () => {
  const total = dashboardStats.value?.totalFilters || 0;
  if (total === 0) return 'Setup Filters';
  return `✓ ${total} Filters`;
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
  copiedApiKey.value = true;
  setTimeout(() => copiedApiKey.value = false, 2000);
};

// Enhanced Tracking Setup Modal Data & Methods
const setupSteps = ref([
  { step: 1, title: 'Platform & Requirements' },
  { step: 2, title: 'Installation' },
  { step: 3, title: 'Testing & Validation' },
  { step: 4, title: 'Troubleshooting' }
]);

const trackingCodeSnippet = computed(() => {
  const apiKey = websiteStore.currentWebsite?.api_key;
  return `<script async src="https://cdn.loomsky.com/sdk.js" data-api-key="${apiKey}"><\/script>`;
});

const platformInstructions = ref([
  {
    id: 'html',
    name: 'HTML/CSS',
    icon: 'mdi-language-html5',
    steps: [
      'Open your website\'s main template or header file',
      'Locate the <strong>&lt;head&gt;</strong> section',
      'Paste the tracking code before the closing <strong>&lt;/head&gt;</strong> tag',
      'Save the file and upload to your server'
    ]
  },
  {
    id: 'shopify',
    name: 'Shopify',
    icon: 'mdi-shopping',
    steps: [
      'Go to <strong>Online Store → Themes</strong> in your Shopify admin',
      'Click <strong>Actions → Edit code</strong> on your active theme',
      'Open the <strong>theme.liquid</strong> file',
      'Paste the code before the closing <strong>&lt;/head&gt;</strong> tag',
      'Click <strong>Save</strong> to apply changes'
    ]
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    icon: 'mdi-cart',
    steps: [
      'Install a header/footer plugin like <strong>Insert Headers and Footers</strong>',
      'Go to <strong>Settings → Insert Headers and Footers</strong>',
      'Paste the tracking code in the <strong>Scripts in Header</strong> section',
      'Click <strong>Save</strong> to apply changes'
    ]
  },
  {
    id: 'squarespace',
    name: 'Squarespace',
    icon: 'mdi-square',
    steps: [
      'Go to <strong>Settings → Advanced → Code Injection</strong>',
      'Paste the code in the <strong>Header</strong> section',
      'Click <strong>Save</strong> to apply changes'
    ]
  },
  {
    id: 'wix',
    name: 'Wix',
    icon: 'mdi-web',
    steps: [
      'Open your site editor and go to <strong>Settings → Custom Code</strong>',
      'Click <strong>+ Add Custom Code</strong>',
      'Paste the code and set it to load on <strong>All pages</strong>',
      'Set the placement to <strong>Head</strong>',
      'Click <strong>Apply</strong>'
    ]
  }
]);

const troubleshootingFAQs = ref([
  {
    id: 1,
    question: "I installed the tracking code but don't see any data",
    expanded: false,
    answer: `
      <p>This is usually due to one of these reasons:</p>
      <ul>
        <li>The code was not installed correctly or in the wrong location</li>
        <li>Your website has caching enabled - clear your cache</li>
        <li>Browser ad blockers might be blocking the script</li>
        <li>It can take up to 30 minutes for data to appear</li>
      </ul>
      <p><strong>Solution:</strong> Use our connection test above to verify the installation.</p>
    `
  },
  {
    id: 2,
    question: "The tracking code is installed but events are not being recorded",
    expanded: false,
    answer: `
      <p>Check these common issues:</p>
      <ul>
        <li>Make sure your website is using HTTPS (SSL certificate)</li>
        <li>Check browser console for JavaScript errors</li>
        <li>Verify your API key is correct</li>
        <li>Ensure the LoomSky script loads before other tracking scripts</li>
      </ul>
    `
  },
  {
    id: 3,
    question: "WordPress plugin is not working properly",
    expanded: false,
    answer: `
      <p>For WordPress plugin issues:</p>
      <ul>
        <li>Make sure you're using WordPress 5.0 or higher</li>
        <li>Check for plugin conflicts by deactivating other plugins temporarily</li>
        <li>Verify the API key is entered correctly in Settings → LoomSky</li>
        <li>Clear any caching plugins (W3 Total Cache, WP Rocket, etc.)</li>
      </ul>
    `
  },
  {
    id: 4,
    question: "How do I know if the tracking is working correctly?",
    expanded: false,
    answer: `
      <p>You can verify tracking is working by:</p>
      <ul>
        <li>Using the connection test in this setup wizard</li>
        <li>Checking the "Last Activity" status in your website dashboard</li>
        <li>Looking at browser developer tools to see if events are being sent</li>
        <li>Visiting your website and checking if new events appear within a few minutes</li>
      </ul>
    `
  }
]);

// Enhanced Tracking Setup Modal Methods
const openTrackingSetupModal = () => {
  trackingSetupModal.value = true;
  currentSetupStep.value = 1;
  // Reset test states
  connectionTestPassed.value = false;
  eventsTestPassed.value = false;
  testingConnection.value = false;
  testingEvents.value = false;
  copiedApiKey.value = false;
  copiedTrackingCode.value = false;
};

const closeTrackingSetupModal = () => {
  trackingSetupModal.value = false;
  currentSetupStep.value = 1;
};

const copyTrackingCode = async () => {
  try {
    await navigator.clipboard.writeText(trackingCodeSnippet.value);
    copiedTrackingCode.value = true;
    setTimeout(() => copiedTrackingCode.value = false, 2000);
  } catch (err) {
    console.error('Failed to copy tracking code:', err);
  }
};

const canProceedToNextStep = () => {
  // Step 1: Always can proceed (just informational)
  if (currentSetupStep.value === 1) return true;
  
  // Step 2: Always can proceed (installation instructions)
  if (currentSetupStep.value === 2) return true;
  
  // Step 3: Can proceed to troubleshooting even without tests passing
  if (currentSetupStep.value === 3) return true;
  
  return false;
};

const testConnection = async () => {
  testingConnection.value = true;
  
  try {
    // Simulate API call to test connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock success for demo - replace with actual API call
    connectionTestPassed.value = true;
  } catch (error) {
    console.error('Connection test failed:', error);
  } finally {
    testingConnection.value = false;
  }
};

const testEvents = async () => {
  if (!connectionTestPassed.value) return;
  
  testingEvents.value = true;
  
  try {
    // Simulate API call to test events
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock success for demo - replace with actual API call
    eventsTestPassed.value = true;
  } catch (error) {
    console.error('Events test failed:', error);
  } finally {
    testingEvents.value = false;
  }
};

const getConnectionTestStatus = () => {
  if (testingConnection.value) return 'Testing connection...';
  if (connectionTestPassed.value) return 'Connection successful';
  return 'Test your website connection to LoomSky servers';
};

const getEventsTestStatus = () => {
  if (testingEvents.value) return 'Testing event tracking...';
  if (eventsTestPassed.value) return 'Events are being tracked successfully';
  if (!connectionTestPassed.value) return 'Complete connection test first';
  return 'Test event tracking functionality';
};

const finishSetup = () => {
  // Mark setup as completed
  websiteStore.markTrackingSetupCompleted(props.id);
  closeTrackingSetupModal();
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
.setup-icon.filters { background: #ef4444; }

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

/* Enhanced Tracking Setup Modal */
.tracking-setup-modal {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  background: linear-gradient(135deg, #0067b8 0%, #0052a3 100%);
  color: white;
  padding: 24px 32px;
  flex-shrink: 0;
}

.modal-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.modal-icon {
  width: 48px;
  height: 48px;
  background: rgba(255,255,255,0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.modal-subtitle {
  opacity: 0.9;
  font-size: 0.95rem;
}

.close-btn {
  margin-left: auto;
  color: white !important;
}

/* Progress Stepper */
.progress-stepper {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stepper-line {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255,255,255,0.3);
  z-index: 1;
}

.stepper-progress {
  height: 100%;
  background: rgba(255,255,255,0.8);
  transition: width 0.3s ease;
  border-radius: 1px;
}

.stepper-item {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: transparent;
}

.stepper-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: 2px solid rgba(255,255,255,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  color: white;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.stepper-item.active .stepper-circle {
  background: white;
  color: #0067b8;
  border-color: white;
}

.stepper-item.completed .stepper-circle {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.stepper-label {
  font-size: 0.8rem;
  text-align: center;
  opacity: 0.8;
}

.stepper-item.active .stepper-label {
  opacity: 1;
  font-weight: 600;
}

/* Modal Content */
.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  background: #f8fafc;
}

.setup-step {
  max-width: 800px;
  margin: 0 auto;
}

.step-content {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.step-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.step-description {
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 32px;
}

/* Platform Detection */
.platform-detection {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.platform-card {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  gap: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
  background: white;
}

.platform-card:hover {
  border-color: #0067b8;
  transform: translateY(-2px);
}

.platform-card.active {
  border-color: #0067b8;
  background: #f0f9ff;
  box-shadow: 0 4px 12px rgba(0, 103, 184, 0.1);
}

.platform-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.platform-icon.wordpress {
  background: #21759b;
}

.platform-icon.sdk {
  background: #10b981;
}

.platform-info h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.platform-info p {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.platform-features {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #374151;
}

/* Requirements */
.requirements-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
}

.requirements-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.requirements-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.requirement-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #374151;
}

/* Installation Guide */
.installation-guide {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.guide-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px;
}

.guide-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-number {
  width: 28px;
  height: 28px;
  background: #0067b8;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
}

.guide-description {
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 20px;
}

/* Installation Methods */
.installation-methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.method-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
}

.method-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.method-header h5 {
  font-weight: 600;
  color: #111827;
}

.method-steps {
  list-style: none;
  padding: 0;
  margin: 0;
}

.method-steps li {
  padding: 4px 0;
  color: #374151;
  font-size: 0.9rem;
  counter-increment: step-counter;
  position: relative;
  padding-left: 20px;
}

.method-steps li:before {
  content: counter(step-counter);
  position: absolute;
  left: 0;
  top: 4px;
  width: 16px;
  height: 16px;
  background: #0067b8;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
}

.method-steps {
  counter-reset: step-counter;
}

.download-btn {
  margin-top: 16px;
}

/* API Key Section */
.api-key-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
}

.api-key-label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.api-key-input {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 8px;
}

.api-key {
  flex: 1;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  color: #111827;
  background: none;
  border: none;
  outline: none;
}

.api-key-hint {
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.4;
}

/* Code Section */
.code-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.code-language {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.code-block {
  background: #1f2937;
  color: #f9fafb;
  padding: 20px;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Platform Instructions */
.platform-instructions {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.instruction-tabs {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
}

.instruction-tab {
  background: none;
  border: none;
  padding: 12px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #6b7280;
  transition: all 0.3s ease;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
}

.instruction-tab:hover {
  background: #f8fafc;
  color: #374151;
}

.instruction-tab.active {
  background: #f0f9ff;
  color: #0067b8;
  border-bottom-color: #0067b8;
}

.instruction-content {
  padding: 24px;
}

.instruction-steps {
  list-style: none;
  padding: 0;
  margin: 0;
  counter-reset: instruction-counter;
}

.instruction-steps li {
  padding: 8px 0;
  color: #374151;
  font-size: 0.9rem;
  line-height: 1.6;
  counter-increment: instruction-counter;
  position: relative;
  padding-left: 32px;
}

.instruction-steps li:before {
  content: counter(instruction-counter);
  position: absolute;
  left: 0;
  top: 8px;
  width: 20px;
  height: 20px;
  background: #0067b8;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Testing Section */
.testing-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.test-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.test-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.test-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #6b7280;
  transition: all 0.3s ease;
}

.test-icon.testing {
  background: #f59e0b;
}

.test-icon.testing .v-icon {
  animation: spin 1s linear infinite;
}

.test-icon.success {
  background: #10b981;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.test-header h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.test-header p {
  font-size: 0.9rem;
  color: #6b7280;
}

/* Success Section */
.success-section {
  margin-top: 32px;
}

.success-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
}

.success-card h3 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #15803d;
  margin: 16px 0 12px;
}

.success-card p {
  color: #166534;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 24px;
}

.next-steps {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  text-align: left;
}

.next-steps h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #15803d;
  margin-bottom: 12px;
}

.next-steps ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.next-steps li {
  padding: 4px 0;
  color: #166534;
  font-size: 0.9rem;
  position: relative;
  padding-left: 20px;
}

.next-steps li:before {
  content: '→';
  position: absolute;
  left: 0;
  color: #10b981;
  font-weight: 600;
}

/* Troubleshooting */
.troubleshooting-section {
  margin-bottom: 32px;
}

.faq-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
}

.faq-question {
  padding: 16px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 0.3s ease;
}

.faq-question:hover {
  background: #f8fafc;
}

.faq-question h4 {
  font-size: 1rem;
  font-weight: 500;
  color: #111827;
  margin: 0;
}

.faq-answer {
  padding: 0 20px 20px 44px;
  color: #374151;
  font-size: 0.9rem;
  line-height: 1.6;
}

.faq-answer p {
  margin-bottom: 12px;
}

.faq-answer ul {
  margin: 8px 0 16px 20px;
}

.faq-answer li {
  margin-bottom: 4px;
}

/* Support Section */
.support-section h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.support-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* Modal Footer */
.modal-footer {
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  padding: 20px 32px;
  flex-shrink: 0;
}

.footer-navigation {
  display: flex;
  align-items: center;
  gap: 12px;
}

.spacer {
  flex: 1;
}

/* Mobile Responsive for Modal */
@media (max-width: 768px) {
  .modal-content {
    padding: 20px;
  }
  
  .step-content {
    padding: 24px 20px;
  }
  
  .modal-header {
    padding: 20px;
  }
  
  .modal-header-content {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .platform-detection {
    grid-template-columns: 1fr;
  }
  
  .installation-methods {
    grid-template-columns: 1fr;
  }
  
  .testing-section {
    grid-template-columns: 1fr;
  }
  
  .instruction-tabs {
    flex-direction: column;
  }
  
  .instruction-tab {
    justify-content: flex-start;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .support-options {
    flex-direction: column;
  }
}
</style>