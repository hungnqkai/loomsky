/*
File mới: backend/src/middleware/upload.js
- Cấu hình middleware `multer` để xử lý việc tải file lên.
*/

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(__dirname, '../../public/uploads/logos');
if (!fs.existsSync(uploadDir)) {  
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình nơi lưu trữ và tên file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file duy nhất: clientId-timestamp.extension
    const uniqueSuffix = `${req.user.client_id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueSuffix);
  }
});

// Lọc file: chỉ chấp nhận các định dạng ảnh phổ biến
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Error: File upload only supports the following filetypes - ' + allowedTypes));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Giới hạn 2MB
  fileFilter: fileFilter
});

module.exports = upload;