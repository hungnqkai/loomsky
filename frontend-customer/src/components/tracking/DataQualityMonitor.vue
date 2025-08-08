<!--
File: src/components/tracking/DataQualityMonitor.vue
- Real-time data quality monitoring dashboard
- Event standardization metrics và health indicators
- Quality scoring và issue reporting
-->
<template>
  <div class="data-quality-monitor">
    <!-- Header -->
    <div class="monitor-header">
      <div class="header-content">
        <div class="header-left">
          <h3 class="header-title">Data Quality Monitor</h3>
          <p class="header-subtitle">Real-time tracking quality và event standardization metrics</p>
        </div>
        <div class="header-actions">
          <v-btn
            :loading="loading"
            @click="refreshMetrics"
            icon="mdi-refresh"
            variant="outlined"
            size="small"
            title="Refresh metrics"
          ></v-btn>
          <v-menu offset-y>
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                icon="mdi-dots-vertical"
                variant="text"
                size="small"
              ></v-btn>
            </template>
            <v-list density="compact">
              <v-list-item @click="exportReport">
                <v-list-item-title>Export Report</v-list-item-title>
              </v-list-item>
              <v-list-item @click="showSettings = true">
                <v-list-item-title>Settings</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
      
      <!-- Auto-refresh indicator -->
      <div class="refresh-status" v-if="autoRefresh">
        <v-icon icon="mdi-autorenew" size="16" class="refresh-icon"></v-icon>
        <span class="refresh-text">Auto-refreshing every {{ refreshInterval }}s</span>
        <div class="refresh-progress">
          <v-progress-linear 
            :model-value="refreshProgress" 
            height="2" 
            color="primary"
          ></v-progress-linear>
        </div>
      </div>
    </div>

    <!-- Overall Quality Score -->
    <v-card class="quality-score-card" elevation="2">
      <v-card-text>
        <div class="quality-score-content">
          <div class="score-circle">
            <v-progress-circular
              :model-value="overallScore"
              :color="getScoreColor(overallScore)"
              :width="8"
              :size="120"
            >
              <div class="score-text">
                <div class="score-number">{{ overallScore }}%</div>
                <div class="score-label">Quality Score</div>
              </div>
            </v-progress-circular>
          </div>
          
          <div class="score-details">
            <div class="score-breakdown">
              <div class="breakdown-item">
                <v-icon icon="mdi-check-circle" :color="getScoreColor(metrics.standardization_score)" size="20"></v-icon>
                <div class="breakdown-content">
                  <div class="breakdown-label">Event Standardization</div>
                  <div class="breakdown-value">{{ metrics.standardization_score }}%</div>
                </div>
              </div>
              
              <div class="breakdown-item">
                <v-icon icon="mdi-database-check" :color="getScoreColor(metrics.data_completeness_score)" size="20"></v-icon>
                <div class="breakdown-content">
                  <div class="breakdown-label">Data Completeness</div>
                  <div class="breakdown-value">{{ metrics.data_completeness_score }}%</div>
                </div>
              </div>
              
              <div class="breakdown-item">
                <v-icon icon="mdi-facebook" :color="getScoreColor(metrics.facebook_capi_score)" size="20"></v-icon>
                <div class="breakdown-content">
                  <div class="breakdown-label">Facebook CAPI Ready</div>
                  <div class="breakdown-value">{{ metrics.facebook_capi_score }}%</div>
                </div>
              </div>
            </div>
            
            <div class="score-summary">
              <div class="summary-stat">
                <span class="stat-value">{{ metrics.total_events_today || 0 }}</span>
                <span class="stat-label">Events Today</span>
              </div>
              <div class="summary-stat">
                <span class="stat-value">{{ metrics.valid_events_today || 0 }}</span>
                <span class="stat-label">Valid Events</span>
              </div>
              <div class="summary-stat">
                <span class="stat-value">{{ metrics.facebook_ready_today || 0 }}</span>
                <span class="stat-label">FB CAPI Ready</span>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Quality Metrics Grid -->
    <div class="metrics-grid">
      <!-- Event Distribution -->
      <v-card class="metric-card" elevation="1">
        <v-card-title class="metric-title">
          <v-icon icon="mdi-chart-donut" class="title-icon"></v-icon>
          Event Distribution
        </v-card-title>
        <v-card-text>
          <div class="event-distribution">
            <div 
              v-for="category in eventCategories" 
              :key="category.key"
              class="category-item"
            >
              <div class="category-header">
                <v-icon :icon="category.icon" :color="category.color" size="16"></v-icon>
                <span class="category-name">{{ category.name }}</span>
                <span class="category-count">{{ category.count }}</span>
              </div>
              <v-progress-linear 
                :model-value="category.percentage" 
                :color="category.color"
                height="4"
                class="category-progress"
              ></v-progress-linear>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Issues & Warnings -->
      <v-card class="metric-card" elevation="1">
        <v-card-title class="metric-title">
          <v-icon icon="mdi-alert-circle" class="title-icon"></v-icon>
          Issues & Warnings
        </v-card-title>
        <v-card-text>
          <div v-if="issues.length === 0" class="no-issues">
            <v-icon icon="mdi-check-circle" color="green" size="32"></v-icon>
            <p class="no-issues-text">No issues detected</p>
          </div>
          <div v-else class="issues-list">
            <div 
              v-for="issue in issues" 
              :key="issue.id"
              class="issue-item"
              :class="issue.severity"
            >
              <v-icon 
                :icon="getIssueIcon(issue.severity)" 
                :color="getIssueColor(issue.severity)"
                size="20"
              ></v-icon>
              <div class="issue-content">
                <div class="issue-title">{{ issue.title }}</div>
                <div class="issue-description">{{ issue.description }}</div>
                <div class="issue-time">{{ formatTime(issue.timestamp) }}</div>
              </div>
              <v-btn 
                v-if="issue.actionable"
                @click="resolveIssue(issue)"
                size="small"
                variant="outlined"
                color="primary"
              >
                Fix
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Data Sources Health -->
      <v-card class="metric-card" elevation="1">
        <v-card-title class="metric-title">
          <v-icon icon="mdi-server-network" class="title-icon"></v-icon>
          Data Sources Health
        </v-card-title>
        <v-card-text>
          <div class="data-sources">
            <div 
              v-for="source in dataSources" 
              :key="source.key"
              class="source-item"
            >
              <div class="source-header">
                <v-icon :icon="source.icon" size="20" class="source-icon"></v-icon>
                <div class="source-info">
                  <div class="source-name">{{ source.name }}</div>
                  <div class="source-description">{{ source.description }}</div>
                </div>
                <div class="source-status">
                  <v-chip 
                    :color="getSourceStatusColor(source.status)"
                    size="small"
                    class="status-chip"
                  >
                    {{ source.status }}
                  </v-chip>
                </div>
              </div>
              <div class="source-metrics">
                <div class="source-metric">
                  <span class="metric-label">Success Rate</span>
                  <span class="metric-value">{{ source.success_rate }}%</span>
                </div>
                <div class="source-metric">
                  <span class="metric-label">Last Update</span>
                  <span class="metric-value">{{ formatTime(source.last_update) }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Performance Metrics -->
      <v-card class="metric-card" elevation="1">
        <v-card-title class="metric-title">
          <v-icon icon="mdi-speedometer" class="title-icon"></v-icon>
          Performance
        </v-card-title>
        <v-card-text>
          <div class="performance-metrics">
            <div class="perf-metric">
              <div class="perf-value">{{ performance.avg_processing_time }}ms</div>
              <div class="perf-label">Avg Processing Time</div>
              <v-progress-linear 
                :model-value="getPerformanceScore(performance.avg_processing_time, 200)" 
                :color="getPerformanceColor(performance.avg_processing_time, 200)"
                height="4"
              ></v-progress-linear>
            </div>
            
            <div class="perf-metric">
              <div class="perf-value">{{ performance.events_per_second }}</div>
              <div class="perf-label">Events/Second</div>
              <v-progress-linear 
                :model-value="Math.min(performance.events_per_second * 10, 100)" 
                color="blue"
                height="4"
              ></v-progress-linear>
            </div>
            
            <div class="perf-metric">
              <div class="perf-value">{{ performance.error_rate }}%</div>
              <div class="perf-label">Error Rate</div>
              <v-progress-linear 
                :model-value="performance.error_rate" 
                :color="performance.error_rate > 5 ? 'red' : 'green'"
                height="4"
              ></v-progress-linear>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Settings Dialog -->
    <v-dialog v-model="showSettings" max-width="500">
      <v-card>
        <v-card-title>Monitor Settings</v-card-title>
        <v-card-text>
          <v-switch 
            v-model="autoRefresh"
            label="Auto-refresh"
            color="primary"
          ></v-switch>
          
          <v-select
            v-if="autoRefresh"
            v-model="refreshInterval"
            :items="refreshIntervals"
            label="Refresh Interval (seconds)"
            variant="outlined"
            class="mt-4"
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showSettings = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useWebsiteStore } from '@/stores/websiteStore';
import { EVENT_CATEGORIES } from '@/constants/eventStandards';

