/*
File: src/stores/websiteStore.js (CẬP NHẬT)
- Bổ sung đầy đủ các action cho việc CRUD Event Filters và Blacklist.
*/
import { defineStore } from 'pinia';
import { ref } from 'vue';
import websiteService from '../services/websiteService';
import eventTriggerService from '../services/eventTriggerService';

export const useWebsiteStore = defineStore('website', () => {
  // --- STATE ---
  const websites = ref([]);
  const currentWebsite = ref(null);
  const pixels = ref([]);
  const eventFilters = ref([]);
  const blacklist = ref([]);
  const dataMappings = ref([]);
  const eventTriggers = ref([]);
  const connectionStatus = ref(null);
  const dashboardStats = ref(null);
  // Quality metrics state
  const qualityMetrics = ref(null);
  const performanceMetrics = ref(null);
  const qualityAlerts = ref([]);
  const loading = ref(false);
  const actionLoading = ref(false); // Loading riêng cho các hành động nhỏ
  const error = ref(null);
  const successMessage = ref(null);

  // --- ACTIONS ---
  function clearMessages() {
    error.value = null;
    successMessage.value = null;
  }

  // === Website Actions ===
  async function fetchWebsites() {
    loading.value = true;
    clearMessages();
    try {
      const response = await websiteService.getWebsites();
      websites.value = response.data.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Không thể tải danh sách website.';
    } finally {
      loading.value = false;
    }
  }

  async function createWebsite(data) {
    loading.value = true;
    clearMessages();
    try {
      const response = await websiteService.createWebsite(data);
      websites.value.unshift(response.data.data);
      successMessage.value = 'Tạo website thành công!';
      return response.data.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Tạo website thất bại.';
      return null;
    } finally {
      loading.value = false;
    }
  }
  
  async function fetchWebsiteById(websiteId) {
    loading.value = true;
    currentWebsite.value = null;
    clearMessages();
    try {
      const response = await websiteService.getWebsiteById(websiteId);
      currentWebsite.value = response.data.data;
      // Tải song song tất cả dữ liệu con
      await Promise.all([
        fetchPixels(websiteId),
        fetchEventFilters(websiteId),
        fetchBlacklist(websiteId),
        fetchDataMappings(websiteId),
        fetchConnectionStatus(websiteId),
        fetchDashboardStats(websiteId)
      ]);
    } catch (err) {
      error.value = err.response?.data?.error || 'Không tìm thấy website.';
    } finally {
      loading.value = false;
    }
  }

  async function deleteWebsite(websiteId) {
    actionLoading.value = true;
    clearMessages();
    try {
        await websiteService.deleteWebsite(websiteId);
        const index = websites.value.findIndex(w => w.id === websiteId);
        if (index > -1) websites.value.splice(index, 1);
        successMessage.value = 'Xóa website thành công!';
        return true;
    } catch (err) {
        error.value = err.response?.data?.error || 'Xóa website thất bại.';
        return false;
    } finally {
        actionLoading.value = false;
    }
  }

  // === Data Mapping Actions (MỚI) ===
  async function fetchDataMappings(websiteId) {
    try {
      const response = await websiteService.getDataMappings(websiteId);
      dataMappings.value = response.data.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Không thể tải Data Mappings.';
    }
  }

  async function initSetupSession(websiteId) {
    actionLoading.value = true;
    clearMessages();
    try {
      const response = await websiteService.initSetupSession(websiteId);
      return response.data.data.setup_token;
    } catch (err) {
      error.value = err.response?.data?.error || 'Không thể khởi tạo phiên thiết lập.';
      return null;
    } finally {
      actionLoading.value = false;
    }
  }

  async function addDataMapping(websiteId, mappingData) {
    if (!websiteId || !mappingData) {
        console.error('Lỗi store: websiteId hoặc mappingData bị thiếu.');
        return;
      }
      
      try {
        // Gọi đến service và truyền cả hai tham số
        const newMapping = await websiteService.addDataMapping(websiteId, mappingData);
        
        console.log('Lưu mapping thành công từ store, dữ liệu trả về:', newMapping);
        
        // (Tùy chọn) Thêm logic để cập nhật state, ví dụ:
        // if (this.currentWebsite && this.currentWebsite.DataMappings) {
        //   this.currentWebsite.DataMappings.push(newMapping);
        // }
        
        return newMapping;
      } catch (error) {
        console.error('Lỗi trong action addDataMapping:', error);
        // Ném lỗi ra để component có thể bắt được
        throw error;
      }
    }

   async function deleteDataMapping(websiteId, mapId) {
    actionLoading.value = true;
    clearMessages();
    try {
      await websiteService.deleteDataMapping(websiteId, mapId);
      const index = dataMappings.value.findIndex(m => m.id === mapId);
      if (index > -1) dataMappings.value.splice(index, 1);
      successMessage.value = 'Xóa ánh xạ thành công!';
      return true;
    } catch (err) {
      error.value = err.response?.data?.error || 'Xóa ánh xạ thất bại.';
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  // === Pixel Actions ===
  async function fetchPixels(websiteId) {
      try {
          const response = await websiteService.getPixels(websiteId);
          pixels.value = response.data.data;
      } catch (err) {
          error.value = err.response?.data?.error || 'Không thể tải danh sách pixel.';
      }
  }

  async function addPixel(websiteId, data) {
      actionLoading.value = true;
      clearMessages();
      try {
          const response = await websiteService.addPixel(websiteId, data);
          pixels.value.push(response.data.data);
          successMessage.value = 'Thêm Pixel thành công!';
          return true;
      } catch (err) {
          error.value = err.response?.data?.error || 'Thêm Pixel thất bại.';
          return false;
      } finally {
          actionLoading.value = false;
      }
  }

  async function updatePixel(websiteId, pixelId, data) {
    actionLoading.value = true;
    clearMessages();
    try {
        const response = await websiteService.updatePixel(websiteId, pixelId, data);
        const index = pixels.value.findIndex(p => p.id === pixelId);
        if (index > -1) pixels.value[index] = response.data.data;
        successMessage.value = 'Cập nhật Pixel thành công!';
        return true;
    } catch (err) {
        error.value = err.response?.data?.error || 'Cập nhật Pixel thất bại.';
        return false;
    } finally {
        actionLoading.value = false;
    }
  }

  async function deletePixel(websiteId, pixelId) {
    actionLoading.value = true;
    clearMessages();
    try {
        await websiteService.deletePixel(websiteId, pixelId);
        const index = pixels.value.findIndex(p => p.id === pixelId);
        if (index > -1) pixels.value.splice(index, 1);
        successMessage.value = 'Xóa Pixel thành công!';
        return true;
    } catch (err) {
        error.value = err.response?.data?.error || 'Xóa Pixel thất bại.';
        return false;
    } finally {
        actionLoading.value = false;
    }
  }

  // === Event Filter Actions ===
  async function fetchEventFilters(websiteId) {
    try {
        const response = await websiteService.getEventFilters(websiteId);
        eventFilters.value = response.data.data;
    } catch (err) {
        error.value = err.response?.data?.error || 'Không thể tải bộ lọc sự kiện.';
    }
  }

  async function addEventFilter(websiteId, data) {
    actionLoading.value = true;
    clearMessages();
    try {
        const response = await websiteService.addEventFilter(websiteId, data);
        eventFilters.value.push(response.data.data);
        successMessage.value = 'Thêm bộ lọc thành công!';
        return true;
    } catch (err) {
        error.value = err.response?.data?.error || 'Thêm bộ lọc thất bại.';
        return false;
    } finally {
        actionLoading.value = false;
    }
  }

  async function deleteEventFilter(websiteId, filterId) {
    actionLoading.value = true;
    clearMessages();
    try {
        await websiteService.deleteEventFilter(websiteId, filterId);
        const index = eventFilters.value.findIndex(f => f.id === filterId);
        if (index > -1) eventFilters.value.splice(index, 1);
        successMessage.value = 'Xóa bộ lọc thành công!';
        return true;
    } catch (err) {
        error.value = err.response?.data?.error || 'Xóa bộ lọc thất bại.';
        return false;
    } finally {
        actionLoading.value = false;
    }
  }

  // === Blacklist Actions ===
  async function fetchBlacklist(websiteId) {
    try {
        const response = await websiteService.getBlacklist(websiteId);
        blacklist.value = response.data.data;
    } catch (err) {
        error.value = err.response?.data?.error || 'Không thể tải danh sách chặn.';
    }
  }

  async function addBlacklistEntry(websiteId, data) {
    actionLoading.value = true;
    clearMessages();
    try {
        const response = await websiteService.addBlacklistEntry(websiteId, data);
        blacklist.value.unshift(response.data.data);
        successMessage.value = 'Thêm vào danh sách chặn thành công!';
        return true;
    } catch (err) {
        error.value = err.response?.data?.error || 'Thêm vào danh sách chặn thất bại.';
        return false;
    } finally {
        actionLoading.value = false;
    }
  }

  async function deleteBlacklistEntry(websiteId, blacklistId) {
    actionLoading.value = true;
    clearMessages();
    try {
        await websiteService.deleteBlacklistEntry(websiteId, blacklistId);
        const index = blacklist.value.findIndex(b => b.id === blacklistId);
        if (index > -1) blacklist.value.splice(index, 1);
        successMessage.value = 'Xóa khỏi danh sách chặn thành công!';
        return true;
    } catch (err) {
        error.value = err.response?.data?.error || 'Xóa khỏi danh sách chặn thất bại.';
        return false;
    } finally {
        actionLoading.value = false;
    }
  }

  // === Connection Status & Dashboard Stats Actions (MỚI) ===
  async function fetchConnectionStatus(websiteId) {
    try {
      const response = await websiteService.getConnectionStatus(websiteId);
      connectionStatus.value = response.data.data;
    } catch (err) {
      console.error('Không thể tải trạng thái kết nối:', err);
    }
  }

  async function fetchDashboardStats(websiteId) {
    try {
      const response = await websiteService.getDashboardStats(websiteId);
      dashboardStats.value = response.data.data;
    } catch (err) {
      console.error('Không thể tải thống kê dashboard:', err);
    }
  }

  // Refresh both status and stats
  async function refreshWebsiteStatus(websiteId) {
    await Promise.all([
      fetchConnectionStatus(websiteId),
      fetchDashboardStats(websiteId)
    ]);
  }

  // === Quality Metrics Actions (NEW) ===
  async function fetchQualityMetrics(websiteId, timeWindow = 60) {
    try {
      const response = await websiteService.getQualityMetrics(websiteId, timeWindow);
      qualityMetrics.value = response.data.data;
      return qualityMetrics.value;
    } catch (err) {
      console.error('Failed to load quality metrics:', err);
      error.value = err.response?.data?.error || 'Cannot load quality metrics.';
      return null;
    }
  }

  async function fetchPerformanceMetrics(websiteId, timeWindow = 60) {
    try {
      const response = await websiteService.getPerformanceMetrics(websiteId, timeWindow);
      performanceMetrics.value = response.data.data;
      return performanceMetrics.value;
    } catch (err) {
      console.error('Failed to load performance metrics:', err);
      error.value = err.response?.data?.error || 'Cannot load performance metrics.';
      return null;
    }
  }

  async function fetchQualityAlerts(websiteId, activeOnly = true) {
    try {
      const response = await websiteService.getQualityAlerts(websiteId, activeOnly);
      qualityAlerts.value = response.data.data;
      return qualityAlerts.value;
    } catch (err) {
      console.error('Failed to load quality alerts:', err);
      error.value = err.response?.data?.error || 'Cannot load quality alerts.';
      return null;
    }
  }

  async function getEventDistribution(websiteId, timeWindow = 60) {
    try {
      const response = await websiteService.getEventDistribution(websiteId, timeWindow);
      return response.data.data;
    } catch (err) {
      console.error('Failed to load event distribution:', err);
      error.value = err.response?.data?.error || 'Cannot load event distribution.';
      return null;
    }
  }

  async function getDataSourceHealth(websiteId) {
    try {
      const response = await websiteService.getDataSourceHealth(websiteId);
      return response.data.data;
    } catch (err) {
      console.error('Failed to load data source health:', err);
      error.value = err.response?.data?.error || 'Cannot load data source health.';
      return null;
    }
  }

  async function generateQualityReport(websiteId, timeRange = '24h') {
    actionLoading.value = true;
    clearMessages();
    try {
      const response = await websiteService.generateQualityReport(websiteId, timeRange);
      successMessage.value = 'Quality report generated successfully!';
      return response.data.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to generate quality report.';
      return null;
    } finally {
      actionLoading.value = false;
    }
  }

  async function acknowledgeAlert(websiteId, alertId) {
    actionLoading.value = true;
    clearMessages();
    try {
      await websiteService.acknowledgeAlert(websiteId, alertId);
      // Update local state
      const alert = qualityAlerts.value.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        alert.acknowledged_at = new Date().toISOString();
      }
      successMessage.value = 'Alert acknowledged successfully!';
      return true;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to acknowledge alert.';
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  // Comprehensive quality monitoring refresh
  async function refreshQualityMonitoring(websiteId) {
    loading.value = true;
    clearMessages();
    try {
      await Promise.all([
        fetchQualityMetrics(websiteId),
        fetchPerformanceMetrics(websiteId),
        fetchQualityAlerts(websiteId)
      ]);
    } catch (err) {
      error.value = 'Failed to refresh quality monitoring data.';
    } finally {
      loading.value = false;
    }
  }

  // Real-time quality monitoring setup
  function setupQualityMonitoring(websiteId, interval = 30000) {
    const monitoringInterval = setInterval(async () => {
      try {
        await Promise.all([
          fetchQualityMetrics(websiteId, 60),
          fetchQualityAlerts(websiteId, true) // Only active alerts
        ]);
      } catch (err) {
        console.error('Quality monitoring update failed:', err);
      }
    }, interval);

    // Return cleanup function
    return () => clearInterval(monitoringInterval);
  }

  // Calculate overall quality score from metrics
  function getOverallQualityScore() {
    if (!qualityMetrics.value) return 0;
    
    const metrics = qualityMetrics.value;
    const scores = [
      metrics.standardization_score || 0,
      metrics.data_completeness_score || 0,
      metrics.facebook_capi_score || 0
    ].filter(score => score > 0);
    
    return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  }

  // Get critical alerts count
  function getCriticalAlertsCount() {
    if (!qualityAlerts.value) return 0;
    return qualityAlerts.value.filter(alert => 
      alert.severity === 'critical' && 
      alert.active && 
      !alert.acknowledged
    ).length;
  }

  // Get quality status color
  function getQualityStatusColor() {
    const score = getOverallQualityScore();
    if (score >= 90) return 'green';
    if (score >= 70) return 'orange';
    return 'red';
  }

  // === Event Triggers Actions ===
  async function fetchEventTriggers(websiteId, pixelId, params = {}) {
    clearMessages();
    try {
      const response = await eventTriggerService.getTriggersForWebsitePixel(websiteId, pixelId, params);
      // Update triggers for this specific pixel
      if (response.success) {
        return response.data.triggers;
      }
      return [];
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch event triggers.';
      return [];
    }
  }

  async function createEventTrigger(websiteId, pixelId, triggerData) {
    actionLoading.value = true;
    clearMessages();
    try {
      const response = await eventTriggerService.createTrigger(websiteId, pixelId, triggerData);
      if (response.success) {
        successMessage.value = 'Event trigger created successfully!';
        return response.data;
      }
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create event trigger.';
      throw err;
    } finally {
      actionLoading.value = false;
    }
  }

  async function updateEventTrigger(websiteId, pixelId, triggerId, updateData) {
    clearMessages();
    try {
      const response = await eventTriggerService.updateTrigger(websiteId, pixelId, triggerId, updateData);
      if (response.success) {
        successMessage.value = 'Event trigger updated successfully!';
        return response.data;
      }
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update event trigger.';
      throw err;
    }
  }

  async function deleteEventTrigger(websiteId, pixelId, triggerId) {
    actionLoading.value = true;
    clearMessages();
    try {
      const response = await eventTriggerService.deleteTrigger(websiteId, pixelId, triggerId);
      if (response.success) {
        successMessage.value = 'Event trigger deleted successfully!';
        return true;
      }
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete event trigger.';
      throw err;
    } finally {
      actionLoading.value = false;
    }
  }

  async function bulkToggleEventTriggers(websiteId, pixelId, triggerIds, enabled) {
    actionLoading.value = true;
    clearMessages();
    try {
      const response = await eventTriggerService.bulkToggleTriggers(websiteId, pixelId, {
        trigger_ids: triggerIds,
        enabled
      });
      if (response.success) {
        const action = enabled ? 'enabled' : 'disabled';
        successMessage.value = `${response.data.updated_count} triggers ${action} successfully!`;
        return response.data;
      }
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update triggers.';
      throw err;
    } finally {
      actionLoading.value = false;
    }
  }

  async function initTriggerSetupSession(websiteId, pixelId) {
    actionLoading.value = true;
    clearMessages();
    try {
      const response = await eventTriggerService.initTriggerSetupSession(websiteId, pixelId);
      if (response.success) {
        return response.data;
      }
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to initialize trigger setup session.';
      throw err;
    } finally {
      actionLoading.value = false;
    }
  }

  // Export quality data
  async function exportQualityData(websiteId, format = 'json', timeRange = '24h') {
    actionLoading.value = true;
    clearMessages();
    try {
      const response = await websiteService.exportQualityData(websiteId, format, timeRange);
      
      // Create download
      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quality-data-${websiteId}-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      
      successMessage.value = 'Quality data exported successfully!';
      return true;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to export quality data.';
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  return {
    // State
    websites, currentWebsite, pixels, eventFilters, blacklist, dataMappings, eventTriggers,
    connectionStatus, dashboardStats, qualityMetrics, performanceMetrics, qualityAlerts,
    loading, actionLoading, error, successMessage,
    
    // Core actions
    clearMessages, fetchWebsites, createWebsite, fetchWebsiteById, deleteWebsite,
    fetchPixels, addPixel, updatePixel, deletePixel,
    fetchEventFilters, addEventFilter, deleteEventFilter,
    fetchBlacklist, addBlacklistEntry, deleteBlacklistEntry,
    fetchDataMappings, initSetupSession, addDataMapping, deleteDataMapping,
    fetchConnectionStatus, fetchDashboardStats, refreshWebsiteStatus,
    
    // Event Triggers actions
    fetchEventTriggers, createEventTrigger, updateEventTrigger, deleteEventTrigger,
    bulkToggleEventTriggers, initTriggerSetupSession,
    
    // Quality metrics actions
    fetchQualityMetrics, fetchPerformanceMetrics, fetchQualityAlerts,
    getEventDistribution, getDataSourceHealth, generateQualityReport,
    acknowledgeAlert, refreshQualityMonitoring, setupQualityMonitoring,
    
    // Computed helpers
    getOverallQualityScore, getCriticalAlertsCount, getQualityStatusColor,
    
    // Utility actions
    exportQualityData
  };
});