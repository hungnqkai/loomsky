/*
File: sdk/src/modules/eventProcessor.js (ENHANCED)
- Enhanced với Facebook CAPI data preparation
- Standardized data merging từ multiple sources
- Improved payload building và validation
*/
import CookieManager from '../utils/cookies.js';
import { 
    PLATFORM_TEMPLATES, 
    DATA_MERGE_STRATEGY, 
    DATA_VALIDATION,
    FACEBOOK_CAPI,
    DATA_PRIORITY 
} from '../constants/dataStandards.js';

class EventProcessor {
    constructor(config, identity) {
        this.config = config;
        this.identity = identity;
        this.performanceMetrics = {
            processedEvents: 0,
            averageProcessingTime: 0,
            lastProcessingTime: 0
        };
    }

    /**
     * Enhanced event processing với standardized data merging
     * @param {string} eventName - Event name
     * @param {object} eventData - Custom event data
     * @param {object} manualData - Data from manual mappings
     * @returns {object|null} - Processed payload or null
     */
    process(eventName, eventData = {}, manualData = {}) {
        const startTime = Date.now();
        console.log(`LoomSky SDK: Processing standardized event "${eventName}"...`);

        try {
            // Layer 1: Security checks
            if (!this._passSecurityChecks(eventName, eventData)) {
                return null;
            }

            // Layer 2: Data collection và merging
            const mergedData = this._mergeDataSources(manualData);
            
            // Layer 3: Build enhanced payload
            const payload = this._buildEnhancedPayload(eventName, eventData, mergedData);
            
            // Layer 4: Facebook CAPI preparation
            this._prepareFacebookCAPI(payload, eventName, mergedData);
            
            // Layer 5: Quality validation
            this._validatePayloadQuality(payload);
            
            // Performance tracking
            this._trackPerformance(startTime);
            
            console.log(`LoomSky SDK: Event "${eventName}" processed successfully.`);
            return payload;
            
        } catch (error) {
            console.error(`LoomSky SDK: Error processing event "${eventName}":`, error);
            return null;
        }
    }

    /**
     * Security checks: blacklist và event filters
     * @param {string} eventName 
     * @param {object} eventData 
     * @returns {boolean}
     * @private
     */
    _passSecurityChecks(eventName, eventData) {
        // Blacklist check
        const planAllowsBlacklist = this.config.planFeatures?.tracking?.blacklist?.enabled === true;
        if (planAllowsBlacklist && this.isBlacklisted()) {
            console.log(`LoomSky SDK: User is blacklisted. Skipping event.`);
            return false;
        }

        // Event filters check
        const planAllowsFilters = this.config.planFeatures?.tracking?.event_filters?.enabled === true;
        if (planAllowsFilters && !this.passEventFilters(eventName, eventData)) {
             console.log(`LoomSky SDK: Event did not pass event filters. Skipping.`);
             return false;
        }
        
        return true;
    }

    /**
     * Merge data from multiple sources based on priority
     * @param {object} manualData - Manual mapping data với metadata
     * @returns {object} - Merged data
     * @private
     */
    _mergeDataSources(manualData) {
        const dataSources = [];
        
        // 1. Manual mappings (highest priority)
        if (manualData.data && Object.keys(manualData.data).length > 0) {
            dataSources.push({
                data: manualData.data,
                priority: DATA_PRIORITY.MANUAL_MAPPING,
                source: 'manual_mapping'
            });
        }
        
        // 2. Platform data layer (medium priority)  
        const platformData = this._extractPlatformData();
        if (platformData && Object.keys(platformData).length > 0) {
            dataSources.push({
                data: platformData,
                priority: DATA_PRIORITY.PLATFORM_DATA,
                source: 'platform_data'
            });
        }
        
        // 3. Basic HTML fallback (low priority)
        const fallbackData = this._extractFallbackData();
        if (fallbackData && Object.keys(fallbackData).length > 0) {
            dataSources.push({
                data: fallbackData,
                priority: DATA_PRIORITY.FALLBACK_DATA,
                source: 'fallback_data'
            });
        }
        
        return DATA_MERGE_STRATEGY.merge(dataSources);
    }

    /**
     * Extract platform-specific data từ loomskyDataLayer
     * @returns {object}
     * @private
     */
    _extractPlatformData() {
        const dataLayer = window.loomskyDataLayer || {};
        
        // Platform-specific extraction
        switch (dataLayer.platform) {
            case 'wordpress':
                return this._extractWordPressData(dataLayer);
            case 'shopify':
                return this._extractShopifyData(dataLayer);
            default:
                return dataLayer.ecommerce || {};
        }
    }

    /**
     * Extract WordPress/WooCommerce data
     * @param {object} dataLayer
     * @returns {object}
     * @private
     */
    _extractWordPressData(dataLayer) {
        return {
            ...dataLayer.ecommerce,
            user_id: dataLayer.user?.user_id,
            user_email: dataLayer.user?.email,
            is_logged_in: dataLayer.user?.is_logged_in,
            page_type: dataLayer.page_type
        };
    }

    /**
     * Extract Shopify data
     * @param {object} dataLayer
     * @returns {object}
     * @private
     */
    _extractShopifyData(dataLayer) {
        return {
            ...dataLayer.ecommerce,
            user_id: dataLayer.user?.user_id,
            user_email: dataLayer.user?.email,
            is_logged_in: dataLayer.user?.is_logged_in,
            page_type: dataLayer.page_type
        };
    }