const props = defineProps({
  websiteId: { type: String, required: true }
});

const websiteStore = useWebsiteStore();

// Reactive state
const loading = ref(false);
const showSettings = ref(false);
const autoRefresh = ref(true);
const refreshInterval = ref(30);
const refreshProgress = ref(0);
let refreshTimer = null;
let progressTimer = null;

const refreshIntervals = [10, 30, 60, 120, 300];

// Mock data - in real implementation, this would come from API
const metrics = reactive({
  total_events_today: 1247,
  valid_events_today: 1198,
  facebook_ready_today: 856,
  standardization_score: 92,
  data_completeness_score: 88,
  facebook_capi_score: 85
});

const performance = reactive({
  avg_processing_time: 45,
  events_per_second: 3.2,
  error_rate: 2.1
});

const issues = ref([
  {
    id: 1,
    severity: 'warning',
    title: 'Missing product_price on AddToCart events',
    description: '15% of AddToCart events are missing required price field',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    actionable: true
  },
  {
    id: 2,
    severity: 'info',
    title: 'High scroll depth engagement',
    description: '85% of users are scrolling past 50% on product pages',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    actionable: false
  }
]);

const dataSources = ref([
  {
    key: 'platform_data',
    name: 'Platform Data Layer',
    description: 'Automatic data from WordPress/Shopify',
    icon: 'mdi-layers',
    status: 'healthy',
    success_rate: 94,
    last_update: new Date(Date.now() - 1000 * 60 * 5)
  },
  {
    key: 'manual_mapping',
    name: 'Manual Data Mapping',
    description: 'User-defined field selectors',
    icon: 'mdi-map-marker',
    status: 'warning',
    success_rate: 87,
    last_update: new Date(Date.now() - 1000 * 60 * 15)
  },
  {
    key: 'sdk_events',
    name: 'SDK Events',
    description: 'Direct event tracking via SDK',
    icon: 'mdi-code-braces',
    status: 'healthy',
    success_rate: 98,
    last_update: new Date(Date.now() - 1000 * 60 * 2)
  }
]);

