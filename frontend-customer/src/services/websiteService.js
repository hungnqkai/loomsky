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
};

export default websiteService;