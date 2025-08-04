/*
File: sdk/src/modules/eventListener.js (CẬP NHẬT)
- Sửa lỗi race condition bằng cách kiểm tra document.readyState.
*/
import EventProcessor from './eventProcessor';
import PixelManager from './pixelManager';

class EventListener {
    constructor(apiService) {
        this.api = apiService;
        this.processor = null;
        this.pixelManager = null;
    }

    start(config, identity) {
        this.processor = new EventProcessor(config, identity);
        this.pixelManager = new PixelManager(this.api);

        console.log('LoomSky SDK: EventListener started.');

        this.pixelManager.injectPixels(config.pixels);

        // === BẮT ĐẦU SỬA LỖI ===
        // Xử lý sự kiện PageView một cách an toàn để tránh race condition
        if (document.readyState === 'complete') {
            this.handleEvent('PageView');
        } else {
            window.addEventListener('load', () => this.handleEvent('PageView'));
        }
        // === KẾT THÚC SỬA LỖI ===
    }

    handleEvent(eventName, eventData = {}) {
        const processedPayload = this.processor.process(eventName, eventData);

        if (processedPayload) {
            // Lớp 6: Gửi sự kiện
            this.pixelManager.track(eventName, processedPayload);
        }
    }
}

export default EventListener;