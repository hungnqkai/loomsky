<!-- 
File: src/components/tracking/EventManager.vue (MỚI)
- Component quản lý Sự kiện & Chuyển đổi.
-->
<template>
    <v-card flat>
        <v-card-title>Sự kiện & Chuyển đổi</v-card-title>
        <v-card-text>
            <p class="mb-4">Chọn các sự kiện bạn muốn tự động theo dõi và định nghĩa các mục tiêu chuyển đổi quan trọng cho website của bạn. Các cài đặt này sẽ được áp dụng cho từng Pixel.</p>
            <v-select
                label="Chọn Pixel để cấu hình"
                :items="websiteStore.pixels"
                item-title="pixel_id"
                item-value="id"
                v-model="selectedPixelId"
                variant="outlined"
                no-data-text="Vui lòng thêm Pixel trước."
            ></v-select>

            <div v-if="selectedPixel">
                <v-divider class="my-4"></v-divider>
                <h3 class="text-h6 mb-2">Sự kiện Tự động</h3>
                <v-switch v-model="selectedPixel.tracking_config.auto_events.scroll_depth_25" label="Cuộn trang 25%" color="primary" inset></v-switch>
                <v-switch v-model="selectedPixel.tracking_config.auto_events.time_on_page_10s" label="Ở lại trang 10 giây" color="primary" inset></v-switch>
                
                <v-divider class="my-4"></v-divider>
                <h3 class="text-h6 mb-2">Mục tiêu Chuyển đổi</h3>
                <!-- Bảng hiển thị mục tiêu -->

                <v-btn color="primary" @click="saveConfig" :loading="websiteStore.actionLoading">Lưu Cấu hình cho Pixel này</v-btn>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useWebsiteStore } from '@/stores/websiteStore';
import _ from 'lodash';

const props = defineProps({ websiteId: { type: String, required: true } });
const websiteStore = useWebsiteStore();
const selectedPixelId = ref(null);

// Tạo một bản sao sâu để chỉnh sửa, tránh thay đổi trực tiếp state
const selectedPixel = ref(null);

watch(() => websiteStore.pixels, (newPixels) => {
    if (newPixels.length > 0 && !selectedPixelId.value) {
        selectedPixelId.value = newPixels[0].id;
    }
}, { immediate: true });

watch(selectedPixelId, (newId) => {
    if (newId) {
        const foundPixel = websiteStore.pixels.find(p => p.id === newId);
        if (foundPixel) {
            // Đảm bảo cấu trúc tracking_config tồn tại
            if (!foundPixel.tracking_config) foundPixel.tracking_config = {};
            if (!foundPixel.tracking_config.auto_events) foundPixel.tracking_config.auto_events = {};
            if (!foundPixel.tracking_config.conversions) foundPixel.tracking_config.conversions = [];
            selectedPixel.value = _.cloneDeep(foundPixel);
        }
    } else {
        selectedPixel.value = null;
    }
}, { immediate: true });

const saveConfig = async () => {
    if (selectedPixel.value) {
        await websiteStore.updatePixel(props.websiteId, selectedPixel.value.id, {
            tracking_config: selectedPixel.value.tracking_config
        });
    }
};
</script>