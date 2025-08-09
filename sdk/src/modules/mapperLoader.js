/**
 * Module này chịu trách nhiệm kích hoạt, tải và mount ứng dụng Visual Data Mapper.
 */
const MAPPER_ASSETS_BASE_URL = 'http://localhost:5173/dist'; 

class MapperLoader {
    constructor(apiService) {
        this.api = apiService;
    }

    /**
     * Bắt đầu quá trình kích hoạt Mapper.
     * @param {{token: string, fromSession: boolean}} setupState - Trạng thái thiết lập từ core.
     * @returns {Promise<boolean>} - Trả về true nếu thành công, false nếu thất bại.
     */
    async activate(setupState) {
        let verification = null;

        // (MỚI) Chỉ gọi API xác thực nếu không phải từ session
        if (setupState.fromSession) {
            console.log('LoomSky SDK: Activating from session, skipping token verification.');
            // Giả lập một đối tượng verification thành công
            verification = { success: true, websiteId: 'session-activated' }; 
        } else {
            console.log('LoomSky SDK: Activating from URL, verifying token...');
            verification = await this.api.verifySetupToken(setupState.token);
        }

        if (!verification) {
            console.error('LoomSky SDK: Mapper activation failed. Invalid token.');
            return false;
        }

        console.log('LoomSky SDK: Token accepted. Injecting Mapper Agent...');
        try {
            await this._mountApp({ 
                websiteId: verification.websiteId,
                api: this.api  // ✅ TRUYỀN API OBJECT VÀO PROPS
            });
            console.log('LoomSky SDK: Mapper Agent injected and mounted successfully.');
            return true;
        } catch (error) {
            console.error('LoomSky SDK: Failed to load Mapper Agent.', error);
            return false;
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
        const hostElement = document.createElement('div');
        hostElement.id = 'loomsky-mapper-host';
        document.body.appendChild(hostElement);

        const shadowRoot = hostElement.attachShadow({ mode: 'open' });
        const appMountPoint = document.createElement('div');
        
        // SỬA LỖI: Tải CSS trước và chờ cho nó tải xong
        await new Promise((resolve, reject) => {
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = `${MAPPER_ASSETS_BASE_URL}/mapper.css`;
            cssLink.onload = resolve; // Báo hiệu thành công khi CSS đã tải xong
            cssLink.onerror = reject; // Báo lỗi nếu không tải được CSS
            shadowRoot.appendChild(cssLink);
        });
        
        console.log('LoomSky SDK: Mapper CSS loaded successfully.');

        // Sau khi CSS đã sẵn sàng, mới tải JS
        await this._injectScript();
        console.log('LoomSky SDK: Mapper JS loaded successfully.');

        if (typeof window.mountDataMapperApp !== 'function') {
            throw new Error('LoomSky SDK: Mapper mount function not found.');
        }
        
        // Cuối cùng, mount ứng dụng Vue
        shadowRoot.appendChild(appMountPoint);
        window.mountDataMapperApp(appMountPoint, options);
    }
}

export default MapperLoader;