/*
File: src/routes/v1/track.js (UPDATED)
- File route mới, public, dành riêng cho endpoint nhận sự kiện.
- Enhanced với event validation middleware và standardization
*/
'use strict';
const express = require('express');
const { validate } = require('../../middleware/validation');
const { eventValidation, qualityMetricsCollector, eventEnrichment } = require('../../middleware/eventValidation');
const trackValidators = require('../../validators/trackValidators');
const trackController = require('../../controllers/trackController');

const router = express.Router();

// Endpoint này được SDK gọi để gửi dữ liệu tracking
// Middleware chain: validation → event standardization → quality metrics → enrichment → controller
router.post('/event', 
  validate(trackValidators.trackEventSchema),
  eventValidation({ mode: 'soft', enableMigration: true, enablePerformanceTracking: true }),
  qualityMetricsCollector,
  eventEnrichment,
  trackController.trackEvent
);

module.exports = router;