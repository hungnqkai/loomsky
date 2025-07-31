// backend/src/middleware/validation.js
const Joi = require('joi');
const { pick } = require('lodash');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const validate = (schema) => (req, res, next) => {
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const object = pick(req, Object.keys(validSchema));
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    // --- NÂNG CẤP LOGGING ---
    // Log này sẽ cho chúng ta thấy chính xác vấn đề
    logger.error('--- VALIDATION FAILED ---');
    logger.error('Request Body Received:', req.body);
    logger.error('Joi Validation Error Details:', error.details);
    // --- KẾT THÚC NÂNG CẤP ---

    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new AppError(errorMessage, 400));
  }
  Object.assign(req, value);
  return next();
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        error: errorMessage
      });
    }
    
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        error: errorMessage
      });
    }
    
    next();
  };
};

module.exports = {
  validate,
  validateParams,
  validateQuery
};