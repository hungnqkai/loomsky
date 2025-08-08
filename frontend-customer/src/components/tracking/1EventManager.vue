<!-- 
File: src/components/tracking/EventManager.vue (CẬP NHẬT)
- Hoàn thiện giao diện và logic cho tab Sự kiện & Chuyển đổi.
-->
<template>
    <v-card flat>
        <v-card-title>Sự kiện & Chuyển đổi</v-card-title>
        <v-card-text>
            <p class="mb-4">Chọn các sự kiện bạn muốn tự động theo dõi và định nghĩa các mục tiêu chuyển đổi quan trọng. Các cài đặt này sẽ được áp dụng cho từng Pixel.</p>
            <v-select
                label="Chọn Pixel để cấu hình"
                :items="websiteStore.pixels"
                item-title="pixel_id"
                item-value="id"
                v-model="selectedPixelId"
                variant="outlined"
                no-data-text="Vui lòng thêm Pixel trước."
                class="mb-4"
            ></v-select>

            <div v-if="selectedPixel">
                <v-row>
                    <v-col cols="12" md="6">
                        <h3 class="text-h6 mb-2">Sự kiện Tiêu chuẩn & Hành vi</h3>
                        <v-list-item v-for="event in eventList" :key="event.value" density="compact">
                            <template v-slot:prepend>
                                <v-checkbox-btn v-model="selectedPixel.tracking_config.auto_events[event.value]"></v-checkbox-btn>
                            </template>
                            <v-list-item-title>{{ event.title }}</v-list-item-title>
                        </v-list-item>
                    </v-col>
                    <v-col cols="12" md="6">
                        <h3 class="text-h6 mb-2">Mục tiêu Chuyển đổi Tùy chỉnh</h3>
                        <!-- Giao diện CRUD cho mục tiêu chuyển đổi sẽ ở đây -->
                    </v-col>
                </v-row>
                
                <v-divider class="my-4"></v-divider>
                <v-btn color="primary" @click="saveConfig" :loading="websiteStore.actionLoading">Lưu Cấu hình cho Pixel này</v-btn>
            </div>
             <div v-else class="text-center text-medium-emphasis">
                <p>Vui lòng chọn một Pixel để bắt đầu cấu hình.</p>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useWebsiteStore } from '@/stores/websiteStore';
import _ from 'lodash';

const props = defineProps({
  websiteId: { type: String, required: true },
  platformType: { type: String, default: 'html' }
});
const websiteStore = useWebsiteStore();
const selectedPixelId = ref(null);
const selectedPixel = ref(null);

const eventList = [
    { title: 'Xem nội dung (ViewContent)', value: 'ViewContent' },
    { title: 'Thêm vào giỏ hàng (AddToCart)', value: 'AddToCart' },
    { title: 'Bắt đầu thanh toán (InitiateCheckout)', value: 'InitiateCheckout' },
    { title: 'Thêm thông tin thanh toán (AddPaymentInfo)', value: 'AddPaymentInfo' },
    { title: 'Mua hàng (Purchase)', value: 'Purchase' },
    { title: 'Khách hàng tiềm năng (Lead)', value: 'Lead' },
    { title: 'Cuộn trang 25%', value: 'ScrollDepth25' },
    { title: 'Ở lại trang 15 giây', value: 'TimeOnPage15s' },
];

watch(() => websiteStore.pixels, (newPixels) => {
    if (newPixels && newPixels.length > 0 && !selectedPixelId.value) {
        selectedPixelId.value = newPixels[0].id;
    }
}, { immediate: true, deep: true });

watch(selectedPixelId, (newId) => {
    if (newId) {
        const foundPixel = websiteStore.pixels.find(p => p.id === newId);
        if (foundPixel) {
            // Đảm bảo cấu trúc tracking_config tồn tại và clone để chỉnh sửa
            const clonedPixel = _.cloneDeep(foundPixel);
            if (!clonedPixel.tracking_config) clonedPixel.tracking_config = {};
            if (!clonedPixel.tracking_config.auto_events) clonedPixel.tracking_config.auto_events = {};
            if (!clonedPixel.tracking_config.conversions) clonedPixel.tracking_config.conversions = [];
            selectedPixel.value = clonedPixel;
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