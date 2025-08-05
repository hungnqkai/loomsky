<template>
  <!-- 
    Bọc toàn bộ template trong <v-app>.
    Đây là yêu cầu của Vuetify để các component như v-dialog, v-menu 
    có thể quản lý và hiển thị overlay một cách chính xác.
  -->
  <v-app class="loomsky-mapper-app">
    <div class="mapper-container">
      <!-- Lớp phủ để highlight phần tử -->
      <div v-if="highlightedElement" class="highlight-overlay" :style="overlayStyle"></div>

      <!-- Thanh công cụ -->
      <v-fade-transition>
        <div class="toolbar">
          <v-icon color="white">mdi-cursor-default-click-outline</v-icon>
          <span class="ml-3 font-weight-medium">Chế độ Chọn Phần tử</span>
          <v-spacer></v-spacer>
          <v-btn size="small" variant="outlined" @click="closeMapper">Hoàn tất</v-btn>
        </div>
      </v-fade-transition>

      <!-- Modal cấu hình ánh xạ -->
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

const props = defineProps({
  websiteId: { type: String, required: true },
});

const highlightedElement = ref(null);
const overlayStyle = ref({});
const isModalOpen = ref(false);
const isSaving = ref(false);
const selectedSelector = ref('');
const selectedVariable = ref(null);
const pageContext = ref('');
const variableSelect = ref(null);

// Danh sách các biến dữ liệu chuẩn hóa
const dataVariableOptions = [
  { title: 'Tên sản phẩm (Product Name)', value: 'product_name' },
  { title: 'Giá sản phẩm (Product Price)', value: 'product_price' },
  { title: 'Mã sản phẩm (SKU)', value: 'product_sku' },
  { title: 'Nút Thêm vào giỏ hàng (Button)', value: 'add_to_cart_button' },
  { title: 'Nút Mua ngay (Button)', value: 'buy_now_button' },
  { title: 'Trường nhập Email (Input)', value: 'email_input' },
  { title: 'Nút Gửi Form (Button)', value: 'form_submit_button' },
];

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

const closeModal = () => {
  isModalOpen.value = false;
  selectedSelector.value = '';
  selectedVariable.value = null;
  pageContext.value = '';
};

const saveMapping = async () => {
  const { valid } = await variableSelect.value.validate();
  if (!valid) return;

  isSaving.value = true;
  const mappingData = {
    variable_name: selectedVariable.value,
    selector: selectedSelector.value,
    page_context: pageContext.value || null,
  };

  window.opener.postMessage({
    type: 'LOOMSKY_SAVE_MAPPING',
    data: mappingData,
  }, '*');

  setTimeout(() => {
    isSaving.value = false;
    closeModal();
  }, 500);
};

const closeMapper = () => {
  window.opener.postMessage({ type: 'LOOMSKY_CLOSE_MAPPER' }, '*');
};

onMounted(() => {
  console.log('LoomSky Data Mapper: Agent activated on customer page.');
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('click', handleClick, true);
});

onUnmounted(() => {
  console.log('LoomSky Data Mapper: Agent deactivated.');
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('click', handleClick, true);
});
</script>

<style>
/* ... (Giữ nguyên các style đã tạo ở bước trước) ... */
.loomsky-mapper-app { all: initial; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.5; }
.toolbar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background-color: #1F2937; color: white; padding: 12px 20px; border-radius: 999px; z-index: 2147483647; font-size: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 8px;}
.highlight-overlay { position: absolute; background-color: rgba(0, 116, 186, 0.25); border: 2px solid #0074ba; border-radius: 4px; z-index: 2147483646; pointer-events: none; transition: all 0.1s ease-in-out; }
.selector-code { background-color: #e5e7eb; color: #1f2937; padding: 4px 8px; border-radius: 4px; display: block; white-space: pre-wrap; word-break: break-all; font-family: monospace; }
</style>