// Computed properties
const overallScore = computed(() => {
  const scores = [
    metrics.standardization_score,
    metrics.data_completeness_score,
    metrics.facebook_capi_score
  ];
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
});

const eventCategories = computed(() => {
  // Mock distribution - in real app, calculate from actual data
  const total = metrics.total_events_today || 1;
  return [
    {
      key: 'navigation',
      name: 'Navigation',
      icon: EVENT_CATEGORIES.NAVIGATION.icon,
      color: EVENT_CATEGORIES.NAVIGATION.color,
      count: 456,
      percentage: (456 / total) * 100
    },
    {
      key: 'ecommerce',
      name: 'E-commerce',
      icon: EVENT_CATEGORIES.ECOMMERCE.icon,
      color: EVENT_CATEGORIES.ECOMMERCE.color,
      count: 342,
      percentage: (342 / total) * 100
    },
    {
      key: 'engagement',
      name: 'Engagement',
      icon: EVENT_CATEGORIES.ENGAGEMENT.icon,
      color: EVENT_CATEGORIES.ENGAGEMENT.color,
      count: 289,
      percentage: (289 / total) * 100
    },
    {
      key: 'conversion',
      name: 'Conversion',
      icon: EVENT_CATEGORIES.CONVERSION.icon,
      color: EVENT_CATEGORIES.CONVERSION.color,
      count: 160,
      percentage: (160 / total) * 100
    }
  ];
});

// Methods
const getScoreColor = (score) => {
  if (score >= 90) return 'green';
  if (score >= 70) return 'orange';
  return 'red';
};

const getIssueIcon = (severity) => {
  switch (severity) {
    case 'error': return 'mdi-alert-circle';
    case 'warning': return 'mdi-alert';
    case 'info': return 'mdi-information';
    default: return 'mdi-help-circle';
  }
};

const getIssueColor = (severity) => {
  switch (severity) {
    case 'error': return 'red';
    case 'warning': return 'orange';
    case 'info': return 'blue';
    default: return 'grey';
  }
};

const getSourceStatusColor = (status) => {
  switch (status) {
    case 'healthy': return 'green';
    case 'warning': return 'orange';
    case 'error': return 'red';
    default: return 'grey';
  }
};

const getPerformanceScore = (value, threshold) => {
  return Math.max(0, Math.min(100, ((threshold - value) / threshold) * 100));
};

const getPerformanceColor = (value, threshold) => {
  const score = getPerformanceScore(value, threshold);
  if (score >= 80) return 'green';
  if (score >= 60) return 'orange';
  return 'red';
};

