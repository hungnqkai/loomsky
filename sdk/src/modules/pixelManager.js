/*
File: sdk/src/modules/pixelManager.js (MỚI)
- Module chuyên dụng để quản lý việc chèn và tương tác với Facebook Pixel.
*/
class PixelManager {
    constructor(apiService) {
        this.loadedPixels = new Set();
        this.api = apiService;
    }

    // Lớp 1: Chèn Pixel vào trang nếu thỏa mãn điều kiện
    injectPixels(pixelsConfig) {
        if (!pixelsConfig || pixelsConfig.length === 0) return;

        const dataLayer = window.loomskyDataLayer || {};
        const currentUrl = window.location.href;

        pixelsConfig.forEach(pixel => {
            if (this.shouldActivate(pixel.activation_rules, dataLayer, currentUrl)) {
                if (!this.loadedPixels.has(pixel.pixel_id)) {
                    this.loadPixelScript(pixel.pixel_id);
                    this.loadedPixels.add(pixel.pixel_id);
                    console.log(`LoomSky SDK: Pixel ${pixel.pixel_id} injected.`);
                }
            }
        });
    }

    loadPixelScript(pixelId) {
        if (window.fbq) { // Nếu fbq đã tồn tại, chỉ cần init pixel mới
            fbq('init', pixelId);
            return;
        };
        
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', pixelId);
    }

    shouldActivate(rules, dataLayer, currentUrl) {
        if (!rules || rules.length === 0) return true; // Kích hoạt nếu không có rule nào
        
        return rules.some(rule => {
            if (rule.type === 'url_contains' && typeof rule.value === 'string') {
                return currentUrl.includes(rule.value);
            }
            // Logic cho các rule khác (wordpress_category...) sẽ được thêm ở đây
            return false;
        });
    }

    // Gửi sự kiện tới các pixel đang hoạt động
    track(eventName, payload) {
        if (!window.fbq) return;

        this.loadedPixels.forEach(pixelId => {
            const eventId = `evt.${pixelId}.${Date.now()}`;
            console.log(`LoomSky SDK: Tracking for Pixel ${pixelId}`, { eventName, eventId });
            fbq('track', eventName, payload.properties.ecommerce || {}, { eventID: eventId });

            // Gửi sự kiện này về backend cho CAPI
            const capiPayload = {
                ...payload,
                pixel_id: pixelId,
                event_id: eventId
            };
            this.api.trackEvent(capiPayload);
        });
    }
}

export default PixelManager;