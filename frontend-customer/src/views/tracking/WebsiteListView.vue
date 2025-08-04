<!-- 
File: src/views/tracking/WebsiteListView.vue (MỚI)
- Giao diện chính để hiển thị danh sách các website và thêm mới.
-->
<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4">Quản lý Website</h1>
      <v-btn color="primary" @click="dialog = true">
        <v-icon left>mdi-plus</v-icon>
        Thêm Website
      </v-btn>
    </div>

    <v-alert v-if="websiteStore.error" type="error" class="mb-4">{{ websiteStore.error }}</v-alert>
    <v-alert v-if="websiteStore.successMessage" type="success" class="mb-4">{{ websiteStore.successMessage }}</v-alert>

    <v-card>
      <v-card-title>Danh sách Website</v-card-title>
      <v-card-text v-if="websiteStore.loading" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-card-text>
      <v-data-table
        v-else
        :headers="headers"
        :items="websiteStore.websites"
        item-value="id"
        class="elevation-0"
        @click:row="goToDetail"
      >
        <template v-slot:item.platform_type="{ item }">
          <v-chip small>{{ item.platform_type }}</v-chip>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-icon small class="mr-2" @click.stop="editItem(item)">mdi-pencil</v-icon>
          <v-icon small @click.stop="deleteItem(item)">mdi-delete</v-icon>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog for creating/editing website -->
    <v-dialog v-model="dialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditMode ? 'Chỉnh sửa Website' : 'Thêm Website Mới' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field
              v-model="editedItem.name"
              label="Tên Website"
              :rules="[rules.required]"
              variant="outlined"
            ></v-text-field>
            <v-text-field
              v-model="editedItem.domain"
              label="Tên miền (ví dụ: example.com)"
              :rules="[rules.required]"
              variant="outlined"
            ></v-text-field>
            <v-select
              v-model="editedItem.platform_type"
              :items="['wordpress', 'shopify', 'html', 'other']"
              label="Nền tảng"
              :rules="[rules.required]"
              variant="outlined"
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeDialog">Hủy</v-btn>
          <v-btn color="primary" @click="saveWebsite" :loading="websiteStore.loading">Lưu</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useWebsiteStore } from '@/stores/websiteStore';
import { useRouter } from 'vue-router';

const websiteStore = useWebsiteStore();
const router = useRouter();

const headers = [
  { title: 'Tên Website', value: 'name' },
  { title: 'Tên miền', value: 'domain' },
  { title: 'Nền tảng', value: 'platform_type' },
  { title: 'API Key', value: 'api_key' },
  { title: 'Hành động', value: 'actions', sortable: false },
];

const dialog = ref(false);
const isEditMode = ref(false);
const form = ref(null);
const editedItem = reactive({ id: null, name: '', domain: '', platform_type: 'html' });
const rules = { required: v => !!v || 'Trường này là bắt buộc.' };

onMounted(() => {
  websiteStore.fetchWebsites();
});

const goToDetail = (event, { item }) => {
  router.push({ name: 'website-detail', params: { id: item.id } });
};

const closeDialog = () => {
  dialog.value = false;
  isEditMode.value = false;
  Object.assign(editedItem, { id: null, name: '', domain: '', platform_type: 'html' });
};

const saveWebsite = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  if (isEditMode.value) {
    // Logic update
  } else {
    const success = await websiteStore.createWebsite(editedItem);
    if (success) {
      closeDialog();
    }
  }
};

// Placeholder for edit/delete functions
const editItem = (item) => { /* Logic to open dialog in edit mode */ };
const deleteItem = (item) => { /* Logic to confirm and delete */ };
</script>

<style scoped>
.v-data-table :deep(tbody tr) {
  cursor: pointer;
}
</style>