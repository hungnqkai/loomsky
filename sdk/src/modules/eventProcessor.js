/*
File: sdk/src/modules/eventProcessor.js (CẬP NHẬT)
- Bổ sung logic để đính kèm dữ liệu được thu thập tự động vào payload sự kiện.
*/
import CookieManager from '../utils/cookies';

class EventProcessor {
    constructor(config, identity) {
        this.config = config;
        this.identity = identity;
    }

    /**
     * @param {string} eventName - Tên sự kiện.
     * @param {object} eventData - Dữ liệu sự kiện tùy chỉnh.
     * @param {object} collectedData - Dữ liệu được thu thập tự động từ DataCollector.
     */
    process(eventName, eventData, collectedData = {}) {
        console.log(`LoomSky SDK: Processing event "${eventName}"...`);

        // Lớp 4: Kiểm tra Blacklist & Quyền
        const planAllowsBlacklist = this.config.planFeatures?.tracking?.blacklist?.enabled === true;
        if (planAllowsBlacklist && this.isBlacklisted()) {
            console.log(`LoomSky SDK: User is blacklisted. Skipping event.`);
            return null;
        }

        // Lớp 5: Kiểm tra Bộ lọc Sự kiện & Quyền
        const planAllowsFilters = this.config.planFeatures?.tracking?.event_filters?.enabled === true;
        if (planAllowsFilters && !this.passEventFilters(eventName, eventData)) {
             console.log(`LoomSky SDK: Event did not pass event filters. Skipping.`);
             return null;
        }
        
        // (CẬP NHẬT) Truyền collectedData vào hàm buildPayload
        const payload = this.buildPayload(eventName, eventData, collectedData);
        console.log(`LoomSky SDK: Event "${eventName}" passed all checks.`, { payload });
        return payload;
    }

    isBlacklisted() {
        const blacklist = this.config.blacklist || [];
        if (blacklist.length === 0) return false;
        
        return blacklist.some(entry => {
            if (entry.type === 'user_id' && entry.value === this.identity.userId) {
                return true;
            }
            return false;
        });
    }

    passEventFilters(eventName, eventData) {
        const filters = this.config.eventFilters.filter(f => f.event_name === eventName);
        if (filters.length === 0) return true;
        return true;
    }

    buildPayload(eventName, eventData, collectedData) {
        const dataLayer = window.loomskyDataLayer || {};
        return {
            eventName,
            properties: {
                context: {
                    page_url: window.location.href,
                    page_title: document.title,
                    platform: dataLayer.platform || 'unknown',
                    // (MỚI) Đính kèm dữ liệu đã thu thập vào context
                    mapped_data: collectedData 
                },
                user: {
                    ls_user_id: this.identity.userId,
                    authenticated_user_id: dataLayer.user?.wp_user_id || null,
                },
                facebook: {
                    fbp: CookieManager.get('_fbp'),
                    fbc: CookieManager.get('_fbc'),
                },
                // Hợp nhất dữ liệu từ nhiều nguồn: dataLayer, dữ liệu tùy chỉnh, và dữ liệu thu thập
                ecommerce: {
                    ...dataLayer.ecommerce,
                    ...collectedData, // Có thể ghi đè dataLayer nếu cần
                },
                ...eventData,
            },
            sessionId: this.identity.sessionId,
            timestamp: new Date().toISOString(),
        };
    }
}

export default EventProcessor;
