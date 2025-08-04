<!-- 
File: src/components/tracking/EventFilterManager.vue (CẬP NHẬT)
- Hoàn thiện giao diện và logic cho tab Bộ lọc Sự kiện.
-->
<template>
    <v-card flat>
        <v-card-title class="d-flex justify-space-between align-center">
            <span>Bộ lọc Sự kiện</span>
            <v-btn color="primary" @click="openDialog()">
                <v-icon left>mdi-plus</v-icon>
                Thêm Bộ lọc
            </v-btn>
        </v-card-title>
        <v-card-text>
            <p class="mb-4">Tạo các quy tắc để loại bỏ các sự kiện không mong muốn (ví dụ: traffic nội bộ, bot...). Các bộ lọc này sẽ được áp dụng cho toàn bộ website.</p>
            
            <v-alert v-if="websiteStore.error" type="error" class="mb-4" closable @click:close="websiteStore.clearMessages()">{{ websiteStore.error }}</v-alert>
            <v-alert v-if="websiteStore.successMessage" type="success" class="mb-4" closable @click:close="websiteStore.clearMessages()">{{ websiteStore.successMessage }}</v-alert>

            <v-data-table
                :headers="headers"
                :items="websiteStore.eventFilters"
                :loading="websiteStore.actionLoading"
                item-value="id"
                no-data-text="Chưa có bộ lọc nào."
            >
                <template v-slot:item.rules="{ item }">
                    <v-chip v-for="(rule, i) in item.rules" :key="i" class="mr-1 mb-1" size="small">
                        {{ rule.field }} {{ rule.operator }} {{ rule.value }}
                    </v-chip>
                </template>
                <template v-slot:item.actions="{ item }">
                    <v-icon small color="error" @click="confirmDelete(item)">mdi-delete</v-icon>
                </template>
            </v-data-table>
        </v-card-text>

        <!-- Dialog Thêm/Sửa Bộ lọc -->
        <v-dialog v-model="dialog" max-width="700px" persistent>
            <v-card>
                <v-card-title><span class="text-h5">Thêm Bộ lọc Mới</span></v-card-title>
                <v-card-text>
                    <v-form ref="form">
                        <v-text-field v-model="newItem.event_name" label="Tên sự kiện cần lọc" :rules="[rules.required]" variant="outlined" hint="Ví dụ: PageView, AddToCart"></v-text-field>
                        
                        <div v-for="(rule, index) in newItem.rules" :key="index" class="d-flex align-center my-2">
                            <v-text-field v-model="rule.field" label="Trường" density="compact" hide-details class="mr-2"></v-text-field>
                            <v-select v-model="rule.operator" :items="['gt', 'lt', 'gte', 'lte', 'eq']" label="Toán tử" density="compact" hide-details class="mr-2"></v-select>
                            <v-text-field v-model="rule.value" label="Giá trị" density="compact" hide-details class="mr-2"></v-text-field>
                            <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="removeRule(index)"></v-btn>
                        </div>
                        <v-btn text @click="addRule" class="mt-2">Thêm điều kiện</v-btn>
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="closeDialog">Hủy</v-btn>
                    <v-btn color="primary" @click="saveFilter" :loading="websiteStore.actionLoading">Lưu</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useWebsiteStore } from '@/stores/websiteStore';

const props = defineProps({ websiteId: { type: String, required: true } });
const websiteStore = useWebsiteStore();

const headers = [
    { title: 'Tên Sự kiện', value: 'event_name' },
    { title: 'Điều kiện', value: 'rules' },
    { title: 'Hành động', value: 'actions', sortable: false, align: 'end' },
];

const dialog = ref(false);
const form = ref(null);
const defaultItem = { event_name: '', rules: [{ field: 'time_on_page', operator: 'gt', value: '5' }] };
const newItem = reactive({ ...defaultItem });
const rules = { required: v => !!v || 'Trường này là bắt buộc.' };

const addRule = () => {
    newItem.rules.push({ field: '', operator: 'eq', value: '' });
};
const removeRule = (index) => {
    newItem.rules.splice(index, 1);
};

const openDialog = () => {
    Object.assign(newItem, defaultItem);
    dialog.value = true;
};
const closeDialog = () => {
    dialog.value = false;
    form.value?.resetValidation();
};

const saveFilter = async () => {
    const { valid } = await form.value.validate();
    if (!valid) return;
    const success = await websiteStore.addEventFilter(props.websiteId, newItem);
    if (success) closeDialog();
};

const confirmDelete = (item) => {
    if (confirm(`Bạn có chắc muốn xóa bộ lọc cho sự kiện "${item.event_name}" không?`)) {
        websiteStore.deleteEventFilter(props.websiteId, item.id);
    }
};
</script>