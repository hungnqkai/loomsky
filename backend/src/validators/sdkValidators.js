/*
File: src/validators/sdkValidators.js (CẬP NHẬT)
- Thêm schema validation cho luồng xác thực của Visual Data Mapper.
*/
'use strict';
const Joi = require('joi');

const verifyApiKeySchema = {
    body: Joi.object({
        apiKey: Joi.string().required(),
    }),
};

// --- Schemas cho Visual Data Mapper (MỚI) ---

const initSetupSchema = {
    body: Joi.object({
        websiteId: Joi.string().uuid().required(),
    }),
};

const verifySetupSchema = {
    body: Joi.object({
        token: Joi.string().uuid().required(),
    }),
};


module.exports = {
    verifyApiKeySchema,
    initSetupSchema,      // Export schema mới
    verifySetupSchema,      // Export schema mới
};