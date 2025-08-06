/*
File: sdk/src/utils/api.js (CẬP NHẬT)
- Hoàn thiện hàm trackEvent.
*/
const API_BASE_URL = 'http://localhost:3000/api/v1';

class ApiService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        // (MỚI) Biến để lưu cache
        this.configCache = null; 
    }

    async getConfig() {
        if (this.configCache) {
            return this.configCache;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/sdk/config?apiKey=${this.apiKey}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            this.configCache = result.data; // Lưu vào cache
            return this.configCache;
        } catch (error) {
            console.error('LoomSky SDK: Failed to fetch configuration.', error);
            return null;
        }
    }

    /**
     * (MỚI) Gửi setup_token lên backend để xác thực.
     * @param {string} token - Token lấy từ URL parameter.
     * @returns {Promise<object|null>} - Dữ liệu xác thực hoặc null nếu thất bại.
     */
    async verifySetupToken(token) {
        try {
            const response = await fetch(`${API_BASE_URL}/sdk/verify-setup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('LoomSky SDK: Failed to verify setup token.', error);
            return null;
        }
    }

    /**
     * (MỚI) Lấy về danh sách dataMappings từ config đã được cache.
     * @returns {Promise<Array|null>}
     */
    async getDataMappings() {
        const config = await this.getConfig();
        return config ? config.dataMappings : null;
    }

    async trackEvent(payload) {
        try {
            const response = await fetch(`${API_BASE_URL}/track/event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey: this.apiKey,
                    ...payload,
                }),
            });

            if (response.status !== 202) { // 202 Accepted
                 const errorData = await response.json();
                 console.error('LoomSky SDK: Failed to track event.', errorData.error);
            } else {
                 console.log('LoomSky SDK: [TRACK] Event successfully sent to backend.');
            }
        } catch (error) {
            console.error('LoomSky SDK: Error sending event to backend.', error);
        }
    }
}

export default ApiService;