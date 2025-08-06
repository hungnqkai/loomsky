<template>
  <v-app class="loomsky-mapper-app">
    <v-card
      elevation="8"
      class="mapper-popup"
      :style="{ top: popupPosition.y + 'px', left: popupPosition.x + 'px' }"
      v-show="!isMinimized"
    >
      <v-system-bar
        window
        class="draggable-handle"
        @mousedown.prevent="startDrag"
      >
        <v-icon>mdi-tools</v-icon>
        <span class="ml-2">Thiết lập Trực quan</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-window-minimize" variant="text" size="x-small" @click="isMinimized = true"></v-btn>
        <v-btn icon="mdi-check-circle-outline" variant="text" size="x-small" @click="closeMapper">Hoàn tất</v-btn>
      </v-system-bar>

      <v-tabs v-model="activeTab" grow density="compact">
        <v-tab value="setup">Thiết lập Ánh xạ</v-tab>
        <v-tab value="all">Tất cả ({{ allMappings.length }})</v-tab>
      </v-tabs>

      <v-window v-model="activeTab">
        <v-window-item value="setup" class="tab-content">
          <div class="pa-4">
            <div v-if="!selectedElementData">
              <p class="text-caption mb-2">Bấm nút bên dưới để bắt đầu chọn một phần tử trên trang web của bạn.</p>
              <v-btn
                block
                :color="isSelectionModeActive ? 'warning' : 'primary'"
                @click="toggleSelectionMode"
                :prepend-icon="isSelectionModeActive ? 'mdi-close' : 'mdi-cursor-default-click-outline'"
              >
                {{ isSelectionModeActive ? 'Hủy chọn' : 'Chọn Phần tử trên trang' }}
              </v-btn>
            </div>
            <div v-else>
              <p class="text-body-2 mb-2"><strong>Phần tử đã chọn:</strong></p>
              <code class="selector-code">{{ selectedElementData.selector }}</code>
              <v-select
                v-model="selectedElementData.variable_name"
                label="Chọn loại dữ liệu"
                :items="dataVariableOptions"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="compact" class="mt-4" hide-details
              ></v-select>
              <v-select
                v-model="selectedElementData.page_context"
                label="Chọn ngữ cảnh trang"
                :items="pageContextOptions"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="compact" class="mt-3" clearable hide-details
              ></v-select>
              <div class="d-flex justify-end mt-4">
                <v-btn text size="small" @click="cancelSelection">Hủy</v-btn>
                <v-btn color="primary" size="small" @click="saveMapping" :loading="isSaving">Lưu Ánh xạ</v-btn>
              </div>
            </div>
          </div>
        </v-window-item>

        <v-window-item value="all" class="tab-content">
           <v-list v-if="isLoading" lines="one">
             <v-list-item v-for="n in 3" :key="n"><v-skeleton-loader type="list-item-two-line"></v-skeleton-loader></v-list-item>
          </v-list>
          <v-list v-else-if="allMappings.length === 0" lines="one">
            <v-list-item title="Không có ánh xạ nào" subtitle="Hãy bắt đầu thiết lập ở tab bên cạnh."></v-list-item>
          </v-list>
          <v-list v-else lines="two" density="compact">
            <v-list-item
              v-for="mapping in allMappings" :key="mapping.id"
              @mouseover="highlightElementBySelector(mapping.selector)"
              @mouseleave="clearManualHighlight"
            >
              <v-list-item-title>{{ mapping.variable_name }}</v-list-item-title>
              <v-list-item-subtitle class="selector-code small">{{ mapping.selector }}</v-list-item-subtitle>
              <template v-slot:append>
                <v-btn icon="mdi-delete-outline" variant="text" size="x-small" @click.stop="deleteMapping(mapping)"></v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-window-item>
      </v-window>
    </v-card>
    
    <v-btn v-show="isMinimized" class="minimized-btn" icon="mdi-tools" @click="isMinimized = false"></v-btn>
  </v-app>
</template>

<script setup>
import { ref, onMounted, onUnmounted, toRaw } from 'vue';
import { generateCssSelector } from '../../utils/selectorGenerator';

const props = defineProps({
  api: { type: Object, required: true },
});

// --- STATE ---
const activeTab = ref('setup');
const isSelectionModeActive = ref(false);
const isSaving = ref(false);
const isLoading = ref(true);
const isMinimized = ref(false);
const allMappings = ref([]);
const selectedElementData = ref(null);
const popupPosition = ref({ x: window.innerWidth - 420, y: 20 });
const dragOffset = ref({ x: 0, y: 0 });
let suggestionStyleTag = null;
let highlightOverlayElement = null;
const mappedElements = ref([]);
// SỬA LỖI 1: Khai báo biến suggestionElements
const suggestionElements = ref([]);

