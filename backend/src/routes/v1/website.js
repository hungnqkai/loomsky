/*
File: src/routes/v1/website.js
- File route mới, chịu trách nhiệm cho tất cả các endpoint liên quan đến quản lý website và cấu hình tracking.
- Tất cả các route ở đây đều yêu cầu xác thực.
*/
'use strict';
const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const websiteValidators = require('../../validators/websiteValidators');
const websiteController = require('../../controllers/websiteController');
const qualityController = require('../../controllers/qualityController');
const eventTriggerController = require('../../controllers/eventTriggerController');

const router = express.Router();

// Áp dụng middleware xác thực cho tất cả các route trong file này
router.use(authenticateToken);

// --- Routes cho Website ---
router.route('/')
  .post(validate(websiteValidators.createWebsiteSchema), websiteController.createWebsite)
  .get(websiteController.getWebsites);

router.route('/:websiteId')
  .get(validate(websiteValidators.getWebsiteSchema), websiteController.getWebsiteById)
  .put(validate(websiteValidators.updateWebsiteSchema), websiteController.updateWebsite)
  .delete(validate(websiteValidators.deleteWebsiteSchema), websiteController.deleteWebsite);

// --- Routes cho Data Mappings (MỚI) ---
router.route('/:websiteId/datamaps')
  .get(validate(websiteValidators.getWebsiteSchema), websiteController.getDataMappings)
  .post(validate(websiteValidators.createDataMappingSchema), websiteController.addDataMapping);

router.route('/:websiteId/datamaps/:mapId')
  .delete(validate(websiteValidators.deleteDataMappingSchema), websiteController.deleteDataMapping);

// --- Routes cho Event Triggers (MỚI) - Đặt trước để tránh conflict ---
router.route('/:websiteId/pixels/:pixelId/triggers/bulk-toggle')
  .post(validate(websiteValidators.bulkToggleTriggersSchema), eventTriggerController.bulkToggleTriggers);

router.route('/:websiteId/pixels/:pixelId/triggers/:id')
  .put(validate(websiteValidators.updateEventTriggerSchema), eventTriggerController.updateTrigger)
  .delete(validate(websiteValidators.deleteEventTriggerSchema), eventTriggerController.deleteTrigger);

router.route('/:websiteId/pixels/:pixelId/triggers')
  .get(validate(websiteValidators.getWebsitePixelSchema), eventTriggerController.getTriggersForWebsitePixel)
  .post(validate(websiteValidators.createEventTriggerSchema), eventTriggerController.createTrigger);

// --- Routes cho Pixels (thuộc một Website) ---
router.route('/:websiteId/pixels/:pixelId')
  .put(validate(websiteValidators.updatePixelSchema), websiteController.updatePixel)
  .delete(validate(websiteValidators.deletePixelSchema), websiteController.deletePixel);

router.route('/:websiteId/pixels')
  .post(validate(websiteValidators.createPixelSchema), websiteController.addPixel)
  .get(validate(websiteValidators.getWebsiteSchema), websiteController.getPixels);

// --- Routes cho Event Filters ---
router.route('/:websiteId/event-filters')
    .post(validate(websiteValidators.createEventFilterSchema), websiteController.addEventFilter)
    .get(validate(websiteValidators.getWebsiteSchema), websiteController.getEventFilters);

router.route('/:websiteId/event-filters/:filterId')
    .put(validate(websiteValidators.updateEventFilterSchema), websiteController.updateEventFilter)
    .delete(validate(websiteValidators.deleteEventFilterSchema), websiteController.deleteEventFilter);

// --- Routes cho Blacklist ---
router.route('/:websiteId/blacklist')
    .post(validate(websiteValidators.createBlacklistSchema), websiteController.addBlacklistEntry)
    .get(validate(websiteValidators.getWebsiteSchema), websiteController.getBlacklist);

router.route('/:websiteId/blacklist/:blacklistId')
    .delete(validate(websiteValidators.deleteBlacklistSchema), websiteController.deleteBlacklistEntry);

// --- Routes cho Connection Status và Dashboard Stats ---
router.route('/:websiteId/connection-status')
    .get(validate(websiteValidators.getWebsiteSchema), websiteController.getConnectionStatus);

router.route('/:websiteId/dashboard-stats')
    .get(validate(websiteValidators.getWebsiteSchema), websiteController.getDashboardStats);

// --- Routes cho Quality Metrics và Data Validation ---
router.route('/:websiteId/quality-metrics')
    .get(validate(websiteValidators.getWebsiteSchema), qualityController.getQualityMetrics);

router.route('/:websiteId/performance-metrics')
    .get(validate(websiteValidators.getWebsiteSchema), qualityController.getPerformanceMetrics);

router.route('/:websiteId/quality-alerts')
    .get(validate(websiteValidators.getWebsiteSchema), qualityController.getQualityAlerts);

router.route('/:websiteId/quality-alerts/:alertId/acknowledge')
    .patch(validate(websiteValidators.getWebsiteSchema), qualityController.acknowledgeAlert);

router.route('/:websiteId/event-distribution')
    .get(validate(websiteValidators.getWebsiteSchema), qualityController.getEventDistribution);

router.route('/:websiteId/data-source-health')
    .get(validate(websiteValidators.getWebsiteSchema), qualityController.getDataSourceHealth);

module.exports = router;