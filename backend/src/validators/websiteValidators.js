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

const paramsWebsitePixelId = {
    params: Joi.object({
        websiteId: Joi.string().uuid().required(),
        pixelId: Joi.string().uuid().required(),
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

// --- EVENT TRIGGER SCHEMAS (MỚI) ---
const createEventTriggerSchema = {
    params: Joi.object({
        websiteId: Joi.string().uuid().required(),
        pixelId: Joi.string().uuid().required(),
    }),
    body: Joi.object({
        event_name: Joi.string().min(1).max(100).required(),
        trigger_type: Joi.string().valid('url_match', 'click_element').required(),
        
        // URL trigger fields (conditional)
        url_pattern: Joi.when('trigger_type', {
            is: 'url_match',
            then: Joi.string().min(1).required(),
            otherwise: Joi.forbidden()
        }),
        url_match_type: Joi.when('trigger_type', {
            is: 'url_match',
            then: Joi.string().valid('contains', 'equals', 'starts_with', 'ends_with', 'regex').required(),
            otherwise: Joi.forbidden()
        }),
        
        // Click trigger fields (conditional)
        selector: Joi.when('trigger_type', {
            is: 'click_element',
            then: Joi.string().min(1).required(),
            otherwise: Joi.forbidden()
        }),
        element_text: Joi.when('trigger_type', {
            is: 'click_element',
            then: Joi.string().allow('').optional(),
            otherwise: Joi.forbidden()
        }),
        
        // Optional fields
        enabled: Joi.boolean().default(true),
        priority: Joi.number().integer().min(0).default(0)
    })
};

const updateEventTriggerSchema = {
    params: Joi.object({
        websiteId: Joi.string().uuid().required(),
        pixelId: Joi.string().uuid().required(),
        id: Joi.string().uuid().required(),
    }),
    body: Joi.object({
        event_name: Joi.string().min(1).max(100),
        enabled: Joi.boolean(),
        priority: Joi.number().integer().min(0),
        
        // URL trigger fields (conditional based on existing trigger_type)
        url_pattern: Joi.string().min(1),
        url_match_type: Joi.string().valid('contains', 'equals', 'starts_with', 'ends_with', 'regex'),
        
        // Click trigger fields (conditional based on existing trigger_type)
        selector: Joi.string().min(1),
        element_text: Joi.string().allow('')
    }).min(1) // At least one field must be provided
};

const deleteEventTriggerSchema = {
    params: Joi.object({
        websiteId: Joi.string().uuid().required(),
        pixelId: Joi.string().uuid().required(),
        id: Joi.string().uuid().required(),
    })
};

const bulkToggleTriggersSchema = {
    params: Joi.object({
        websiteId: Joi.string().uuid().required(),
        pixelId: Joi.string().uuid().required(),
    }),
    body: Joi.object({
        trigger_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
        enabled: Joi.boolean().required()
    })
};

module.exports = {
    getWebsiteSchema: paramsWebsiteId,
    getWebsitePixelSchema: paramsWebsitePixelId,
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
    // Event Trigger schemas
    createEventTriggerSchema,
    updateEventTriggerSchema,
    deleteEventTriggerSchema,
    bulkToggleTriggersSchema,
};