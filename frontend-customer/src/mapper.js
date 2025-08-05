// File: frontend-customer/src/mapper.js (MỚI - ĐÃ SỬA LỖI)

import { createApp } from 'vue';
import DataMapper from './components/mapper/DataMapper.vue';

// ĐIỂM KHÁC BIỆT 1: Import trực tiếp các hàm tạo của Vuetify
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

function mountDataMapperApp(appMountPoint, options = {}) {
  // ĐIỂM KHÁC BIỆT 2: Tạo một instance Vuetify mới và tùy chỉnh
  const vuetify = createVuetify({
    components,
    directives,
    // ĐIỂM KHÁC BIỆT 3 (QUAN TRỌNG NHẤT):
    // Dòng này ra lệnh cho Vuetify: "Tất cả các thành phần động như
    // dialog, menu, v.v., phải được gắn vào 'appMountPoint' 
    // (tức là Shadow DOM), chứ không phải document.body nữa."
    defaults: {
      global: {
        attach: appMountPoint,
      }
    },
  });

  const app = createApp(DataMapper, {
    ...options
  });
  
  // Sử dụng instance Vuetify vừa được tạo riêng cho Mapper
  app.use(vuetify);
  
  app.mount(appMountPoint);
}

window.mountDataMapperApp = mountDataMapperApp;