// --- STATIC DATA ---
const dataVariableOptions = [
  { title: 'Tên sản phẩm (Product Name)', value: 'product_name' },
  { title: 'Giá sản phẩm (Product Price)', value: 'product_price' },
  { title: 'Mã sản phẩm (SKU)', value: 'product_sku' },
];
const pageContextOptions = [
  { title: 'Trang sản phẩm (Product page)', value: 'product_page' },
  { title: 'Danh mục sản phẩm (Product category)', value: 'product_category' },
  { title: 'Trang tĩnh (Page)', value: 'page' },
  { title: 'Chi tiết bài viết (Blog detail)', value: 'blog_detail' },
  { title: 'Danh mục bài viết (Blog category)', value: 'blog_category' },
];
const suggestionStyles = `
  .loomsky-interactive-suggestion { outline: 2px dashed rgba(22, 163, 74, 0.7) !important; outline-offset: 2px; transition: all 0.2s ease-in-out; cursor: pointer !important; }
  .loomsky-interactive-suggestion:hover { outline-style: solid; outline-color: rgba(22, 163, 74, 1); box-shadow: 0 0 12px rgba(22, 163, 74, 0.5); }
  .loomsky-already-mapped { outline: 2px solid #8A2BE2 !important; outline-offset: 2px; }
`;

// --- LOGIC KÉO THẢ ---
const startDrag = (e) => {
  dragOffset.value = { x: e.clientX - popupPosition.value.x, y: e.clientY - popupPosition.value.y };
  document.addEventListener('mousemove', doDrag);
  document.addEventListener('mouseup', stopDrag);
};
const doDrag = (e) => {
  popupPosition.value = { x: e.clientX - dragOffset.value.x, y: e.clientY - dragOffset.value.y };
};
const stopDrag = () => {
  document.removeEventListener('mousemove', doDrag);
  document.removeEventListener('mouseup', stopDrag);
};

// --- LOGIC CHÍNH ---
const toggleSelectionMode = () => { isSelectionModeActive.value = !isSelectionModeActive.value; };
const cancelSelection = () => { selectedElementData.value = null; };

const handleMouseOver = (e) => {
  if (!isSelectionModeActive.value) return;
  if (e.target.closest('#loomsky-mapper-host')) {
    highlightOverlayElement.style.display = 'none';
    return;
  }
  const target = e.target.closest('.loomsky-interactive-suggestion, .loomsky-already-mapped') || e.target;
  const rect = target.getBoundingClientRect();
  Object.assign(highlightOverlayElement.style, {
    display: 'block',
    width: `${rect.width}px`, height: `${rect.height}px`,
    top: `${rect.top + window.scrollY}px`, left: `${rect.left + window.scrollX}px`,
  });
};

const handleClick = (e) => {
  if (!isSelectionModeActive.value) return;
  const target = e.target.closest('.loomsky-interactive-suggestion, .loomsky-already-mapped') || e.target;
  if (target.closest('#loomsky-mapper-host')) return;
  e.preventDefault(); e.stopPropagation();
  const selector = generateCssSelector(target);
  const existingMapping = allMappings.value.find(m => m.selector === selector);
  selectedElementData.value = {
      id: existingMapping?.id || null,
      variable_name: existingMapping?.variable_name || null,
      page_context: existingMapping?.page_context || null,
      selector: selector,
  };
  isSelectionModeActive.value = false;
  activeTab.value = 'setup';
};

const saveMapping = async () => {
    if (!selectedElementData.value?.variable_name) {
        alert('Vui lòng chọn loại dữ liệu.');
        return;
    }
    isSaving.value = true;
    
    // Sử dụng toRaw() để lấy đối tượng gốc, không phải proxy
    const plainPayload = toRaw(selectedElementData.value);

    window.opener.postMessage({
        type: 'LOOMSKY_SAVE_MAPPING',
        payload: plainPayload, // Gửi đi đối tượng đơn giản
    }, '*');
    
    setTimeout(async () => {
        await fetchAndHighlight();
        isSaving.value = false;
        selectedElementData.value = null;
    }, 500);
};

/**
 * SỬA LỖI: Cập nhật hàm deleteMapping
 */
const deleteMapping = async (mappingToDelete) => {
    if (confirm(`Bạn có chắc muốn xóa ánh xạ cho "${mappingToDelete.variable_name}"?`)) {
        // Sử dụng toRaw() ở đây cũng là một thói quen tốt
        const plainPayload = { id: toRaw(mappingToDelete).id };

        window.opener.postMessage({
            type: 'LOOMSKY_DELETE_MAPPING',
            payload: plainPayload,
        }, '*');
        
        allMappings.value = allMappings.value.filter(m => m.id !== mappingToDelete.id);
    }
};

const closeMapper = () => { window.opener.postMessage({ type: 'LOOMSKY_CLOSE_MAPPER' }, '*'); };

const fetchAndHighlight = async () => {
  isLoading.value = true;
  const mappings = await props.api.getDataMappings();
  if (mappings) {
    allMappings.value = mappings;
    highlightExistingMappings();
  }
  isLoading.value = false;
};

