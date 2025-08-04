/*
File: sdk/src/index.js (MỚI)
- Đây là file "entry point" của SDK.
- Nó sẽ khởi tạo và điều phối hoạt động của các module con.
*/
import Core from './core';

// Hàm khởi tạo chính của SDK
function init() {
    const core = new Core();
    core.start();
}

// Tự động chạy khi script được tải
// Trong thực tế, chúng ta có thể tạo một hàng đợi để xử lý các lệnh
// được gọi trước khi SDK được tải hoàn toàn.
init();

// Export để có thể sử dụng như một module nếu cần
export default {
    init
};