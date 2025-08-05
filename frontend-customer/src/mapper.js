import { createApp } from 'vue';
import DataMapper from './components/mapper/DataMapper.vue';

// --- (MỚI) Import các thành phần cần thiết để tạo instance Vuetify tùy chỉnh ---
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
// Không cần import style ở đây vì nó được chèn qua thẻ <link>

/**
 * Hàm này sẽ được SDK gọi để khởi chạy "Tác Nhân Nội Bộ".
 * @param {HTMLElement} appMountPoint - Điểm mount bên trong Shadow DOM.
 * @param {object} options - Các tùy chọn từ SDK (websiteId, api...).
 */
function mountDataMapperApp(appMountPoint, options = {}) {
  // --- (MỚI) Tạo một instance Vuetify tùy chỉnh ---
  const vuetify = createVuetify({
    components,
    directives,
    // --- ĐÂY LÀ PHẦN SỬA LỖI QUAN TRỌNG NHẤT ---
    // Buộc tất cả các component động của Vuetify (dialog, menu, tooltip)
    // phải được chèn vào bên trong điểm mount của chúng ta (trong Shadow DOM),
    // thay vì chèn vào document.body của trang khách hàng.
    defaults: {
      global: {
        attach: appMountPoint,
      }
    },
  });

  const app = createApp(DataMapper, {
    ...options
  });
  
  // Sử dụng instance Vuetify tùy chỉnh của chúng ta
  app.use(vuetify);
  
  app.mount(appMountPoint);
}

// Expose hàm mount ra window để SDK có thể tìm và gọi nó.
window.mountDataMapperApp = mountDataMapperApp;
