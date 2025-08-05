/*
File: sdk/src/modules/eventListener.js (CẬP NHẬT)
- Tích hợp DataCollector để thu thập dữ liệu động từ trang.
*/
import EventProcessor from './eventProcessor';
import PixelManager from './pixelManager';
import DataCollector from './dataCollector'; // Import module mới

class EventListener {
    constructor(apiService) {
        this.api = apiService;
        this.processor = null;
        this.pixelManager = null;
        this.dataCollector = null;
        this.collectedData = {}; // Lưu trữ dữ liệu đã thu thập
    }

    start(config, identity) {
        this.processor = new EventProcessor(config, identity);
        this.pixelManager = new PixelManager(this.api);
        // (MỚI) Khởi tạo DataCollector với các ánh xạ từ config
        this.dataCollector = new DataCollector(config.dataMappings);

        console.log('LoomSky SDK: EventListener started.');

        this.pixelManager.injectPixels(config.pixels);

        const onPageReady = () => {
            // (MỚI) Thu thập dữ liệu ngay khi trang sẵn sàng
            this.collectedData = this.dataCollector.collectAll();
            // Gửi sự kiện PageView sau khi đã thu thập dữ liệu
            this.handleEvent('PageView');
        };

        // Xử lý sự kiện PageView một cách an toàn, đảm bảo DOM đã được tải
        if (document.readyState === 'complete') {
            onPageReady();
        } else {
            window.addEventListener('load', onPageReady);
        }
    }

    handleEvent(eventName, eventData = {}) {
        // (CẬP NHẬT) Truyền dữ liệu đã thu thập vào processor
        const processedPayload = this.processor.process(eventName, eventData, this.collectedData);

        if (processedPayload) {
            // Lớp 6: Gửi sự kiện
            this.pixelManager.track(eventName, processedPayload);
        }
    }
}

export default EventListener;
