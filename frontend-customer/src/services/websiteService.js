/*
File: src/services/websiteService.js (MỚI)
- Service mới để giao tiếp với các API /api/v1/websites mà chúng ta vừa tạo.
*/
import api from './api';

const websiteService = {
  // === Website ===
  getWebsites: () => api.get('/websites'),
  createWebsite: (data) => api.post('/websites', data),
  getWebsiteById: (websiteId) => api.get(`/websites/${websiteId}`),
  updateWebsite: (websiteId, data) => api.put(`/websites/${websiteId}`, data),
  deleteWebsite: (websiteId) => api.delete(`/websites/${websiteId}`),

  // === Data Mappings (MỚI) ===
  getDataMappings: (websiteId) => api.get(`/websites/${websiteId}/datamaps`),
  addDataMapping: (websiteId, data) => api.post(`/websites/${websiteId}/datamaps`, data),
  deleteDataMapping: (websiteId, mapId) => api.delete(`/websites/${websiteId}/datamaps/${mapId}`),

  // === Setup Session (MỚI) ===
  initSetupSession: (websiteId) => api.post('/sdk/init-setup', { websiteId }),

  // === Pixels ===
  getPixels: (websiteId) => api.get(`/websites/${websiteId}/pixels`),
  addPixel: (websiteId, data) => api.post(`/websites/${websiteId}/pixels`, data),
  updatePixel: (websiteId, pixelId, data) => api.put(`/websites/${websiteId}/pixels/${pixelId}`, data),
  deletePixel: (websiteId, pixelId) => api.delete(`/websites/${websiteId}/pixels/${pixelId}`),

  // === Event Filters ===
  getEventFilters: (websiteId) => api.get(`/websites/${websiteId}/event-filters`),
  addEventFilter: (websiteId, data) => api.post(`/websites/${websiteId}/event-filters`, data),
  updateEventFilter: (websiteId, filterId, data) => api.put(`/websites/${websiteId}/event-filters/${filterId}`, data),
  deleteEventFilter: (websiteId, filterId) => api.delete(`/websites/${websiteId}/event-filters/${filterId}`),

  // === Blacklist ===
  getBlacklist: (websiteId) => api.get(`/websites/${websiteId}/blacklist`),
  addBlacklistEntry: (websiteId, data) => api.post(`/websites/${websiteId}/blacklist`, data),
  deleteBlacklistEntry: (websiteId, blacklistId) => api.delete(`/websites/${websiteId}/blacklist/${blacklistId}`),

  // === Connection Status & Dashboard Stats (MỚI) ===
  getConnectionStatus: (websiteId) => api.get(`/websites/${websiteId}/connection-status`),
  getDashboardStats: (websiteId) => api.get(`/websites/${websiteId}/dashboard-stats`),

  // === Quality Metrics (NEW) ===
  getQualityMetrics: (websiteId, timeWindow = 60) => 
    api.get(`/websites/${websiteId}/quality-metrics?timeWindow=${timeWindow}`),
  
  getPerformanceMetrics: (websiteId, timeWindow = 60) => 
    api.get(`/websites/${websiteId}/performance-metrics?timeWindow=${timeWindow}`),
  
  getQualityAlerts: (websiteId, activeOnly = true) => 
    api.get(`/websites/${websiteId}/quality-alerts?activeOnly=${activeOnly}`),
  
  getEventDistribution: (websiteId, timeWindow = 60) => 
    api.get(`/websites/${websiteId}/event-distribution?timeWindow=${timeWindow}`),
  
  getDataSourceHealth: (websiteId) => 
    api.get(`/websites/${websiteId}/data-source-health`),
  
  generateQualityReport: (websiteId, timeRange = '24h') => 
    api.post(`/websites/${websiteId}/quality-report`, { timeRange }),
  
  acknowledgeAlert: (websiteId, alertId) => 
    api.patch(`/websites/${websiteId}/quality-alerts/${alertId}/acknowledge`),
  
  exportQualityData: (websiteId, format = 'json', timeRange = '24h') => 
    api.get(`/websites/${websiteId}/quality-data/export?format=${format}&timeRange=${timeRange}`),
};

export default websiteService;