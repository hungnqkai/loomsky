var LoomSkySDK = function() {
  "use strict";
  const CookieManager = {
    set: (name, value, days) => {
      let expires = "";
      if (days) {
        const date = /* @__PURE__ */ new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1e3);
        expires = "; expires=" + date.toUTCString();
      }
      document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
    },
    get: (name) => {
      const nameEQ = name + "=";
      const ca = document.cookie.split(";");
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    }
  };
  class Identity {
    constructor() {
      this.userId = null;
      this.sessionId = null;
      this.init();
    }
    generateUUID() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === "x" ? r : r & 3 | 8;
        return v.toString(16);
      });
    }
    init() {
      this.userId = this.getOrCreateId("ls_user_id", 365);
      this.sessionId = this.getOrCreateId("ls_session_id", 0.02);
    }
    getOrCreateId(key, expirationDays) {
      let id = CookieManager.get(key) || localStorage.getItem(key);
      if (!id) {
        id = this.generateUUID();
      }
      CookieManager.set(key, id, expirationDays);
      localStorage.setItem(key, id);
      return id;
    }
  }
  const DATA_PRIORITY = {
    MANUAL_MAPPING: 100,
    // User-defined selectors (highest priority)
    PLATFORM_DATA: 50,
    // WordPress/Shopify automatic data
    FALLBACK_DATA: 10
    // Basic HTML fallback data
  };
  const BASE_DATA_LAYER_SCHEMA = {
    // Platform identification
    platform: {
      type: "string",
      required: true,
      default: "html",
      description: "Platform type (html, wordpress, shopify)"
    },
    // Page context
    page_type: {
      type: "string",
      required: false,
      default: "page",
      description: "Type of current page (page, product, cart, checkout, thank_you)"
    },
    // User information
    user: {
      type: "object",
      required: true,
      properties: {
        is_logged_in: { type: "boolean", default: false },
        user_id: { type: "string", default: null },
        email: { type: "string", default: null, pii: true },
        role: { type: "string", default: "guest" }
      }
    },
    // E-commerce data (optional)
    ecommerce: {
      type: "object",
      required: false,
      properties: {
        // Product data
        product_id: { type: "string", facebook_param: "content_id" },
        product_name: { type: "string", facebook_param: "content_name" },
        product_price: { type: "number", facebook_param: "value" },
        product_category: { type: "string", facebook_param: "content_category" },
        product_brand: { type: "string", facebook_param: "content_brand" },
        product_variant: { type: "string", facebook_param: "content_variant" },
        // Cart data
        cart_total: { type: "number", facebook_param: "value" },
        cart_items_count: { type: "number", facebook_param: "num_items" },
        // Transaction data
        order_id: { type: "string", facebook_param: "order_id" },
        currency: { type: "string", facebook_param: "currency", default: "USD" },
        // Advanced data
        contents: { type: "array", facebook_param: "contents" },
        content_ids: { type: "array", facebook_param: "content_ids" }
      }
    }
  };
  const DATA_PROCESSING_RULES = {
    /**
     * String processing rules
     */
    string: {
      clean: (value) => {
        if (!value) return null;
        const cleaned = value.toString().trim();
        const withoutHTML = cleaned.replace(/<[^>]*>/g, "");
        if (withoutHTML.length > 1e3) {
          console.warn("LoomSky: String too long, possible selector error");
          return withoutHTML.substring(0, 1e3);
        }
        return withoutHTML === "" ? null : withoutHTML;
      }
    },
    /**
     * Number processing rules  
     */
    number: {
      clean: (value) => {
        if (!value) return null;
        const cleaned = value.toString().replace(/[^\d.-]/g, "").replace(/,/g, "");
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      }
    },
    /**
     * Email processing rules
     */
    email: {
      clean: (value) => {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const cleaned = value.toString().trim().toLowerCase();
        return emailRegex.test(cleaned) ? cleaned : null;
      }
    },
    /**
     * PII hashing for Facebook CAPI
     */
    pii: {
      hash: (value) => {
        if (!value) return null;
        const cleaned = value.toString().toLowerCase().trim();
        let hash = 0;
        for (let i = 0; i < cleaned.length; i++) {
          const char = cleaned.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
      }
    }
  };
  const DATA_MERGE_STRATEGY = {
    /**
     * Merge data from multiple sources based on priority
     * @param {Array} dataSources - Array of {data, priority, source}
     * @returns {Object} - Merged data object
     */
    merge: (dataSources) => {
      const sorted = dataSources.sort((a, b) => b.priority - a.priority);
      const result = {};
      const sources = {};
      sorted.forEach(({ data, priority, source }) => {
        Object.keys(data || {}).forEach((key) => {
          var _a;
          if (data[key] !== null && data[key] !== void 0) {
            if (!result.hasOwnProperty(key) || priority >= (((_a = sources[key]) == null ? void 0 : _a.priority) || 0)) {
              result[key] = data[key];
              sources[key] = { priority, source };
            }
          }
        });
      });
      result._collection_meta = {
        sources: Object.keys(sources).reduce((acc, key) => {
          acc[key] = sources[key].source;
          return acc;
        }, {}),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      return result;
    }
  };
  const DATA_VALIDATION = {
    /**
     * Validate data against schema
     * @param {Object} data - Data to validate
     * @param {Object} schema - Schema to validate against  
     * @returns {Object} - Validation result
     */
    validate: (data, schema = BASE_DATA_LAYER_SCHEMA) => {
      const errors = [];
      const warnings = [];
      Object.keys(schema).forEach((key) => {
        const fieldSchema = schema[key];
        if (fieldSchema.required && (!data || !data.hasOwnProperty(key))) {
          errors.push(`Missing required field: ${key}`);
        }
      });
      Object.keys(data || {}).forEach((key) => {
        const fieldSchema = schema[key];
        if (fieldSchema && fieldSchema.type) {
          const actualType = typeof data[key];
          const expectedType = fieldSchema.type;
          if (actualType !== expectedType && data[key] !== null) {
            warnings.push(`Type mismatch for ${key}: expected ${expectedType}, got ${actualType}`);
          }
        }
      });
      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    },
    /**
     * Calculate data quality score
     * @param {Object} data - Data to score
     * @returns {Object} - Quality score and details
     */
    calculateQuality: (data) => {
      var _a, _b;
      let score = 100;
      const issues = [];
      if (data.ecommerce) {
        if (!data.ecommerce.product_name) {
          score -= 15;
          issues.push("Missing product name");
        }
        if (!data.ecommerce.product_price) {
          score -= 20;
          issues.push("Missing product price");
        }
        if (!data.ecommerce.currency) {
          score -= 5;
          issues.push("Missing currency");
        }
      }
      if ((_a = data.user) == null ? void 0 : _a.email) {
        const cleanEmail = DATA_PROCESSING_RULES.email.clean(data.user.email);
        if (!cleanEmail) {
          score -= 10;
          issues.push("Invalid email format");
        }
      }
      if ((_b = data._collection_meta) == null ? void 0 : _b.sources) {
        const sourceCount = Object.keys(data._collection_meta.sources).length;
        if (sourceCount > 5) score += 5;
      }
      return {
        score: Math.max(0, Math.min(100, score)),
        issues
      };
    }
  };
  const FACEBOOK_CAPI = {
    /**
     * Prepare data for Facebook CAPI
     * @param {Object} data - Raw data
     * @param {string} eventName - Event name  
     * @returns {Object} - CAPI-ready data
     */
    prepareData: (data, eventName) => {
      const capiData = {};
      if (data.ecommerce) {
        const ecom = data.ecommerce;
        if (ecom.product_id) capiData.content_id = ecom.product_id;
        if (ecom.product_name) capiData.content_name = ecom.product_name;
        if (ecom.product_category) capiData.content_category = ecom.product_category;
        if (ecom.product_price) capiData.value = ecom.product_price;
        if (ecom.currency) capiData.currency = ecom.currency;
        if (ecom.order_id) capiData.order_id = ecom.order_id;
      }
      if (data.user) {
        if (data.user.email) {
          capiData.em = DATA_PROCESSING_RULES.pii.hash(data.user.email);
        }
      }
      capiData._prepared_at = (/* @__PURE__ */ new Date()).toISOString();
      capiData._event_name = eventName;
      return capiData;
    }
  };
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
        if (!this._passSecurityChecks(eventName, eventData)) {
          return null;
        }
        const mergedData = this._mergeDataSources(manualData);
        const payload = this._buildEnhancedPayload(eventName, eventData, mergedData);
        this._prepareFacebookCAPI(payload, eventName, mergedData);
        this._validatePayloadQuality(payload);
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
      var _a, _b, _c, _d, _e, _f;
      const planAllowsBlacklist = ((_c = (_b = (_a = this.config.planFeatures) == null ? void 0 : _a.tracking) == null ? void 0 : _b.blacklist) == null ? void 0 : _c.enabled) === true;
      if (planAllowsBlacklist && this.isBlacklisted()) {
        console.log(`LoomSky SDK: User is blacklisted. Skipping event.`);
        return false;
      }
      const planAllowsFilters = ((_f = (_e = (_d = this.config.planFeatures) == null ? void 0 : _d.tracking) == null ? void 0 : _e.event_filters) == null ? void 0 : _f.enabled) === true;
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
      if (manualData.data && Object.keys(manualData.data).length > 0) {
        dataSources.push({
          data: manualData.data,
          priority: DATA_PRIORITY.MANUAL_MAPPING,
          source: "manual_mapping"
        });
      }
      const platformData = this._extractPlatformData();
      if (platformData && Object.keys(platformData).length > 0) {
        dataSources.push({
          data: platformData,
          priority: DATA_PRIORITY.PLATFORM_DATA,
          source: "platform_data"
        });
      }
      const fallbackData = this._extractFallbackData();
      if (fallbackData && Object.keys(fallbackData).length > 0) {
        dataSources.push({
          data: fallbackData,
          priority: DATA_PRIORITY.FALLBACK_DATA,
          source: "fallback_data"
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
      switch (dataLayer.platform) {
        case "wordpress":
          return this._extractWordPressData(dataLayer);
        case "shopify":
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
      var _a, _b, _c;
      return {
        ...dataLayer.ecommerce,
        user_id: (_a = dataLayer.user) == null ? void 0 : _a.user_id,
        user_email: (_b = dataLayer.user) == null ? void 0 : _b.email,
        is_logged_in: (_c = dataLayer.user) == null ? void 0 : _c.is_logged_in,
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
      var _a, _b, _c;
      return {
        ...dataLayer.ecommerce,
        user_id: (_a = dataLayer.user) == null ? void 0 : _a.user_id,
        user_email: (_b = dataLayer.user) == null ? void 0 : _b.email,
        is_logged_in: (_c = dataLayer.user) == null ? void 0 : _c.is_logged_in,
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
      const titleEl = document.querySelector("title");
      if (titleEl) {
        fallback.page_title = titleEl.textContent;
      }
      const priceEl = document.querySelector("[data-price], .price, .product-price");
      if (priceEl) {
        const priceText = priceEl.textContent || priceEl.getAttribute("data-price");
        if (priceText) {
          const price = parseFloat(priceText.replace(/[^\d.]/g, ""));
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
      var _a, _b, _c, _d;
      const dataLayer = window.loomskyDataLayer || {};
      return {
        eventName,
        properties: {
          context: {
            page_url: window.location.href,
            page_title: document.title,
            platform: dataLayer.platform || "html",
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            // Data collection metadata
            data_sources: ((_a = mergedData._collection_meta) == null ? void 0 : _a.sources) || {},
            collection_timestamp: (_b = mergedData._collection_meta) == null ? void 0 : _b.timestamp
          },
          user: {
            ls_user_id: this.identity.userId,
            authenticated_user_id: mergedData.user_id || ((_c = dataLayer.user) == null ? void 0 : _c.user_id) || null,
            is_logged_in: mergedData.is_logged_in || ((_d = dataLayer.user) == null ? void 0 : _d.is_logged_in) || false,
            user_agent: navigator.userAgent
          },
          facebook: {
            fbp: CookieManager.get("_fbp"),
            fbc: CookieManager.get("_fbc")
          },
          // Enhanced ecommerce data từ merged sources
          ecommerce: this._buildEcommerceData(mergedData, eventData),
          // Custom event data (highest priority)
          ...eventData
        },
        sessionId: this.identity.sessionId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
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
      const ecomFields = [
        "product_id",
        "product_name",
        "product_price",
        "product_category",
        "product_brand",
        "cart_total",
        "currency",
        "order_id"
      ];
      ecomFields.forEach((field) => {
        if (mergedData[field] !== void 0 && mergedData[field] !== null) {
          ecommerceData[field] = mergedData[field];
        }
      });
      if (!ecommerceData.currency) {
        ecommerceData.currency = "USD";
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
        payload.properties.facebook.capi_data = capiData;
        payload.properties.facebook.capi_ready = Object.keys(capiData).length > 0;
      } catch (error) {
        console.warn("LoomSky SDK: Facebook CAPI preparation failed:", error);
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
          validated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        if (quality.score < 70) {
          console.warn(`LoomSky SDK: Low data quality score: ${quality.score}%`, quality.issues);
        }
      } catch (error) {
        console.warn("LoomSky SDK: Quality validation failed:", error);
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
      return blacklist.some((entry) => {
        if (entry.type === "user_id" && entry.value === this.identity.userId) {
          return true;
        }
        return false;
      });
    }
    passEventFilters(eventName, eventData) {
      var _a;
      const filters = ((_a = this.config.eventFilters) == null ? void 0 : _a.filter((f) => f.event_name === eventName)) || [];
      if (filters.length === 0) return true;
      return true;
    }
    // Legacy buildPayload method (for backward compatibility)
    buildPayload(eventName, eventData, collectedData) {
      console.warn("LoomSky SDK: Using legacy buildPayload method. Consider using process() instead.");
      return this._buildEnhancedPayload(eventName, eventData, { data: collectedData || {} });
    }
  }
  class PixelManager {
    constructor(apiService) {
      this.loadedPixels = /* @__PURE__ */ new Set();
      this.api = apiService;
    }
    // ✅ NEW: Add missing getPixelIds method
    getPixelIds() {
      return Array.from(this.loadedPixels);
    }
    // ✅ IMPROVED: Better error handling
    injectPixels(pixelsConfig) {
      if (!pixelsConfig || pixelsConfig.length === 0) {
        console.log("LoomSky SDK: No pixels to inject");
        return;
      }
      const dataLayer = window.loomskyDataLayer || {};
      const currentUrl = window.location.href;
      pixelsConfig.forEach((pixel) => {
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
          fbq("init", pixelId);
          return;
        }
        !function(f, b, e, v, n, t, s) {
          if (f.fbq) return;
          n = f.fbq = function() {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = true;
          n.version = "2.0";
          n.queue = [];
          t = b.createElement(e);
          t.async = true;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        }(
          window,
          document,
          "script",
          "https://connect.facebook.net/en_US/fbevents.js"
        );
        fbq("init", pixelId);
      } catch (error) {
        console.error(`LoomSky SDK: Error loading pixel script for ${pixelId}:`, error);
      }
    }
    shouldActivate(rules, dataLayer, currentUrl) {
      if (!rules || rules.length === 0) return true;
      return rules.some((rule) => {
        try {
          if (rule.type === "url_contains" && typeof rule.value === "string") {
            return currentUrl.includes(rule.value);
          }
          return false;
        } catch (error) {
          console.error("LoomSky SDK: Error evaluating activation rule:", error);
          return false;
        }
      });
    }
    // ✅ IMPROVED: Better error handling for tracking
    track(eventName, payload) {
      if (!window.fbq) return;
      this.loadedPixels.forEach((pixelId) => {
        var _a;
        const eventId = `evt.${pixelId}.${Date.now()}`;
        console.log(`LoomSky SDK: Tracking for Pixel ${pixelId}`, { eventName, eventId });
        fbq("track", eventName, ((_a = payload.properties) == null ? void 0 : _a.ecommerce) || {}, { eventID: eventId });
      });
    }
    // ✅ NEW: Get status info for debugging
    getStatus() {
      return {
        loaded_pixels: Array.from(this.loadedPixels),
        pixel_count: this.loadedPixels.size,
        fbq_available: typeof window.fbq !== "undefined"
      };
    }
  }
  class DataCollector {
    /**
     * @param {Array<object>} mappings - User-defined data mappings từ API config
     */
    constructor(mappings = []) {
      this.mappings = mappings;
      this.collectedData = {};
      this.errors = [];
      this.warnings = [];
    }
    /**
     * Enhanced value extraction với data type processing
     * @param {HTMLElement} element - DOM element
     * @param {string} dataType - Expected data type (string, number, email)
     * @returns {any|null}
     * @private
     */
    _extractValue(element, dataType = "string") {
      if (!element) return null;
      let rawValue = null;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName)) {
        rawValue = element.value;
      } else if (element.hasAttribute("data-value")) {
        rawValue = element.getAttribute("data-value");
      } else {
        rawValue = element.innerText || element.textContent;
      }
      if (!rawValue) return null;
      try {
        switch (dataType.toLowerCase()) {
          case "number":
          case "price":
          case "currency":
            return DATA_PROCESSING_RULES.number.clean(rawValue);
          case "email":
            return DATA_PROCESSING_RULES.email.clean(rawValue);
          case "string":
          case "text":
          default:
            return DATA_PROCESSING_RULES.string.clean(rawValue);
        }
      } catch (error) {
        this.warnings.push(`Failed to process ${dataType} value: ${rawValue}`);
        return DATA_PROCESSING_RULES.string.clean(rawValue);
      }
    }
    /**
     * Collect data from a specific mapping
     * @param {object} mapping - Single mapping object
     * @returns {object} - Collection result
     * @private
     */
    _collectFromMapping(mapping) {
      const result = {
        variable_name: mapping.variable_name,
        value: null,
        success: false,
        error: null
      };
      try {
        const element = document.querySelector(mapping.selector);
        if (!element) {
          result.error = `Element not found: ${mapping.selector}`;
          return result;
        }
        const value = this._extractValue(element, mapping.data_type || "string");
        if (value !== null) {
          result.value = value;
          result.success = true;
        } else {
          result.error = "Element found but value is empty";
        }
      } catch (error) {
        result.error = `Invalid selector "${mapping.selector}": ${error.message}`;
        this.errors.push(result.error);
      }
      return result;
    }
    /**
     * Simplified collection - only manual mappings
     * @returns {object} - Collected data với metadata
     */
    collectAll() {
      console.log("LoomSky SDK: Collecting manual data mappings...");
      this.collectedData = {};
      this.errors = [];
      this.warnings = [];
      if (!this.mappings || this.mappings.length === 0) {
        console.log("LoomSky SDK: No manual mappings configured");
        return this._buildResult();
      }
      let successCount = 0;
      this.mappings.forEach((mapping) => {
        const result = this._collectFromMapping(mapping);
        if (result.success) {
          this.collectedData[result.variable_name] = result.value;
          successCount++;
        } else {
          console.warn(`LoomSky SDK: ${result.error}`);
        }
      });
      console.log(`LoomSky SDK: Manual data collection complete. ${successCount}/${this.mappings.length} mappings successful.`);
      return this._buildResult();
    }
    /**
     * Build collection result với metadata
     * @returns {object}
     * @private
     */
    _buildResult() {
      return {
        data: this.collectedData,
        metadata: {
          source: "manual_mapping",
          priority: DATA_PRIORITY.MANUAL_MAPPING,
          collection_time: (/* @__PURE__ */ new Date()).toISOString(),
          mappings_total: this.mappings.length,
          mappings_successful: Object.keys(this.collectedData).length,
          errors: this.errors,
          warnings: this.warnings
        }
      };
    }
    /**
     * Get collection statistics
     * @returns {object}
     */
    getStats() {
      return {
        total_mappings: this.mappings.length,
        successful_mappings: Object.keys(this.collectedData).length,
        success_rate: this.mappings.length > 0 ? Object.keys(this.collectedData).length / this.mappings.length * 100 : 0,
        error_count: this.errors.length,
        warning_count: this.warnings.length
      };
    }
    /**
     * Test a single selector without collecting
     * @param {string} selector - CSS selector to test
     * @returns {object} - Test result
     */
    testSelector(selector) {
      try {
        const elements = document.querySelectorAll(selector);
        return {
          valid: true,
          elements_found: elements.length,
          sample_values: Array.from(elements).slice(0, 3).map(
            (el) => this._extractValue(el, "string")
          )
        };
      } catch (error) {
        return {
          valid: false,
          error: error.message
        };
      }
    }
  }
  class EventListener {
    constructor(apiService) {
      this.api = apiService;
      this.processor = null;
      this.pixelManager = null;
      this.dataCollector = null;
      this.manualData = {};
      this.isReady = false;
    }
    start(config, identity) {
      console.log("LoomSky SDK: EventListener starting with enhanced data collection...");
      this.processor = new EventProcessor(config, identity);
      this.pixelManager = new PixelManager(this.api);
      this.dataCollector = new DataCollector(config.dataMappings || []);
      console.log("LoomSky SDK: EventListener started successfully.");
      this.pixelManager.injectPixels(config.pixels);
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
        this.handleEvent("PageView");
        this._setupDynamicCollection();
      };
      if (document.readyState === "complete") {
        setTimeout(onPageReady, 100);
      } else if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", onPageReady);
      } else {
        window.addEventListener("load", onPageReady);
      }
    }
    /**
     * Collect initial manual mapping data
     * @private
     */
    _collectInitialData() {
      try {
        console.log("LoomSky SDK: Collecting initial manual mapping data...");
        const result = this.dataCollector.collectAll();
        this.manualData = result;
        const stats = this.dataCollector.getStats();
        console.log(`LoomSky SDK: Initial data collection complete. Success rate: ${stats.success_rate.toFixed(1)}%`);
        if (stats.error_count > 0) {
          console.warn(`LoomSky SDK: ${stats.error_count} data mapping errors detected`);
        }
      } catch (error) {
        console.error("LoomSky SDK: Failed to collect initial data:", error);
        this.manualData = { data: {}, metadata: { errors: [error.message] } };
      }
    }
    /**
     * Setup dynamic data collection for SPAs
     * @private
     */
    _setupDynamicCollection() {
      let currentUrl = window.location.href;
      const checkUrlChange = () => {
        if (window.location.href !== currentUrl) {
          currentUrl = window.location.href;
          console.log("LoomSky SDK: URL changed, re-collecting data...");
          this._collectInitialData();
        }
      };
      setInterval(checkUrlChange, 2e3);
      window.addEventListener("popstate", () => {
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
        let currentManualData = this.manualData;
        if (recollectData && this.isReady) {
          console.log("LoomSky SDK: Re-collecting manual data for event:", eventName);
          currentManualData = this.dataCollector.collectAll();
        }
        const processedPayload = this.processor.process(eventName, eventData, currentManualData);
        if (processedPayload) {
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
      this.pixelManager.track(eventName, payload);
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
        const apiPayload = {
          apiKey: this.api.apiKey,
          eventName,
          properties: payload.properties,
          sessionId: payload.sessionId,
          timestamp: payload.timestamp,
          pixel_id: this._getPrimaryPixelId(),
          event_id: this._generateEventId()
        };
        this.api.trackEvent(apiPayload).catch((error) => {
          console.error("LoomSky SDK: Failed to send event to backend:", error);
        });
      } catch (error) {
        console.error("LoomSky SDK: Error sending to backend:", error);
      }
    }
    /**
     * Get primary pixel ID from configuration
     * @returns {string}
     * @private
     */
    _getPrimaryPixelId() {
      var _a, _b;
      return ((_b = (_a = this.pixelManager) == null ? void 0 : _a.getPixelIds()) == null ? void 0 : _b[0]) || "unknown";
    }
    /**
     * Generate unique event ID
     * @returns {string}
     * @private
     */
    _generateEventId() {
      return Date.now().toString() + "_" + Math.random().toString(36).substr(2, 9);
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
        stats
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
      var _a, _b, _c, _d, _e;
      return {
        eventListener: {
          ready: this.isReady,
          last_data_collection: (_a = this.manualData.metadata) == null ? void 0 : _a.collection_time
        },
        eventProcessor: ((_c = (_b = this.processor) == null ? void 0 : _b.getPerformanceMetrics) == null ? void 0 : _c.call(_b)) || {},
        dataCollector: ((_e = (_d = this.dataCollector) == null ? void 0 : _d.getStats) == null ? void 0 : _e.call(_d)) || {}
      };
    }
  }
  const API_BASE_URL = "http://localhost:3000/api/v1";
  class ApiService {
    constructor(apiKey) {
      this.apiKey = apiKey;
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
        this.configCache = result.data;
        return this.configCache;
      } catch (error) {
        console.error("LoomSky SDK: Failed to fetch configuration.", error);
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
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result.data;
      } catch (error) {
        console.error("LoomSky SDK: Failed to verify setup token.", error);
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
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            apiKey: this.apiKey,
            ...payload
          })
        });
        if (response.status !== 202) {
          const errorData = await response.json();
          console.error("LoomSky SDK: Failed to track event.", errorData.error);
        } else {
          console.log("LoomSky SDK: [TRACK] Event successfully sent to backend.");
        }
      } catch (error) {
        console.error("LoomSky SDK: Error sending event to backend.", error);
      }
    }
  }
  const MAPPER_ASSETS_BASE_URL = "http://localhost:5173/dist";
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
      if (setupState.fromSession) {
        console.log("LoomSky SDK: Activating from session, skipping token verification.");
        verification = { success: true, websiteId: "session-activated" };
      } else {
        console.log("LoomSky SDK: Activating from URL, verifying token...");
        verification = await this.api.verifySetupToken(setupState.token);
      }
      if (!verification) {
        console.error("LoomSky SDK: Mapper activation failed. Invalid token.");
        return false;
      }
      console.log("LoomSky SDK: Token accepted. Injecting Mapper Agent...");
      try {
        await this._mountApp({ websiteId: verification.websiteId });
        console.log("LoomSky SDK: Mapper Agent injected and mounted successfully.");
        return true;
      } catch (error) {
        console.error("LoomSky SDK: Failed to load Mapper Agent.", error);
        return false;
      }
    }
    /**
     * Tải động file JS của mini-app.
     * @private
     */
    _injectScript() {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
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
      const hostElement = document.createElement("div");
      hostElement.id = "loomsky-mapper-host";
      document.body.appendChild(hostElement);
      const shadowRoot = hostElement.attachShadow({ mode: "open" });
      const appMountPoint = document.createElement("div");
      await new Promise((resolve, reject) => {
        const cssLink = document.createElement("link");
        cssLink.rel = "stylesheet";
        cssLink.href = `${MAPPER_ASSETS_BASE_URL}/mapper.css`;
        cssLink.onload = resolve;
        cssLink.onerror = reject;
        shadowRoot.appendChild(cssLink);
      });
      console.log("LoomSky SDK: Mapper CSS loaded successfully.");
      await this._injectScript();
      console.log("LoomSky SDK: Mapper JS loaded successfully.");
      if (typeof window.mountDataMapperApp !== "function") {
        throw new Error("LoomSky SDK: Mapper mount function not found.");
      }
      shadowRoot.appendChild(appMountPoint);
      window.mountDataMapperApp(appMountPoint, options);
    }
  }
  const SESSION_STORAGE_KEY = "loomskySetupSession";
  class Core {
    constructor() {
      console.log("LoomSky SDK: Core initializing...");
      this.apiKey = this.getApiKey();
      this.eventListener = null;
      this.identity = null;
      this.config = null;
      if (this.apiKey) {
        this.api = new ApiService(this.apiKey);
      }
    }
    getApiKey() {
      var _a;
      return ((_a = document.currentScript) == null ? void 0 : _a.getAttribute("data-api-key")) || null;
    }
    getSetupState() {
      try {
        const sessionData = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY));
        if (sessionData && sessionData.isActive && sessionData.token) {
          console.log("LoomSky SDK: Found active setup session in sessionStorage.");
          return { isSetupMode: true, token: sessionData.token, fromSession: true };
        }
      } catch (e) {
      }
      const urlParams = new URLSearchParams(window.location.search);
      const isUrlMode = urlParams.get("ls_setup_mode") === "true";
      const urlToken = urlParams.get("ls_token");
      if (isUrlMode && urlToken) {
        console.log("LoomSky SDK: Found setup params in URL.");
        return { isSetupMode: true, token: urlToken, fromSession: false };
      }
      return { isSetupMode: false, token: null };
    }
    async start() {
      if (!this.apiKey) {
        console.warn("LoomSky SDK: No API key found.");
        return;
      }
      const setupState = this.getSetupState();
      if (setupState.isSetupMode) {
        console.log("LoomSky SDK: Activating Mapper Mode...");
        const mapperLoader = new MapperLoader(this.api);
        const isActivated = await mapperLoader.activate(setupState);
        if (isActivated && !setupState.fromSession) {
          const sessionData = { isActive: true, token: setupState.token };
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
          console.log("LoomSky SDK: Setup session saved.");
        }
        if (isActivated) {
          window.addEventListener("message", (event) => {
            var _a;
            if (((_a = event.data) == null ? void 0 : _a.type) === "LOOMSKY_CLOSE_MAPPER") {
              console.log("LoomSky SDK: Closing setup session.");
              sessionStorage.removeItem(SESSION_STORAGE_KEY);
            }
          });
        } else if (!setupState.fromSession) {
          console.log("LoomSky SDK: Invalid token from URL, clearing session.");
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } else {
        console.log("LoomSky SDK: Starting normal tracking...");
        this.config = await this.api.getConfig();
        if (this.config) {
          console.log("LoomSky SDK: Configuration loaded successfully.", this.config);
          this.identity = new Identity();
          this.eventListener = new EventListener(this.api);
          this.eventListener.start(this.config, this.identity);
          this.exposeDebugMethods();
          console.log("LoomSky SDK: Started successfully.");
        } else {
          console.error("LoomSky SDK: Could not load configuration. SDK is disabled.");
        }
      }
    }
    /**
     * ✅ NEW: Expose debug methods to global window object
     */
    exposeDebugMethods() {
      var _a, _b;
      window.LoomSkySDK = {
        // Core info
        version: "1.0.0",
        loaded: true,
        apiKey: ((_a = this.apiKey) == null ? void 0 : _a.substring(0, 8)) + "...",
        // ✅ Debug Methods
        testDataCollection: () => {
          if (!this.eventListener) {
            return { error: "EventListener not initialized" };
          }
          return this.eventListener.testDataCollection();
        },
        testSelector: (selector) => {
          if (!this.eventListener) {
            return { error: "EventListener not initialized" };
          }
          return this.eventListener.testSelector(selector);
        },
        getPerformanceMetrics: () => {
          if (!this.eventListener) {
            return { error: "EventListener not initialized" };
          }
          return this.eventListener.getPerformanceMetrics();
        },
        // ✅ Manual Event Triggering
        handleEvent: (eventName, eventData = {}, recollectData = false) => {
          if (!this.eventListener) {
            console.error("LoomSky SDK: EventListener not initialized");
            return false;
          }
          this.eventListener.handleEvent(eventName, eventData, recollectData);
          return true;
        },
        // ✅ Current State Inspection
        getCurrentData: () => {
          var _a2, _b2, _c, _d;
          return {
            manualData: ((_a2 = this.eventListener) == null ? void 0 : _a2.manualData) || {},
            config: this.config,
            identity: {
              userId: (_b2 = this.identity) == null ? void 0 : _b2.userId,
              sessionId: (_c = this.identity) == null ? void 0 : _c.sessionId
            },
            isReady: ((_d = this.eventListener) == null ? void 0 : _d.isReady) || false
          };
        },
        // ✅ Re-collect Data
        recollectData: () => {
          if (!this.eventListener) {
            return { error: "EventListener not initialized" };
          }
          this.eventListener._collectInitialData();
          return { success: true, message: "Data re-collected" };
        },
        // ✅ Get Available Methods
        getMethods: () => {
          return Object.keys(window.LoomSkySDK).filter((key) => typeof window.LoomSkySDK[key] === "function");
        },
        // ✅ Debug Info
        getDebugInfo: () => {
          var _a2, _b2, _c;
          return {
            sdk: {
              version: "1.0.0",
              loaded: true,
              apiKey: ((_a2 = this.apiKey) == null ? void 0 : _a2.substring(0, 8)) + "...",
              mode: "tracking"
            },
            components: {
              eventListener: !!this.eventListener,
              identity: !!this.identity,
              config: !!this.config
            },
            config: this.config ? {
              websiteId: this.config.websiteId,
              dataMappings: ((_b2 = this.config.dataMappings) == null ? void 0 : _b2.length) || 0,
              pixels: ((_c = this.config.pixels) == null ? void 0 : _c.length) || 0,
              planFeatures: this.config.planFeatures
            } : null,
            page: {
              url: window.location.href,
              title: document.title,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            }
          };
        }
      };
      if (typeof window !== "undefined" && ((_b = window.localStorage) == null ? void 0 : _b.getItem("loomsky_debug")) === "true") {
        window.loomskyEventListener = this.eventListener;
        window.loomskyIdentity = this.identity;
        window.loomskyConfig = this.config;
        console.log("🔧 LoomSky DEBUG: Advanced debug objects exposed to window");
      }
      console.log("🔧 LoomSky SDK: Debug methods exposed to window.LoomSkySDK");
      console.log("💡 Available methods:", Object.keys(window.LoomSkySDK).filter((key) => typeof window.LoomSkySDK[key] === "function"));
    }
  }
  function init() {
    const core = new Core();
    core.start();
  }
  init();
  const index = {
    init
  };
  return index;
}();
