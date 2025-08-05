<template>
  <v-card flat>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Từ điển Dữ liệu (Data Dictionary)</span>
      <v-btn
        color="primary"
        @click="startSetupSession"
        :loading="websiteStore.actionLoading"
        prepend-icon="mdi-magic-staff"
      >
        Thiết lập Trực quan
      </v-btn>
    </v-card-title>
    <v-card-text>
      <p class="mb-4">
        "Dạy" cho LoomSky biết các dữ liệu quan trọng (giá, tên sản phẩm...) nằm ở đâu trên website của bạn. Các ánh xạ này sẽ được áp dụng cho toàn bộ website.
      </p>

      <v-alert v-if="websiteStore.error" type="error" class="mb-4" closable @click:close="websiteStore.clearMessages()">{{ websiteStore.error }}</v-alert>
      <v-alert v-if="websiteStore.successMessage" type="success" class="mb-4" closable @click:close="websiteStore.clearMessages()">{{ websiteStore.successMessage }}</v-alert>

      <v-data-table
        :headers="headers"
        :items="websiteStore.dataMappings"
        :loading="websiteStore.loading"
        item-value="id"
        no-data-text="Chưa có ánh xạ dữ liệu nào."
      >
        <template v-slot:item.selector="{ item }">
          <code class="selector-code">{{ item.selector }}</code>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-tooltip text="Xóa ánh xạ">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="mdi-delete-outline" variant="text" color="error" @click="openDeleteDialog(item)"></v-btn>
            </template>
          </v-tooltip>
        </template>
      </v-data-table>
    </v-card-text>

    <ConfirmDialog
      v-model="deleteDialog"
      title="Xác nhận xóa"
      :message="`Bạn có chắc muốn xóa ánh xạ cho <strong>${itemToDelete?.variable_name}</strong>?`"
      confirm-text="Xóa"
      confirm-color="error"
      :loading="websiteStore.actionLoading"
      @confirm="confirmDelete"
    />
  </v-card>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { useWebsiteStore } from '@/stores/websiteStore';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';

const props = defineProps({
  websiteId: { type: String, required: true },
});

const websiteStore = useWebsiteStore();
let mapperWindow = null; // Biến để giữ tham chiếu đến cửa sổ mapper

const headers = [
  { title: 'Tên Biến', value: 'variable_name' },
  { title: 'CSS Selector', value: 'selector' },
  { title: 'Ngữ cảnh trang', value: 'page_context' },
  { title: 'Hành động', value: 'actions', sortable: false, align: 'end' },
];

// --- Logic cho Dialog Xóa ---
const deleteDialog = ref(false);
const itemToDelete = ref(null);
const openDeleteDialog = (item) => {
  itemToDelete.value = item;
  deleteDialog.value = true;
};
const confirmDelete = async () => {
  if (itemToDelete.value) {
    await websiteStore.deleteDataMapping(props.websiteId, itemToDelete.value.id);
    deleteDialog.value = false;
  }
};

// --- Logic chính cho việc khởi tạo Mapper ---
const startSetupSession = async () => {
  const token = await websiteStore.initSetupSession(props.websiteId);
  if (!token) return;

  const domain = websiteStore.currentWebsite?.domain;
  if (!domain) {
    websiteStore.error = "Không tìm thấy tên miền của website.";
    return;
  }

  // Đảm bảo URL có http/https
  const url = domain.startsWith('http') ? domain : `https://${domain}`;
  const mapperUrl = new URL(url);
  mapperUrl.searchParams.set('ls_setup_mode', 'true');
  mapperUrl.searchParams.set('ls_token', token);

  // Mở cửa sổ mới và lắng nghe thông điệp
  mapperWindow = window.open(mapperUrl.href, '_blank');
  window.addEventListener('message', handleMapperMessage);
};

const handleMapperMessage = async (event) => {
  // Bảo mật: Chỉ xử lý thông điệp từ nguồn tin cậy (chính cửa sổ mapper)
  if (event.source !== mapperWindow) {
    return;
  }

  const { type, data } = event.data;

  if (type === 'LOOMSKY_SAVE_MAPPING') {
    await websiteStore.addDataMapping(props.websiteId, data);
  }

  if (type === 'LOOMSKY_CLOSE_MAPPER') {
    if (mapperWindow) {
      mapperWindow.close();
    }
    cleanupListener();
  }
};

const cleanupListener = () => {
  window.removeEventListener('message', handleMapperMessage);
  mapperWindow = null;
};

// Dọn dẹp listener khi component bị hủy để tránh memory leak
onUnmounted(() => {
  cleanupListener();
});
</script>

<style scoped>
.selector-code {
  background-color: #f1f1f1;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
