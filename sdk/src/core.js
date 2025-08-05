/*
File: sdk/src/core.js (CẬP NHẬT)
- Tách biệt logic: Chạy chế độ tracking thông thường hoặc kích hoạt Mapper Mode.
*/
import Identity from './modules/identity';
import EventListener from './modules/eventListener';
import ApiService from './utils/api';
import MapperLoader from './modules/mapperLoader'; // Import module mới

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
     * Lấy các tham số thiết lập từ URL.
     * @returns {{isSetupMode: boolean, token: string|null}}
     */
    getSetupParams() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            isSetupMode: urlParams.get('ls_setup_mode') === 'true',
            token: urlParams.get('ls_token')
        };
    }

    /**
     * Điểm khởi đầu của SDK.
     */
    async start() {
        if (!this.apiKey) {
            console.error('LoomSky SDK: API Key is missing. SDK will not start.');
            return;
        }

        const setupParams = this.getSetupParams();

        if (setupParams.isSetupMode) {
            // Chạy chế độ thiết lập
            const mapperLoader = new MapperLoader(this.api);
            await mapperLoader.activate(setupParams.token);
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
