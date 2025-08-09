/*
File: src/routes/v1/sdk.js (MỚI)
- File route mới, public, dành cho các endpoint mà SDK và Plugin sẽ gọi.
*/
'use strict';
const express = require('express');
const { validate } = require('../../middleware/validation');
const sdkValidators = require('../../validators/sdkValidators');
const sdkController = require('../../controllers/sdkController');
const eventTriggerController = require('../../controllers/eventTriggerController');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// --- Routes cho Visual Data Mapper (MỚI) ---

// Endpoint này được frontend gọi khi người dùng click "Thiết lập"
// Yêu cầu đăng nhập để đảm bảo chỉ người dùng có quyền mới tạo được token
router.post('/init-setup', authenticateToken, validate(sdkValidators.initSetupSchema), sdkController.initSetupSession);

// Endpoint này được SDK trên trang khách hàng gọi để xác thực token
// Không yêu cầu đăng nhập, vì nó dùng token để xác thực
router.post('/verify-setup', validate(sdkValidators.verifySetupSchema), sdkController.verifySetupSession);


// Endpoint này được gọi bởi Plugin WordPress để kiểm tra kết nối
router.post('/verify', validate(sdkValidators.verifyApiKeySchema), sdkController.verifyApiKey);

// Endpoint này sẽ được SDK gọi để lấy toàn bộ cấu hình tracking
router.get('/config', sdkController.getConfig);

// --- Routes cho Event Triggers (SDK Config) ---
// Endpoint này được SDK gọi để lấy triggers cho pixel cụ thể
router.get('/pixels/:pixelId/triggers', eventTriggerController.getTriggersForPixel);

// --- Routes cho Event Triggers Setup Tool ---
// Endpoint này được gọi từ trigger setup tool (sử dụng setup token)
router.post('/websites/:websiteId/pixels/:pixelId/triggers', eventTriggerController.createTriggerFromSetupTool);

module.exports = router;