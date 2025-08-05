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

// --- Routes cho Pixels (thuộc một Website) ---
router.route('/:websiteId/pixels')
  .post(validate(websiteValidators.createPixelSchema), websiteController.addPixel)
  .get(validate(websiteValidators.getWebsiteSchema), websiteController.getPixels);

router.route('/:websiteId/pixels/:pixelId')
  .put(validate(websiteValidators.updatePixelSchema), websiteController.updatePixel)
  .delete(validate(websiteValidators.deletePixelSchema), websiteController.deletePixel);

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


module.exports = router;