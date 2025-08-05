/*
File: src/validators/websiteValidators.js
- File validator mới, chứa các schema Joi để xác thực dữ liệu đầu vào cho các API quản lý website.
*/
'use strict';
const Joi = require('joi');

const paramsWebsiteId = {
    params: Joi.object({
        websiteId: Joi.string().uuid().required(),
    }),
};

const createWebsiteSchema = {
    body: Joi.object({
        name: Joi.string().min(3).max(100).required(),
        domain: Joi.string().domain().required(),
        platform_type: Joi.string().valid('wordpress', 'shopify', 'html', 'other').required(),
    }),
};

const updateWebsiteSchema = {
    ...paramsWebsiteId,
    body: Joi.object({
        name: Joi.string().min(3).max(100),
        domain: Joi.string().domain(),
        platform_type: Joi.string().valid('wordpress', 'shopify', 'html', 'other'),
    }).min(1), // Yêu cầu ít nhất một trường để cập nhật
};

// --- DATA MAPPING SCHEMAS (MỚI) ---
const createDataMappingSchema = {
    ...paramsWebsiteId,
    body: Joi.object({
        variable_name: Joi.string().min(3).max(50).required(),
        selector: Joi.string().min(1).max(1000).required(),
        page_context: Joi.string().min(3).max(50).optional().allow(null, ''),
    }),
};

const deleteDataMappingSchema = {
    params: Joi.object({
        websiteId: Joi.string().uuid().required(),
        mapId: Joi.string().uuid().required(),
    }),
};

const createPixelSchema = {
    ...paramsWebsiteId,
    body: Joi.object({
        pixel_id: Joi.string().pattern(/^(\d+)$/).required(),
        access_token: Joi.string().required(),
        activation_rules: Joi.array().items(Joi.object()).required(),
        tracking_config: Joi.object().required(),
    }),
};

const updatePixelSchema = {
    params: Joi.object({
        websiteId: Joi.string().uuid().required(),
        pixelId: Joi.string().uuid().required(),
    }),
    body: Joi.object({
        pixel_id: Joi.string().pattern(/^(\d+)$/),
        access_token: Joi.string(),
        activation_rules: Joi.array().items(Joi.object()),
        tracking_config: Joi.object(),
    }).min(1),
};

const createEventFilterSchema = {
    ...paramsWebsiteId,
    body: Joi.object({
        event_name: Joi.string().required(),
        rules: Joi.array().items(Joi.object({
            field: Joi.string().required(),
            operator: Joi.string().required(),
            value: Joi.any().required(),
        })).required(),
    }),
};

const updateEventFilterSchema = {
    params: Joi.object({
        websiteId: Joi.string().uuid().required(),
        filterId: Joi.string().uuid().required(),
    }),
    body: Joi.object({
        event_name: Joi.string(),
        rules: Joi.array().items(Joi.object()),
    }).min(1),
};

const createBlacklistSchema = {
    ...paramsWebsiteId,
    body: Joi.object({
        type: Joi.string().valid('ip', 'user_id', 'email', 'phone').required(),
        value: Joi.string().required(),
    }),
};

module.exports = {
    getWebsiteSchema: paramsWebsiteId,
    deleteWebsiteSchema: paramsWebsiteId,
    createWebsiteSchema,
    updateWebsiteSchema,
    createDataMappingSchema,
    deleteDataMappingSchema,
    createPixelSchema,
    updatePixelSchema,
    deletePixelSchema: { params: Joi.object({ websiteId: Joi.string().uuid().required(), pixelId: Joi.string().uuid().required() }) },
    createEventFilterSchema,
    updateEventFilterSchema,
    deleteEventFilterSchema: { params: Joi.object({ websiteId: Joi.string().uuid().required(), filterId: Joi.string().uuid().required() }) },
    createBlacklistSchema,
    deleteBlacklistSchema: { params: Joi.object({ websiteId: Joi.string().uuid().required(), blacklistId: Joi.string().uuid().required() }) },
};