const highlightExistingMappings = () => {
    mappedElements.value.forEach(el => el.classList.remove('loomsky-already-mapped'));
    mappedElements.value = [];
    allMappings.value.forEach(mapping => {
        try {
            document.querySelectorAll(mapping.selector).forEach(el => {
                el.classList.add('loomsky-already-mapped');
                mappedElements.value.push(el);
            });
        } catch { /* SỬA LỖI 2: Gỡ bỏ biến `e` không dùng đến */ }
    });
};

const highlightElementBySelector = (selector) => {
  if (!selector || !highlightOverlayElement) return;
  try {
    const target = document.querySelector(selector);
    if (target) {
      const rect = target.getBoundingClientRect();
      Object.assign(highlightOverlayElement.style, {
        display: 'block', width: `${rect.width}px`, height: `${rect.height}px`,
        top: `${rect.top + window.scrollY}px`, left: `${rect.left + window.scrollX}px`,
      });
    } else {
      highlightOverlayElement.style.display = 'none';
    }
  } catch { /* SỬA LỖI 2: Gỡ bỏ biến `e` không dùng đến */ }
};

const clearManualHighlight = () => {
  if (highlightOverlayElement) {
    highlightOverlayElement.style.display = 'none';
  }
};

const findInteractiveElements = () => {
  const selectors = [ 'button', 'a[href]', 'input:not([type="hidden"])', '[role="button"]', '[onclick]', '[data-cy]', '[data-testid]', '.btn', '.button', '.price', '[class*="price"]' ];
  try {
    document.querySelectorAll(selectors.join(', ')).forEach(el => {
      if (!el.closest('#loomsky-mapper-host')) {
        el.classList.add('loomsky-interactive-suggestion');
        suggestionElements.value.push(el);
      }
    });
  } catch {}
};

// --- LIFECYCLE HOOKS ---
onMounted(async () => {
  suggestionStyleTag = document.createElement('style');
  suggestionStyleTag.id = 'loomsky-suggestion-styles';
  suggestionStyleTag.innerHTML = suggestionStyles;
  document.head.appendChild(suggestionStyleTag);

  highlightOverlayElement = document.createElement('div');
  highlightOverlayElement.id = 'loomsky-highlight-overlay';
  Object.assign(highlightOverlayElement.style, {
    position: 'absolute', backgroundColor: 'rgba(29, 109, 240, 0.25)', border: '2px solid #1d6df0',
    borderRadius: '4px', zIndex: '2147483646', pointerEvents: 'none',
    transition: 'all 0.1s ease-in-out', display: 'none',
  });
  document.body.appendChild(highlightOverlayElement);

  await fetchAndHighlight();
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('click', handleClick, true);
  setTimeout(findInteractiveElements, 100);
});

onUnmounted(() => {
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('click', handleClick, true);
  if (suggestionStyleTag) suggestionStyleTag.remove();
  if (highlightOverlayElement) highlightOverlayElement.remove();
  
  // Dọn dẹp cả hai loại class
  suggestionElements.value.forEach(el => { if (el) el.classList.remove('loomsky-interactive-suggestion'); });
  mappedElements.value.forEach(el => { if (el) el.classList.remove('loomsky-already-mapped'); });
});
</script>

<style>
/* Mục tiêu: Biến v-app thành một lớp "vô hình", không tương tác,
  chỉ để cung cấp context cho các component Vuetify.
*/
.loomsky-mapper-app {
  /* Gỡ bỏ các style cũ, thay bằng cách tiếp cận mới */
  
  /* Đặt nó ở vị trí tuyệt đối và trong suốt */
  position: absolute;
  top: 0;
  left: 0;
  background: transparent !important;
  
  /* RẤT QUAN TRỌNG: Cho phép click "xuyên qua" lớp v-app */
  pointer-events: none; 
}

/* Ghi đè layout wrap của Vuetify để nó không tạo "sidebar" */
.loomsky-mapper-app .v-application__wrap {
  min-height: 0 !important;
}

/* RẤT QUAN TRỌNG: Cho phép các thành phần UI nhận lại sự kiện click */
.mapper-popup, .minimized-btn {
  pointer-events: auto;
}

/* Các style khác giữ nguyên như file đúng của bạn */
.mapper-popup { 
  position: fixed; 
  width: 400px; 
  z-index: 2147483647; 
  border: 1px solid #e0e0e0; 
  background: white; 
}
.draggable-handle { 
  cursor: move; 
  user-select: none; 
}
.tab-content { 
  max-height: 400px; 
  overflow-y: auto; 
}
.selector-code { 
  background-color: #e5e7eb; 
  color: #1f2937; 
  padding: 2px 6px; 
  border-radius: 4px; 
  display: block; 
  white-space: pre-wrap; 
  word-break: break-all; 
  font-family: monospace; 
  font-size: 0.8rem; 
}
.selector-code.small { 
  font-size: 0.75rem; 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  max-width: 200px; 
}
.minimized-btn { 
  position: fixed; 
  z-index: 2147483647; 
  top: 20px; 
  right: 20px; 
}
</style>