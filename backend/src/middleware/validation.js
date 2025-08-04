/*
File: src/middleware/validation.js (CẬP NHẬT)
- Cập nhật middleware `validate` để tự động loại bỏ các trường không xác định khỏi request body.
- Điều này giúp tăng cường bảo mật và ngăn ngừa các lỗi validation không mong muốn.
*/
const Joi = require('joi');
const { pick } = require('lodash');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const validate = (schema) => (req, res, next) => {
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const object = pick(req, Object.keys(validSchema));

  // Cấu hình Joi để báo cáo tất cả lỗi và loại bỏ các trường không xác định
  const joiOptions = {
    abortEarly: false,  // Báo cáo tất cả các lỗi, không dừng lại ở lỗi đầu tiên
    allowUnknown: true, // Cho phép các trường không có trong schema
    stripUnknown: true, // Tự động loại bỏ các trường không có trong schema khỏi kết quả
  };

  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' } })
    .validate(object, joiOptions); // Áp dụng cấu hình mới

  if (error) {
    logger.error('--- VALIDATION FAILED ---');
    logger.error('Joi Validation Error Details:', error.details);
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new AppError(errorMessage, 400));
  }

  // Gán lại các giá trị đã được làm sạch và xác thực vào request
  Object.assign(req, value);
  return next();
};

// Các hàm validateParams và validateQuery giữ nguyên
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({ success: false, error: errorMessage });
    }
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({ success: false, error: errorMessage });
    }
    next();
  };
};

module.exports = {
  validate,
  validateParams,
  validateQuery
};