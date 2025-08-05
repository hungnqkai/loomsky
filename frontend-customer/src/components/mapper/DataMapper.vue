<template>
  <v-app class="loomsky-mapper-app">
    <div class="mapper-container">
      <div v-if="highlightedElement" class="highlight-overlay" :style="overlayStyle"></div>

      <v-fade-transition>
        <div class="toolbar">
          <v-icon color="white">mdi-cursor-default-click-outline</v-icon>
          <span class="ml-3 font-weight-medium">Chế độ Chọn Phần tử</span>
          <v-spacer></v-spacer>
          <v-btn size="small" variant="outlined" @click="closeMapper">Hoàn tất</v-btn>
        </div>
      </v-fade-transition>

      <v-dialog v-model="isModalOpen" max-width="550px" persistent>
        <v-card rounded="lg">
          <v-card-title class="font-weight-bold">Ánh xạ Biến Dữ liệu</v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-2"><strong>Phần tử đã chọn:</strong></p>
            <code class="selector-code">{{ selectedSelector }}</code>
            
            <v-select
              v-model="selectedVariable"
              label="Chọn loại dữ liệu tương ứng"
              :items="dataVariableOptions"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="compact"
              class="mt-4"
              :rules="[v => !!v || 'Vui lòng chọn một loại dữ liệu']"
              ref="variableSelect"
            ></v-select>

            <v-text-field
              v-model="pageContext"
              label="Ngữ cảnh trang (tùy chọn)"
              placeholder="product_detail, cart_page..."
              variant="outlined"
              density="compact"
              hint="Chỉ áp dụng ánh xạ này trên một loại trang cụ thể."
            ></v-text-field>
          </v-card-text>
          <v-card-actions class="pa-4">
            <v-btn text @click="testConnection" color="green">Kiểm tra Kết nối</v-btn>
            <v-spacer></v-spacer>
            <v-btn text @click="closeModal">Hủy</v-btn>
            <v-btn color="primary" variant="flat" @click="saveMapping" :loading="isSaving">Lưu</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </v-app>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
// Giả sử file này tồn tại và hoạt động đúng
import { generateCssSelector } from '../../utils/selectorGenerator'; 

// --- STATE MANAGEMENT ---
const highlightedElement = ref(null);
const overlayStyle = ref({});
const isModalOpen = ref(false);
const isSaving = ref(false);

const selectedSelector = ref('');
const selectedVariable = ref(null);
const pageContext = ref('');

// Ref để tương tác với component v-select
const variableSelect = ref(null);

// --- STATIC DATA ---
const dataVariableOptions = [
  { title: 'Tên sản phẩm (Product Name)', value: 'product_name' },
  { title: 'Giá sản phẩm (Product Price)', value: 'product_price' },
  { title: 'Mã sản phẩm (SKU)', value: 'product_sku' },
  { title: 'Nút Thêm vào giỏ hàng (Button)', value: 'add_to_cart_button' },
  { title: 'Nút Mua ngay (Button)', value: 'buy_now_button' },
  { title: 'Trường nhập Email (Input)', value: 'email_input' },
  { title: 'Nút Gửi Form (Button)', value: 'form_submit_button' },
];

// --- EVENT HANDLERS ---
const handleMouseOver = (e) => {
  if (e.target.closest('#loomsky-mapper-host')) return;
  highlightedElement.value = e.target;
  const rect = e.target.getBoundingClientRect();
  overlayStyle.value = {
    width: `${rect.width}px`, height: `${rect.height}px`,
    top: `${rect.top + window.scrollY}px`, left: `${rect.left + window.scrollX}px`,
  };
};

const handleClick = (e) => {
  if (e.target.closest('#loomsky-mapper-host')) return;
  e.preventDefault();
  e.stopPropagation();
  selectedSelector.value = generateCssSelector(e.target);
  isModalOpen.value = true;
};

// --- MODAL & MAPPER ACTIONS ---
const closeModal = () => {
  isModalOpen.value = false;
  selectedSelector.value = '';
  selectedVariable.value = null;
  pageContext.value = '';
};

