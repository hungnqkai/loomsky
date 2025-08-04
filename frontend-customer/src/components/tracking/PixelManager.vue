<!-- 
File: src/components/tracking/PixelManager.vue (CẬP NHẬT)
- Hoàn thiện logic CRUD cho Pixels.
-->
<template>
    <v-card flat>
        <v-card-title class="d-flex justify-space-between align-center">
            <span>Danh sách Pixels</span>
            <v-btn color="primary" @click="openDialog()">
                <v-icon left>mdi-plus</v-icon>
                Thêm Pixel
            </v-btn>
        </v-card-title>
        <v-card-text>
            <v-alert v-if="websiteStore.error" type="error" class="mb-4" closable @click:close="websiteStore.clearMessages()">{{ websiteStore.error }}</v-alert>
            <v-alert v-if="websiteStore.successMessage" type="success" class="mb-4" closable @click:close="websiteStore.clearMessages()">{{ websiteStore.successMessage }}</v-alert>
            <v-data-table
                :headers="headers"
                :items="websiteStore.pixels"
                :loading="websiteStore.actionLoading"
                item-value="id"
                no-data-text="Chưa có pixel nào được cấu hình."
            >
                <template v-slot:item.actions="{ item }">
                    <v-icon small class="mr-2" @click="openDialog(item)">mdi-pencil</v-icon>
                    <v-icon small color="error" @click="openDeleteDialog(item)">mdi-delete</v-icon>
                </template>
            </v-data-table>
        </v-card-text>

        <!-- Dialog Thêm/Sửa Pixel -->
        <v-dialog v-model="dialog" max-width="800px" persistent>
            <v-card>
                <v-card-title><span class="text-h5">{{ isEditMode ? 'Chỉnh sửa Pixel' : 'Thêm Pixel Mới' }}</span></v-card-title>
                <v-card-text>
                    <v-form ref="form">
                        <v-text-field v-model="editedItem.pixel_id" label="Facebook Pixel ID" :rules="[rules.required, rules.numeric]" variant="outlined" hint="Chỉ nhập chuỗi số ID của Pixel." persistent-hint></v-text-field>
                        <v-text-field v-model="editedItem.access_token" label="Conversion API Access Token" :rules="[rules.required]" variant="outlined" class="mt-4" hint="Token cần thiết để gửi sự kiện từ server." persistent-hint></v-text-field>
                        <v-divider class="my-6"></v-divider>
                        <h3 class="text-h6 mb-2">Cấu hình Nâng cao</h3>
                        <v-textarea v-model="editedItem.activation_rules" label="Quy tắc Kích hoạt (JSON)" variant="outlined" rows="5" hint="Nhập một mảng JSON các quy tắc. Ví dụ: [{&quot;type&quot;: &quot;url_contains&quot;, &quot;value&quot;: &quot;/products&quot;}]" persistent-hint></v-textarea>
                        <v-textarea v-model="editedItem.tracking_config" label="Cấu hình Tracking (JSON)" variant="outlined" rows="5" class="mt-4" hint="Nhập một object JSON để cài đặt sự kiện và chuyển đổi." persistent-hint></v-textarea>
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="closeDialog">Hủy</v-btn>
                    <v-btn color="primary" @click="savePixel" :loading="websiteStore.actionLoading">Lưu</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Dialog Xóa Pixel -->
        <v-dialog v-model="deleteDialog" max-width="500px">
            <v-card>
                <v-card-title class="text-h5">Xác nhận xóa</v-card-title>
                <v-card-text>Bạn có chắc chắn muốn xóa Pixel <strong>{{ itemToDelete?.pixel_id }}</strong>?</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="closeDeleteDialog">Hủy</v-btn>
                    <v-btn color="error" @click="confirmDelete" :loading="websiteStore.actionLoading">Xóa</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useWebsiteStore } from '@/stores/websiteStore';

const props = defineProps({ websiteId: { type: String, required: true } });
const websiteStore = useWebsiteStore();

const headers = [ { title: 'Pixel ID', value: 'pixel_id' }, { title: 'Hành động', value: 'actions', sortable: false, align: 'end' }];
const dialog = ref(false);
const deleteDialog = ref(false);
const form = ref(null);
const defaultItem = { id: null, pixel_id: '', access_token: '', activation_rules: '[]', tracking_config: '{}' };
const editedItem = reactive({ ...defaultItem });
const itemToDelete = ref(null);
const isEditMode = computed(() => !!editedItem.id);
const rules = { required: v => !!v || 'Trường này là bắt buộc.', numeric: v => /^\d+$/.test(v) || 'Pixel ID chỉ được chứa số.' };

const openDialog = (item) => {
    if (item) {
        Object.assign(editedItem, {
            ...item,
            activation_rules: JSON.stringify(item.activation_rules || [], null, 2),
            tracking_config: JSON.stringify(item.tracking_config || {}, null, 2),
        });
    } else {
        Object.assign(editedItem, defaultItem);
    }
    dialog.value = true;
};

const closeDialog = () => {
    dialog.value = false;
    form.value?.resetValidation();
};

const savePixel = async () => {
    const { valid } = await form.value.validate();
    if (!valid) return;
    try {
        const payload = {
            pixel_id: editedItem.pixel_id,
            access_token: editedItem.access_token,
            activation_rules: JSON.parse(editedItem.activation_rules),
            tracking_config: JSON.parse(editedItem.tracking_config),
        };
        let success = false;
        if (isEditMode.value) {
            success = await websiteStore.updatePixel(props.websiteId, editedItem.id, payload);
        } else {
            success = await websiteStore.addPixel(props.websiteId, payload);
        }
        if (success) closeDialog();
    } catch (e) {
        websiteStore.error = 'Cấu hình JSON không hợp lệ.';
    }
};

const openDeleteDialog = (item) => { itemToDelete.value = item; deleteDialog.value = true; };
const closeDeleteDialog = () => { deleteDialog.value = false; itemToDelete.value = null; };
const confirmDelete = async () => {
    if (itemToDelete.value) {
        const success = await websiteStore.deletePixel(props.websiteId, itemToDelete.value.id);
        if (success) closeDeleteDialog();
    }
};
</script>