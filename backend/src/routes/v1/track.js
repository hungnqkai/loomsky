/*
File: src/routes/v1/track.js (MỚI)
- File route mới, public, dành riêng cho endpoint nhận sự kiện.
*/
'use strict';
const express = require('express');
const { validate } = require('../../middleware/validation');
const trackValidators = require('../../validators/trackValidators');
const trackController = require('../../controllers/trackController');

const router = express.Router();

// Endpoint này được SDK gọi để gửi dữ liệu tracking
router.post('/event', validate(trackValidators.trackEventSchema), trackController.trackEvent);

module.exports = router;