    /**
     * Extract basic fallback data từ DOM
     * @returns {object}
     * @private
     */
    _extractFallbackData() {
        const fallback = {};
        
        // Basic meta tag extraction
        const titleEl = document.querySelector('title');
        if (titleEl) {
            fallback.page_title = titleEl.textContent;
        }
        
        // Look for common price patterns
        const priceEl = document.querySelector('[data-price], .price, .product-price');
        if (priceEl) {
            const priceText = priceEl.textContent || priceEl.getAttribute('data-price');
            if (priceText) {
                const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
                if (!isNaN(price)) {
                    fallback.product_price = price;
                }
            }
        }
        
        return fallback;
    }

    /**
     * Enhanced payload building với merged data
     * @param {string} eventName 
     * @param {object} eventData 
     * @param {object} mergedData 
     * @returns {object}
     * @private
     */
    _buildEnhancedPayload(eventName, eventData, mergedData) {
        const dataLayer = window.loomskyDataLayer || {};
        
        return {
            eventName,
            properties: {
                context: {
                    page_url: window.location.href,
                    page_title: document.title,
                    platform: dataLayer.platform || 'html',
                    timestamp: new Date().toISOString(),
                    // Data collection metadata
                    data_sources: mergedData._collection_meta?.sources || {},
                    collection_timestamp: mergedData._collection_meta?.timestamp
                },
                user: {
                    ls_user_id: this.identity.userId,
                    authenticated_user_id: mergedData.user_id || dataLayer.user?.user_id || null,
                    is_logged_in: mergedData.is_logged_in || dataLayer.user?.is_logged_in || false,
                    user_agent: navigator.userAgent
                },
                facebook: {
                    fbp: CookieManager.get('_fbp'),
                    fbc: CookieManager.get('_fbc')
                },
                // Enhanced ecommerce data từ merged sources
                ecommerce: this._buildEcommerceData(mergedData, eventData),
                // Custom event data (highest priority)
                ...eventData
            },
            sessionId: this.identity.sessionId,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Build enhanced ecommerce data object
     * @param {object} mergedData 
     * @param {object} eventData 
     * @returns {object}
     * @private
     */
    _buildEcommerceData(mergedData, eventData) {
        const ecommerceData = {};
        
        // Standard ecommerce fields
        const ecomFields = [
            'product_id', 'product_name', 'product_price', 'product_category', 
            'product_brand', 'cart_total', 'currency', 'order_id'
        ];
        
        ecomFields.forEach(field => {
            if (mergedData[field] !== undefined && mergedData[field] !== null) {
                ecommerceData[field] = mergedData[field];
            }
        });
        
        // Add currency default
        if (!ecommerceData.currency) {
            ecommerceData.currency = 'USD';
        }
        
        return ecommerceData;
    }

    /**
     * Prepare Facebook CAPI data
     * @param {object} payload 
     * @param {string} eventName 
     * @param {object} mergedData 
     * @private
     */
    _prepareFacebookCAPI(payload, eventName, mergedData) {
        try {
            const capiData = FACEBOOK_CAPI.prepareData(mergedData, eventName);
            
            // Add to payload
            payload.properties.facebook.capi_data = capiData;
            payload.properties.facebook.capi_ready = Object.keys(capiData).length > 0;
            
        } catch (error) {
            console.warn('LoomSky SDK: Facebook CAPI preparation failed:', error);
            payload.properties.facebook.capi_ready = false;
        }
    }

    /**
     * Validate payload quality
     * @param {object} payload 
     * @private
     */
    _validatePayloadQuality(payload) {
        try {
            const quality = DATA_VALIDATION.calculateQuality(payload.properties);
            
            payload.properties._quality = {
                score: quality.score,
                issues: quality.issues,
                validated_at: new Date().toISOString()
            };
            
            if (quality.score < 70) {
                console.warn(`LoomSky SDK: Low data quality score: ${quality.score}%`, quality.issues);
            }
            
        } catch (error) {
            console.warn('LoomSky SDK: Quality validation failed:', error);
        }
    }

    /**
     * Track performance metrics
     * @param {number} startTime 
     * @private
     */
    _trackPerformance(startTime) {
        const processingTime = Date.now() - startTime;
        
        this.performanceMetrics.lastProcessingTime = processingTime;
        this.performanceMetrics.processedEvents++;
        
        // Calculate running average
        const totalTime = this.performanceMetrics.averageProcessingTime * (this.performanceMetrics.processedEvents - 1) + processingTime;
        this.performanceMetrics.averageProcessingTime = totalTime / this.performanceMetrics.processedEvents;
        
        if (processingTime > 100) {
            console.warn(`LoomSky SDK: Slow event processing: ${processingTime}ms`);
        }
    }

    /**
     * Get performance metrics
     * @returns {object}
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    // Legacy methods (maintained for compatibility)
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
        const filters = this.config.eventFilters?.filter(f => f.event_name === eventName) || [];
        if (filters.length === 0) return true;
        return true; // TODO: Implement actual filter logic
    }

    // Legacy buildPayload method (for backward compatibility)
    buildPayload(eventName, eventData, collectedData) {
        console.warn('LoomSky SDK: Using legacy buildPayload method. Consider using process() instead.');
        return this._buildEnhancedPayload(eventName, eventData, { data: collectedData || {} });
    }
}

export default EventProcessor;
