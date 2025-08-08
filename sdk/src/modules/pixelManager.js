// File: sdk/src/modules/pixelManager.js (FIXED)
/*
✅ FIX: Add missing getPixelIds() method and improve error handling
*/

class PixelManager {
    constructor(apiService) {
        this.loadedPixels = new Set();
        this.api = apiService;
    }

    // ✅ NEW: Add missing getPixelIds method
    getPixelIds() {
        return Array.from(this.loadedPixels);
    }

    // ✅ IMPROVED: Better error handling
    injectPixels(pixelsConfig) {
        if (!pixelsConfig || pixelsConfig.length === 0) {
            console.log('LoomSky SDK: No pixels to inject');
            return;
        }

        const dataLayer = window.loomskyDataLayer || {};
        const currentUrl = window.location.href;

        pixelsConfig.forEach(pixel => {
            try {
                if (this.shouldActivate(pixel.activation_rules, dataLayer, currentUrl)) {
                    if (!this.loadedPixels.has(pixel.pixel_id)) {
                        this.loadPixelScript(pixel.pixel_id);
                        this.loadedPixels.add(pixel.pixel_id);
                        console.log(`LoomSky SDK: Pixel ${pixel.pixel_id} injected.`);
                    }
                }
            } catch (error) {
                console.error(`LoomSky SDK: Error injecting pixel ${pixel.pixel_id}:`, error);
            }
        });
    }

    loadPixelScript(pixelId) {
        try {
            if (window.fbq) { 
                // If fbq already exists, just init new pixel
                fbq('init', pixelId);
                return;
            }
            
            // Load Facebook Pixel script
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', pixelId);
        } catch (error) {
            console.error(`LoomSky SDK: Error loading pixel script for ${pixelId}:`, error);
        }
    }

    shouldActivate(rules, dataLayer, currentUrl) {
        if (!rules || rules.length === 0) return true;
        
        return rules.some(rule => {
            try {
                if (rule.type === 'url_contains' && typeof rule.value === 'string') {
                    return currentUrl.includes(rule.value);
                }
                // Add more rule types here
                return false;
            } catch (error) {
                console.error('LoomSky SDK: Error evaluating activation rule:', error);
                return false;
            }
        });
    }

    // ✅ IMPROVED: Better error handling for tracking
    track(eventName, payload) {
        if (!window.fbq) return;
        this.loadedPixels.forEach(pixelId => {
            const eventId = `evt.${pixelId}.${Date.now()}`;
            console.log(`LoomSky SDK: Tracking for Pixel ${pixelId}`, { eventName, eventId });
            
            // ✅ Only send to Facebook Pixel
            fbq('track', eventName, payload.properties?.ecommerce || {}, { eventID: eventId });
            
            // ✅ EventListener handles backend API calls
        });
    }

    // ✅ NEW: Get status info for debugging
    getStatus() {
        return {
            loaded_pixels: Array.from(this.loadedPixels),
            pixel_count: this.loadedPixels.size,
            fbq_available: typeof window.fbq !== 'undefined'
        };
    }
}

export default PixelManager;