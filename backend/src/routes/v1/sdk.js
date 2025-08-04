/*
File: src/routes/v1/sdk.js (MỚI)
- File route mới, public, dành cho các endpoint mà SDK và Plugin sẽ gọi.
*/
'use strict';
const express = require('express');
const { validate } = require('../../middleware/validation');
const sdkValidators = require('../../validators/sdkValidators');
const sdkController = require('../../controllers/sdkController');

const router = express.Router();

// Endpoint này được gọi bởi Plugin WordPress để kiểm tra kết nối
router.post('/verify', validate(sdkValidators.verifyApiKeySchema), sdkController.verifyApiKey);

// Endpoint này sẽ được SDK gọi để lấy toàn bộ cấu hình tracking
router.get('/config', sdkController.getConfig);

module.exports = router;