/*
File: sdk/src/core.js (ĐÃ NÂNG CẤP)
- Tích hợp sessionStorage để duy trì Chế độ Thiết lập qua nhiều trang.
*/
import Identity from './modules/identity';
import EventListener from './modules/eventListener';
import ApiService from './utils/api';
import MapperLoader from './modules/mapperLoader';

// (MỚI) Key để lưu trữ trong sessionStorage
const SESSION_STORAGE_KEY = 'loomskySetupSession';

class Core {
    constructor() {
        console.log('LoomSky SDK: Core initializing...');
        this.apiKey = this.getApiKey();
        
        if (this.apiKey) {
            this.api = new ApiService(this.apiKey);
        }
    }

    getApiKey() {
        return document.currentScript?.getAttribute('data-api-key') || null;
    }

    /**
     * (CẬP NHẬT) Lấy trạng thái thiết lập từ sessionStorage hoặc URL.
     * @returns {{isSetupMode: boolean, token: string|null}}
     */
    getSetupState() {
        try {
            const sessionData = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY));
            if (sessionData && sessionData.isActive && sessionData.token) {
                console.log('LoomSky SDK: Found active setup session in sessionStorage.');
                // (MỚI) Thêm `fromSession` để báo cho MapperLoader biết
                return { isSetupMode: true, token: sessionData.token, fromSession: true };
            }
        } catch (e) { /* ... */ }
        
        const urlParams = new URLSearchParams(window.location.search);
        const isUrlMode = urlParams.get('ls_setup_mode') === 'true';
        const urlToken = urlParams.get('ls_token');

        if (isUrlMode && urlToken) {
            console.log('LoomSky SDK: Found setup params in URL.');
            return { isSetupMode: true, token: urlToken, fromSession: false };
        }

        return { isSetupMode: false, token: null };
    }

    /**
     * Điểm khởi đầu của SDK.
     */
    async start() {
        if (!this.apiKey) { /* ... */ return; }

        const setupState = this.getSetupState();

        if (setupState.isSetupMode) {
            console.log('LoomSky SDK: Activating Mapper Mode...');
            const mapperLoader = new MapperLoader(this.api);
            
            // (CẬP NHẬT) Truyền cả object `setupState` vào hàm activate
            const isActivated = await mapperLoader.activate(setupState);
            
            // Chỉ lưu session nếu đây là lần đầu kích hoạt từ URL
            if (isActivated && !setupState.fromSession) {
                const sessionData = { isActive: true, token: setupState.token };
                sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
                console.log('LoomSky SDK: Setup session saved.');
            }
            
            if (isActivated) {
                // Luôn lắng nghe sự kiện đóng, dù là từ URL hay session
                window.addEventListener('message', (event) => {
                    if (event.data?.type === 'LOOMSKY_CLOSE_MAPPER') {
                        console.log('LoomSky SDK: Closing setup session.');
                        sessionStorage.removeItem(SESSION_STORAGE_KEY);
                    }
                });
            } else if (!setupState.fromSession) {
                // Chỉ xóa session nếu token từ URL không hợp lệ
                console.log('LoomSky SDK: Invalid token from URL, clearing session.');
                sessionStorage.removeItem(SESSION_STORAGE_KEY);
            }
        } else {
            // Chạy chế độ tracking thông thường
            console.log('LoomSky SDK: Starting normal tracking...');
            const config = await this.api.getConfig();
            
            if (config) {
                console.log('LoomSky SDK: Configuration loaded successfully.', config);
                const identity = new Identity();
                const eventListener = new EventListener(this.api);
                eventListener.start(config, identity);
                console.log('LoomSky SDK: Started successfully.');
            } else {
                console.error('LoomSky SDK: Could not load configuration. SDK is disabled.');
            }
        }
    }
}

export default Core;