/*
File: src/validators/trackValidators.js (MỚI)
- Validator để xác thực payload sự kiện gửi lên từ SDK.
*/
'use strict';
const Joi = require('joi');

const trackEventSchema = {
    body: Joi.object({
        apiKey: Joi.string().required(),
        eventName: Joi.string().required(),
        properties: Joi.object().required(),
        sessionId: Joi.string().uuid().required(),
        timestamp: Joi.string().isoDate().required(),
        pixel_id: Joi.string().pattern(/^(\d+)$/).required(),
        event_id: Joi.string().required(),
    }),
};

module.exports = {
    trackEventSchema,
};