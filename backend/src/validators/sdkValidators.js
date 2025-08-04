/*
File: src/validators/sdkValidators.js (MỚI)
- File validator mới dành riêng cho các API của SDK.
*/
'use strict';
const Joi = require('joi');

const verifyApiKeySchema = {
    body: Joi.object({
        apiKey: Joi.string().required(),
    }),
};

module.exports = {
    verifyApiKeySchema,
};