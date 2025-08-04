/*
File: sdk/src/modules/eventProcessor.js (CẬP NHẬT)
- Thêm import cho CookieManager.
*/
import CookieManager from '../utils/cookies';

class EventProcessor {
    constructor(config, identity) {
        this.config = config;
        this.identity = identity;
    }

    process(eventName, eventData) {
        console.log(`LoomSky SDK: Processing event "${eventName}"...`);

        // Lớp 3: Kiểm tra sự kiện có được bật hay không (kiểm tra trên từng pixel)
        // Logic này sẽ được tích hợp trong PixelManager sau khi có cấu hình tracking_config hoàn chỉnh

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
        
        const payload = this.buildPayload(eventName, eventData);
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
            // Logic kiểm tra IP sẽ cần gọi API ngoài hoặc có sẵn
            return false;
        });
    }

    passEventFilters(eventName, eventData) {
        const filters = this.config.eventFilters.filter(f => f.event_name === eventName);
        if (filters.length === 0) return true;
        // Logic kiểm tra các rule trong filter sẽ được thêm ở đây
        return true;
    }

    buildPayload(eventName, eventData) {
        return {
            eventName,
            properties: {
                context: {
                    page_url: window.location.href,
                    page_title: document.title,
                    platform: window.loomskyDataLayer?.platform || 'unknown',
                },
                user: {
                    ls_user_id: this.identity.userId,
                    authenticated_user_id: window.loomskyDataLayer?.user?.wp_user_id || null,
                },
                facebook: {
                    fbp: CookieManager.get('_fbp'),
                    fbc: CookieManager.get('_fbc'),
                },
                ecommerce: window.loomskyDataLayer?.ecommerce || {},
                ...eventData,
            },
            sessionId: this.identity.sessionId,
            timestamp: new Date().toISOString(),
        };
    }
}

export default EventProcessor;