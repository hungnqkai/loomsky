/**
 * Module này chịu trách nhiệm kích hoạt, tải và mount ứng dụng Visual Data Mapper.
 */
const MAPPER_ASSETS_BASE_URL = 'https://cdn.loomsky.net/dist'; 

class MapperLoader {
    constructor(apiService) {
        this.api = apiService;
    }

    /**
     * Bắt đầu quá trình kích hoạt Mapper.
     * @param {string} token - Setup token từ URL.
     */
    async activate(token) {
        console.log('LoomSky SDK: Activating Mapper Mode...');
        const verification = await this.api.verifySetupToken(token);

        if (!verification || !verification.websiteId) {
            console.error('LoomSky SDK: Mapper activation failed. Invalid token.');
            return;
        }

        console.log('LoomSky SDK: Setup token verified. Injecting Mapper Agent from CDN...');
        try {
            await this._mountApp({ websiteId: verification.websiteId });
            console.log('LoomSky SDK: Mapper Agent injected and mounted successfully.');
        } catch (error) {
            console.error('LoomSky SDK: Failed to load Mapper Agent.', error);
        }
    }

    /**
     * Tải động file JS của mini-app.
     * @private
     */
    _injectScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `${MAPPER_ASSETS_BASE_URL}/mapper.js`;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Tạo Shadow DOM, chèn assets và mount ứng dụng Vue vào đó.
     * @param {object} options - Dữ liệu cần truyền vào mini-app.
     * @private
     */
    async _mountApp(options) {
        // Tải script trước để hàm mountDataMapperApp sẵn sàng
        await this._injectScript();

        if (typeof window.mountDataMapperApp !== 'function') {
            console.error('LoomSky SDK: Mapper mount function not found.');
            return;
        }

        const hostElement = document.createElement('div');
        hostElement.id = 'loomsky-mapper-host';
        document.body.appendChild(hostElement);

        const shadowRoot = hostElement.attachShadow({ mode: 'open' });
        
        // Chờ cho file CSS được tải xong hoàn toàn trước khi tiếp tục
        await new Promise((resolve, reject) => {
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = `${MAPPER_ASSETS_BASE_URL}/mapper.css`;
            cssLink.onload = resolve; // Báo hiệu thành công khi CSS đã tải xong
            cssLink.onerror = reject; // Báo lỗi nếu không tải được CSS
            shadowRoot.appendChild(cssLink);
        });

        // Bây giờ CSS đã sẵn sàng, chúng ta có thể an toàn mount ứng dụng
        const appMountPoint = document.createElement('div');
        shadowRoot.appendChild(appMountPoint);

        window.mountDataMapperApp(appMountPoint, {
            ...options,
            api: this.api
        });
    }
}

export default MapperLoader;
