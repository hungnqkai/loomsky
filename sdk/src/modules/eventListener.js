/*
File: sdk/src/modules/eventListener.js (UPDATED)
- Enhanced với simplified DataCollector integration
- Improved data collection timing và error handling
- Support for real-time data re-collection
*/
import EventProcessor from './eventProcessor.js';
import PixelManager from './pixelManager.js';
import DataCollector from './dataCollector.js';

class EventListener {
    constructor(apiService) {
        this.api = apiService;
        this.processor = null;
        this.pixelManager = null;
        this.dataCollector = null;
        this.manualData = {}; // Cached manual mapping data
        this.isReady = false;
    }

    start(config, identity) {
        console.log('LoomSky SDK: EventListener starting with enhanced data collection...');
        
        this.processor = new EventProcessor(config, identity);
        this.pixelManager = new PixelManager(this.api);
        
        // Initialize simplified DataCollector với manual mappings
        this.dataCollector = new DataCollector(config.dataMappings || []);

        console.log('LoomSky SDK: EventListener started successfully.');

        // Inject Facebook pixels
        this.pixelManager.injectPixels(config.pixels);

        // Setup page ready handling
        this._setupPageReadyHandling();
    }

    /**
     * Enhanced page ready handling với better timing
     * @private
     */
    _setupPageReadyHandling() {
        const onPageReady = () => {
            this._collectInitialData();
            this.isReady = true;
            
            // Send PageView event after data collection
            this.handleEvent('PageView');
            
            // Setup dynamic data collection for SPAs
            this._setupDynamicCollection();
        };

        // Handle different DOM states
        if (document.readyState === 'complete') {
            // DOM already loaded
            setTimeout(onPageReady, 100); // Small delay for other scripts
        } else if (document.readyState === 'loading') {
            // Still loading, wait for DOMContentLoaded
            document.addEventListener('DOMContentLoaded', onPageReady);
        } else {
            // Interactive, wait for load
            window.addEventListener('load', onPageReady);
        }
    }

    /**
     * Collect initial manual mapping data
     * @private
     */
    _collectInitialData() {
        try {
            console.log('LoomSky SDK: Collecting initial manual mapping data...');
            
            const result = this.dataCollector.collectAll();
            this.manualData = result;
            
            // Log collection statistics
            const stats = this.dataCollector.getStats();
            console.log(`LoomSky SDK: Initial data collection complete. Success rate: ${stats.success_rate.toFixed(1)}%`);
            
            if (stats.error_count > 0) {
                console.warn(`LoomSky SDK: ${stats.error_count} data mapping errors detected`);
            }
            
        } catch (error) {
            console.error('LoomSky SDK: Failed to collect initial data:', error);
            this.manualData = { data: {}, metadata: { errors: [error.message] } };
        }
    }

    /**
     * Setup dynamic data collection for SPAs
     * @private
     */
    _setupDynamicCollection() {
        // Re-collect data when URL changes (for SPAs)
        let currentUrl = window.location.href;
        
        const checkUrlChange = () => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                console.log('LoomSky SDK: URL changed, re-collecting data...');
                this._collectInitialData();
            }
        };
        
        // Check for URL changes periodically (lightweight SPA detection)
        setInterval(checkUrlChange, 2000);
        
        // Listen for popstate (back/forward buttons)
        window.addEventListener('popstate', () => {
            setTimeout(() => {
                this._collectInitialData();
            }, 100);
        });
    }

    /**
     * Enhanced event handling với real-time data collection
     * @param {string} eventName - Standardized event name
     * @param {object} eventData - Custom event data
     * @param {boolean} recollectData - Whether to re-collect manual data
     */
    handleEvent(eventName, eventData = {}, recollectData = false) {
        try {
            // Optional real-time data re-collection
            let currentManualData = this.manualData;
            
            if (recollectData && this.isReady) {
                console.log('LoomSky SDK: Re-collecting manual data for event:', eventName);
                currentManualData = this.dataCollector.collectAll();
            }

            // Process event với enhanced processor
            const processedPayload = this.processor.process(eventName, eventData, currentManualData);

            if (processedPayload) {
                // Send to pixels và backend
                this._sendEvent(eventName, processedPayload);
            } else {
                console.warn(`LoomSky SDK: Event "${eventName}" was filtered out or failed processing`);
            }

        } catch (error) {
            console.error(`LoomSky SDK: Error handling event "${eventName}":`, error);
        }
    }

    /**
     * Send event to pixels và API
     * @param {string} eventName 
     * @param {object} payload 
     * @private
     */
    _sendEvent(eventName, payload) {
        // Send to Facebook pixel
        this.pixelManager.track(eventName, payload);
        
        // Send to backend API
        this._sendToBackend(eventName, payload);
    }

    /**
     * Send event data to backend
     * @param {string} eventName 
     * @param {object} payload 
     * @private
     */
    _sendToBackend(eventName, payload) {
        try {
            // Add API-specific fields
            const apiPayload = {
                apiKey: this.api.apiKey,
                eventName: eventName,
                properties: payload.properties,
                sessionId: payload.sessionId,
                timestamp: payload.timestamp,
                pixel_id: this._getPrimaryPixelId(),
                event_id: this._generateEventId()
            };

            // Send to backend (async, non-blocking)
            this.api.trackEvent(apiPayload).catch(error => {
                console.error('LoomSky SDK: Failed to send event to backend:', error);
            });

        } catch (error) {
            console.error('LoomSky SDK: Error sending to backend:', error);
        }
    }

    /**
     * Get primary pixel ID from configuration
     * @returns {string}
     * @private
     */
    _getPrimaryPixelId() {
        // Get first pixel ID from pixel manager
        return this.pixelManager?.getPixelIds()?.[0] || 'unknown';
    }

    /**
     * Generate unique event ID
     * @returns {string}
     * @private
     */
    _generateEventId() {
        return Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Test manual data collection
     * @returns {object} - Collection result và stats
     */
    testDataCollection() {
        const result = this.dataCollector.collectAll();
        const stats = this.dataCollector.getStats();
        
        return {
            data: result.data,
            metadata: result.metadata,
            stats: stats
        };
    }

    /**
     * Test a specific selector
     * @param {string} selector - CSS selector to test
     * @returns {object} - Test result
     */
    testSelector(selector) {
        return this.dataCollector.testSelector(selector);
    }

    /**
     * Get current performance metrics
     * @returns {object}
     */
    getPerformanceMetrics() {
        return {
            eventListener: {
                ready: this.isReady,
                last_data_collection: this.manualData.metadata?.collection_time
            },
            eventProcessor: this.processor?.getPerformanceMetrics?.() || {},
            dataCollector: this.dataCollector?.getStats?.() || {}
        };
    }
}

export default EventListener;
