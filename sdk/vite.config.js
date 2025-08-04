/*
File: sdk/vite.config.js (CẬP NHẬT)
- Cấu hình Vite để đóng gói thư viện SDK thành định dạng `iife`.
- Định dạng này tương thích hoàn toàn với việc nhúng trực tiếp vào trình duyệt qua thẻ <script>.
*/
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'LoomSkySDK',
      // Xuất ra một file duy nhất tên là loomsky-sdk.js
      fileName: 'loomsky-sdk',
      // Sử dụng định dạng IIFE (Immediately Invoked Function Expression)
      formats: ['iife'] 
    },
    // Tắt minify để dễ debug hơn trong giai đoạn phát triển
    minify: false, 
  },
});