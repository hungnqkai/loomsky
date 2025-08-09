/*
File: src/services/eventTriggerService.js
- Service layer for Event Trigger API calls
- Handles all CRUD operations for event triggers
*/

import api from './api';

const eventTriggerService = {
  /**
   * Get all triggers for a website-pixel combination
   * @param {string} websiteId - Website ID
   * @param {string} pixelId - Pixel ID
   * @param {Object} params - Query parameters (page, limit, enabled, trigger_type)
   * @returns {Promise} API response with triggers list
   */
  async getTriggersForWebsitePixel(websiteId, pixelId, params = {}) {
    const response = await api.get(`/websites/${websiteId}/pixels/${pixelId}/triggers`, { params });
    return response.data;
  },

  /**
   * Get all triggers for a pixel (across all websites) - for SDK config
   * @param {string} pixelId - Pixel ID
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with grouped triggers
   */
  async getTriggersForPixel(pixelId, params = {}) {
    const response = await api.get(`/pixels/${pixelId}/triggers`, { params });
    return response.data;
  },

  /**
   * Create a new event trigger
   * @param {string} websiteId - Website ID
   * @param {string} pixelId - Pixel ID
   * @param {Object} triggerData - Trigger configuration
   * @returns {Promise} API response with created trigger
   */
  async createTrigger(websiteId, pixelId, triggerData) {
    const response = await api.post(`/websites/${websiteId}/pixels/${pixelId}/triggers`, triggerData);
    return response.data;
  },

  /**
   * Update an existing event trigger
   * @param {string} websiteId - Website ID
   * @param {string} pixelId - Pixel ID
   * @param {string} triggerId - Trigger ID
   * @param {Object} updateData - Data to update
   * @returns {Promise} API response with updated trigger
   */
  async updateTrigger(websiteId, pixelId, triggerId, updateData) {
    const response = await api.put(`/websites/${websiteId}/pixels/${pixelId}/triggers/${triggerId}`, updateData);
    return response.data;
  },

  /**
   * Delete an event trigger
   * @param {string} websiteId - Website ID
   * @param {string} pixelId - Pixel ID
   * @param {string} triggerId - Trigger ID
   * @returns {Promise} API response
   */
  async deleteTrigger(websiteId, pixelId, triggerId) {
    const response = await api.delete(`/websites/${websiteId}/pixels/${pixelId}/triggers/${triggerId}`);
    return response.data;
  },

  /**
   * Bulk enable/disable triggers
   * @param {string} websiteId - Website ID
   * @param {string} pixelId - Pixel ID
   * @param {Object} bulkData - { trigger_ids: [], enabled: boolean }
   * @returns {Promise} API response with update count
   */
  async bulkToggleTriggers(websiteId, pixelId, bulkData) {
    const response = await api.post(`/websites/${websiteId}/pixels/${pixelId}/triggers/bulk-toggle`, bulkData);
    return response.data;
  },

  /**
   * Initialize trigger setup session
   * @param {string} websiteId - Website ID
   * @param {string} pixelId - Pixel ID
   * @returns {Promise} API response with setup token
   */
  async initTriggerSetupSession(websiteId, pixelId) {
    console.log('EventTriggerService: Sending init-setup request:', { 
      websiteId, 
      pixelId, 
      setupType: 'triggers' 
    });
    const response = await api.post('/sdk/init-setup', { 
      websiteId,
      pixelId,
      setupType: 'triggers'  // Distinguish from data mapping setup
    });
    console.log('EventTriggerService: Init-setup response:', response.data);
    return response.data;
  },

  /**
   * Verify trigger setup token
   * @param {string} token - Setup token
   * @returns {Promise} API response with session data
   */
  async verifyTriggerSetupToken(token) {
    const response = await api.post('/sdk/verify-setup', { token });
    return response.data;
  }
};

export default eventTriggerService;