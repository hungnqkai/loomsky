// backend/src/utils/AppError.js

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    // Dựa vào statusCode để xác định trạng thái 'fail' (lỗi client) hay 'error' (lỗi server)
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // Đánh dấu đây là lỗi có thể dự đoán được (operational error)
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;