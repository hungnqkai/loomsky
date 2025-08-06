<template>
  <v-app class="loomsky-mapper-app">
    <div class="mapper-container">
      <v-fade-transition>
        <div class="toolbar">
          <v-tooltip :text="isNavigateMode ? 'Chuyển sang Chế độ Chọn' : 'Chuyển sang Chế độ Điều hướng'">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                :icon="isNavigateMode ? 'mdi-cursor-default' : 'mdi-cursor-default-click-outline'"
                variant="text"
                @click="toggleMode"
              ></v-btn>
            </template>
          </v-tooltip>
          
          <span class="ml-2 font-weight-medium">
            {{ isNavigateMode ? 'Chế độ Điều hướng' : 'Chế độ Chọn Phần tử' }}
          </span>
          
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
             <v-select
              v-model="pageContext"
              label="Chọn ngữ cảnh trang (tùy chọn)"
              :items="pageContextOptions"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="compact"
              clearable
              hint="Chỉ áp dụng ánh xạ này trên một loại trang cụ thể."
            ></v-select>
          </v-card-text>
          <v-card-actions class="pa-4">
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
import { generateCssSelector } from '../../utils/selectorGenerator'; 

// --- STATE ---
const isNavigateMode = ref(false); // Mặc định là Chế độ Chọn
const isModalOpen = ref(false);
const isSaving = ref(false);
const selectedSelector = ref('');
const selectedVariable = ref(null);
const pageContext = ref('');
const variableSelect = ref(null);

// --- CÁC BIẾN ĐỂ QUẢN LÝ CÁC PHẦN TỬ ĐỘNG ---
let suggestionStyleTag = null;
let highlightOverlayElement = null;
const suggestionElements = ref([]);

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

const pageContextOptions = [
  { title: 'Trang sản phẩm (Product page)', value: 'product_page' },
  { title: 'Danh mục sản phẩm (Product category)', value: 'product_category' },
  { title: 'Trang tĩnh (Page)', value: 'page' },
  { title: 'Chi tiết bài viết (Blog detail)', value: 'blog_detail' },
  { title: 'Danh mục bài viết (Blog category)', value: 'blog_category' },
];

// (MỚI) Định nghĩa CSS sẽ được tiêm vào trang chính
const suggestionStyles = `
  .loomsky-interactive-suggestion {
    border: 4px dashed rgba(22, 163, 74, 0.7) !important;
    transition: all 0.2s ease-in-out;
    cursor: pointer !important;
  }
  .loomsky-interactive-suggestion:hover {
    border: 4px dashed rgb(8 104 43 / 70%) !important;
    box-shadow: 0 0 12px rgba(22, 163, 74, 0.5);
  }
`;

const findInteractiveElements = () => {
  console.log('[LOG] ▶️ Bắt đầu hàm `findInteractiveElements`...');
  const selectors = [
    'button', 'a[href]', 'input:not([type="hidden"])', '[role="button"]', 
    '[onclick]', '[data-cy]', '[data-testid]',
    '.btn', '.button', '.price', '[class*="price"]'
  ];
  const selectorString = selectors.join(', ');
  console.log('[LOG] 🔎 Chuỗi selector được sử dụng:', selectorString);
  
  try {
    const elements = document.querySelectorAll(selectorString);
    console.log(`[LOG] ✅ QuerySelectorAll thành công. Tìm thấy ${elements.length} phần tử.`);
    elements.forEach(el => {
      if (!el.closest('#loomsky-mapper-host')) {
        el.classList.add('loomsky-interactive-suggestion');
        suggestionElements.value.push(el);
      }
    });
    console.log(`[LOG] ✨ Đã thêm class cho ${suggestionElements.value.length} phần tử gợi ý.`);
  } catch (error) {
    console.error('[LOG] ❌ LỖI QuerySelectorAll:', error);
  }
};

// --- (MỚI) Hàm chuyển đổi chế độ ---
const toggleMode = () => {
  isNavigateMode.value = !isNavigateMode.value;
  // Nếu chuyển sang chế độ điều hướng, ẩn lớp phủ đi
  if (isNavigateMode.value && highlightOverlayElement) {
    highlightOverlayElement.style.display = 'none';
  }
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

// --- EVENT HANDLERS ---
const handleMouseOver = (e) => {
  // Chỉ hiện highlight khi ở Chế độ Chọn
  if (isNavigateMode.value) return;
  
  if (e.target.closest('#loomsky-mapper-host')) {
    highlightOverlayElement.style.display = 'none';
    return;
  }
  
  const target = e.target.closest('.loomsky-interactive-suggestion') || e.target;
  const rect = target.getBoundingClientRect();

  highlightOverlayElement.style.display = 'block';
  highlightOverlayElement.style.width = `${rect.width}px`;
  highlightOverlayElement.style.height = `${rect.height}px`;
  highlightOverlayElement.style.top = `${rect.top + window.scrollY}px`;
  highlightOverlayElement.style.left = `${rect.left + window.scrollX}px`;
};


const handleClick = (e) => {
  // Chỉ xử lý click khi ở Chế độ Chọn
  if (isNavigateMode.value) return;
  
  const target = e.target.closest('.loomsky-interactive-suggestion') || e.target;
  if (target.closest('#loomsky-mapper-host')) return;
  
  // Ngăn chặn chuyển trang chỉ khi ở Chế độ Chọn
  e.preventDefault();
  e.stopPropagation();
  
  selectedSelector.value = generateCssSelector(target);
  isModalOpen.value = true;
};


// --- LIFECYCLE HOOKS ---
onMounted(() => {
  // 1. Tiêm style cho Gợi ý (Auto-highlight)
  suggestionStyleTag = document.createElement('style');
  suggestionStyleTag.id = 'loomsky-suggestion-styles';
  suggestionStyleTag.innerHTML = suggestionStyles;
  document.head.appendChild(suggestionStyleTag);

  // 2. Tạo và tiêm lớp phủ (Hover-highlight)
  highlightOverlayElement = document.createElement('div');
  highlightOverlayElement.id = 'loomsky-highlight-overlay';
  Object.assign(highlightOverlayElement.style, {
    position: 'absolute',
    backgroundColor: 'rgba(29, 109, 240, 0.25)',
    border: '2px solid #1d6df0',
    borderRadius: '4px',
    zIndex: '2147483646',
    pointerEvents: 'none',
    transition: 'all 0.1s ease-in-out',
    display: 'none', // Ban đầu ẩn đi
  });
  document.body.appendChild(highlightOverlayElement);

  // 3. Lắng nghe sự kiện
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('click', handleClick, true);
  
  setTimeout(findInteractiveElements, 100);
});

onUnmounted(() => {
  // Dọn dẹp tất cả những gì đã tiêm vào
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('click', handleClick, true);
  
  if (suggestionStyleTag) suggestionStyleTag.remove();
  if (highlightOverlayElement) highlightOverlayElement.remove();
  
  suggestionElements.value.forEach(el => {
    if (el) el.classList.remove('loomsky-interactive-suggestion');
  });
});
</script>

<style>
/* Đảm bảo style của bạn không bị xung đột */
.loomsky-mapper-app {
  background: transparent !important;
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
  z-index: 2147483647; /* Z-index cao nhất */
  font-size: 14px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  gap: 8px;

  /* Ép trình duyệt tạo một rendering layer mới cho toolbar */
  will-change: transform;
  transform: translateX(-50%) translateZ(1px); 
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

.mapping-loomsky {
  box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px;
}
</style>