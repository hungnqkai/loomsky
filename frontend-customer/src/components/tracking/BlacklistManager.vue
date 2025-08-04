<!-- 
File: src/components/tracking/BlacklistManager.vue (CẬP NHẬT)
- Hoàn thiện giao diện và logic cho tab Blacklist.
-->
<template>
    <v-card flat>
        <v-card-title>Quản lý Blacklist</v-card-title>
        <v-card-text>
            <p class="mb-4">Chặn việc thu thập dữ liệu từ các địa chỉ IP, người dùng hoặc email cụ thể. Các quy tắc này sẽ được áp dụng cho toàn bộ website.</p>
            
            <v-alert v-if="websiteStore.error" type="error" class="mb-4" closable @click:close="websiteStore.clearMessages()">{{ websiteStore.error }}</v-alert>
            <v-alert v-if="websiteStore.successMessage" type="success" class="mb-4" closable @click:close="websiteStore.clearMessages()">{{ websiteStore.successMessage }}</v-alert>

            <!-- Form Thêm Mới -->
            <v-form ref="form" @submit.prevent="addEntry">
                <v-row align="center">
                    <v-col cols="12" md="4">
                        <v-select v-model="newItem.type" :items="['ip', 'user_id', 'email', 'phone']" label="Loại" :rules="[rules.required]" variant="outlined" density="compact" hide-details></v-select>
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="newItem.value" label="Giá trị cần chặn" :rules="[rules.required]" variant="outlined" density="compact" hide-details></v-text-field>
                    </v-col>
                    <v-col cols="12" md="2">
                        <v-btn type="submit" color="primary" block :loading="websiteStore.actionLoading">Thêm</v-btn>
                    </v-col>
                </v-row>
            </v-form>

            <v-divider class="my-4"></v-divider>

            <!-- Bảng Dữ liệu -->
            <v-data-table
                :headers="headers"
                :items="websiteStore.blacklist"
                :loading="websiteStore.actionLoading"
                item-value="id"
                no-data-text="Danh sách chặn trống."
            >
                <template v-slot:item.type="{ item }">
                    <v-chip size="small">{{ item.type }}</v-chip>
                </template>
                <template v-slot:item.actions="{ item }">
                    <v-icon small color="error" @click="confirmDelete(item)">mdi-delete</v-icon>
                </template>
            </v-data-table>
        </v-card-text>
    </v-card>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useWebsiteStore } from '@/stores/websiteStore';

const props = defineProps({ websiteId: { type: String, required: true } });
const websiteStore = useWebsiteStore();

const headers = [
    { title: 'Loại', value: 'type' },
    { title: 'Giá trị', value: 'value' },
    { title: 'Hành động', value: 'actions', sortable: false, align: 'end' },
];

const form = ref(null);
const defaultItem = { type: 'ip', value: '' };
const newItem = reactive({ ...defaultItem });
const rules = { required: v => !!v || 'Bắt buộc.' };

const addEntry = async () => {
    const { valid } = await form.value.validate();
    if (!valid) return;
    const success = await websiteStore.addBlacklistEntry(props.websiteId, newItem);
    if (success) {
        form.value.reset();
        Object.assign(newItem, defaultItem);
        form.value.resetValidation();
    }
};

const confirmDelete = (item) => {
    if (confirm(`Bạn có chắc muốn xóa "${item.value}" khỏi danh sách chặn không?`)) {
        websiteStore.deleteBlacklistEntry(props.websiteId, item.id);
    }
};
</script>