const saveMapping = async () => {
  // KIỂM TRA TRỰC TIẾP, KHÔNG DÙNG VALIDATE()
  console.log('[MAPPER]: Kiểm tra giá trị đã chọn:', selectedVariable.value);
  if (!selectedVariable.value) {
    console.error('[MAPPER]: Lỗi - Chưa chọn loại dữ liệu.');
    alert('Vui lòng chọn một loại dữ liệu trước khi lưu.');
    return;
  }

  console.log('[MAPPER]: --- Bắt đầu quy trình Lưu ---');
  isSaving.value = true;

  const payload = {
    variable_name: selectedVariable.value,
    selector: selectedSelector.value,
    page_context: pageContext.value || null,
  };
  console.log('[MAPPER]: Dữ liệu đã sẵn sàng để gửi:', payload);

  if (!window.opener || window.opener.closed) {
    console.error('[MAPPER]: Lỗi! Không tìm thấy hoặc cửa sổ gốc đã bị đóng.');
    alert('Lỗi: Mất kết nối đến ứng dụng LoomSky.');
    isSaving.value = false;
    return;
  }

  try {
    console.log('[MAPPER]: Đang gửi thông điệp SAVE đến cửa sổ gốc...');
    window.opener.postMessage({ type: 'LOOMSKY_SAVE_MAPPING', payload: payload }, '*');
    console.log('[MAPPER]: Đã gửi thông điệp SAVE.');
    closeModal();
  } catch (error) {
    console.error('[MAPPER]: Lỗi khi gửi postMessage:', error);
    alert('Đã xảy ra lỗi khi gửi dữ liệu về ứng dụng LoomSky.');
  } finally {
    isSaving.value = false;
  }
};

const closeMapper = () => {
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({ type: 'LOOMSKY_CLOSE_MAPPER' }, '*');
  }
};

// --- CONNECTION TEST FUNCTIONS ---
const testConnection = () => {
  console.log('[MAPPER]: Đang gửi PING đến ứng dụng LoomSky...');
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({ type: 'LOOMSKY_PING_REQUEST' }, '*');
    console.log('[MAPPER]: Đã gửi PING.');
  } else {
    console.error('[MAPPER]: Lỗi nghiêm trọng! Không tìm thấy hoặc cửa sổ gốc đã bị đóng (window.opener is null or closed).');
    alert('Lỗi: Mất kết nối đến ứng dụng LoomSky!');
  }
};

const handlePongResponse = (event) => {
  // Thêm kiểm tra origin để bảo mật trong môi trường production
  if (event.data.type === 'LOOMSKY_PONG_RESPONSE') {
    console.log(
      '%c[MAPPER]: Đã nhận được PONG từ LoomSky! Kết nối 2 chiều thành công!',
      'color: #03A9F4; font-weight: bold;'
    );
    alert('Thành công! Cửa sổ Mapper đã kết nối được với ứng dụng LoomSky.');
  }
};

// --- LIFECYCLE HOOKS ---
onMounted(() => {
  console.log('LoomSky Data Mapper: Agent activated on customer page.');
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('click', handleClick, true);
  window.addEventListener('message', handlePongResponse); // Lắng nghe PONG
});

onUnmounted(() => {
  console.log('LoomSky Data Mapper: Agent deactivated.');
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('click', handleClick, true);
  window.removeEventListener('message', handlePongResponse); // Dọn dẹp listener
});
</script>

<style>
/* Đảm bảo style của bạn không bị xung đột */
.loomsky-mapper-app {
  all: initial; /* Reset tất cả style kế thừa */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  font-size: 16px;
  line-height: 1.5;
}
.toolbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #1F2937;
  color: white;
  padding: 12px 20px;
  border-radius: 999px;
  z-index: 2147483647;
  font-size: 14px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  gap: 8px;
}
.highlight-overlay {
  position: absolute;
  background-color: rgba(0, 116, 186, 0.25);
  border: 2px solid #0074ba;
  border-radius: 4px;
  z-index: 2147483646;
  pointer-events: none;
  transition: all 0.1s ease-in-out;
}
.selector-code {
  background-color: #e5e7eb;
  color: #1f2937;
  padding: 4px 8px;
  border-radius: 4px;
  display: block;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
}
</style>