const formatTime = (timestamp) => {
  const now = new Date();
  const diff = now - new Date(timestamp);
  const minutes = Math.floor(diff / 1000 / 60);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const refreshMetrics = async () => {
  loading.value = true;
  try {
    // In real app, fetch from API
    // const response = await websiteStore.getQualityMetrics(props.websiteId);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data update
    metrics.total_events_today += Math.floor(Math.random() * 10);
    metrics.valid_events_today = Math.floor(metrics.total_events_today * 0.95);
    metrics.facebook_ready_today = Math.floor(metrics.valid_events_today * 0.85);
    
    console.log('Quality metrics refreshed');
  } catch (error) {
    console.error('Failed to refresh quality metrics:', error);
  } finally {
    loading.value = false;
  }
};

const exportReport = () => {
  // Generate and download quality report
  const report = {
    website_id: props.websiteId,
    timestamp: new Date().toISOString(),
    overall_score: overallScore.value,
    metrics: metrics,
    performance: performance,
    issues: issues.value,
    data_sources: dataSources.value
  };
  
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quality-report-${props.websiteId}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const resolveIssue = (issue) => {
  // Handle issue resolution
  console.log('Resolving issue:', issue.id);
  issues.value = issues.value.filter(i => i.id !== issue.id);
};

const startAutoRefresh = () => {
  if (refreshTimer) clearInterval(refreshTimer);
  if (progressTimer) clearInterval(progressTimer);
  
  if (!autoRefresh.value) return;
  
  refreshProgress.value = 0;
  
  // Start refresh timer
  refreshTimer = setInterval(() => {
    refreshMetrics();
    refreshProgress.value = 0;
  }, refreshInterval.value * 1000);
  
  // Start progress timer
  progressTimer = setInterval(() => {
    refreshProgress.value += (100 / refreshInterval.value);
    if (refreshProgress.value >= 100) {
      refreshProgress.value = 0;
    }
  }, 1000);
};

// Lifecycle
onMounted(() => {
  refreshMetrics();
  startAutoRefresh();
});

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
  if (progressTimer) clearInterval(progressTimer);
});

// Watch for settings changes
import { watch } from 'vue';
watch([autoRefresh, refreshInterval], () => {
  startAutoRefresh();
});
</script>

<style scoped>
.data-quality-monitor {
  padding: 0;
}

/* Header */
.monitor-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.header-title {
  font-size: 1.5em;
  font-weight: 600;
  margin-bottom: 4px;
}

.header-subtitle {
  opacity: 0.9;
  font-size: 1em;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.refresh-status {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.8;
  font-size: 0.875rem;
}

.refresh-progress {
  flex: 1;
  min-width: 100px;
}

/* Quality Score Card */
.quality-score-card {
  margin-bottom: 24px;
  border-radius: 16px !important;
}

.quality-score-content {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 16px;
}

.score-circle {
  flex-shrink: 0;
}

.score-text {
  text-align: center;
}

.score-number {
  font-size: 2em;
  font-weight: 700;
  color: #111827;
}

.score-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.score-details {
  flex: 1;
}

.score-breakdown {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.breakdown-content {
  flex: 1;
}

.breakdown-label {
  font-weight: 500;
  color: #111827;
  margin-bottom: 2px;
}

.breakdown-value {
  font-size: 0.875rem;
  color: #6b7280;
}

.score-summary {
  display: flex;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.summary-stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5em;
  font-weight: 600;
  color: #111827;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.metric-card {
  border-radius: 12px !important;
}

.metric-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1em;
  font-weight: 600;
  padding: 16px 16px 8px 16px;
}

.title-icon {
  color: #6b7280;
}

/* Event Distribution */
.event-distribution {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-name {
  flex: 1;
  font-weight: 500;
}

.category-count {
  font-weight: 600;
  color: #111827;
}

.category-progress {
  border-radius: 2px;
}

/* Issues */
.no-issues {
  text-align: center;
  padding: 32px;
  color: #6b7280;
}

.no-issues-text {
  margin-top: 8px;
  font-weight: 500;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.issue-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.issue-item.error {
  border-color: #fca5a5;
  background: #fef2f2;
}

.issue-item.warning {
  border-color: #fcd34d;
  background: #fffbeb;
}

.issue-item.info {
  border-color: #93c5fd;
  background: #eff6ff;
}

.issue-content {
  flex: 1;
}

.issue-title {
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
}

.issue-description {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: 4px;
}

.issue-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* Data Sources */
.data-sources {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.source-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.source-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.source-info {
  flex: 1;
}

.source-name {
  font-weight: 500;
  color: #111827;
}

.source-description {
  font-size: 0.875rem;
  color: #6b7280;
}

.source-metrics {
  display: flex;
  gap: 16px;
  margin-left: 32px;
}

.source-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  font-weight: 500;
}

.metric-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

/* Performance */
.performance-metrics {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.perf-metric {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.perf-value {
  font-size: 1.5em;
  font-weight: 600;
  color: #111827;
}

.perf-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 4px;
}

/* Responsive */
@media (max-width: 768px) {
  .quality-score-content {
    flex-direction: column;
    text-align: center;
    gap: 24px;
  }
  
  .score-summary {
    flex-direction: column;
    gap: 16px;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .source-metrics {
    margin-left: 0;
    flex-direction: column;
    gap: 8px;
  }
}
</style>