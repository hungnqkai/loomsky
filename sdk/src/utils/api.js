/*
File: sdk/src/utils/api.js (CẬP NHẬT)
- Hoàn thiện hàm trackEvent.
*/
const API_BASE_URL = 'http://localhost:3000/api/v1';

class ApiService {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async getConfig() {
        try {
            const response = await fetch(`${API_BASE_URL}/sdk/config?apiKey=${this.apiKey}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('LoomSky SDK: Failed to fetch configuration.', error);
            return null;
        }
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