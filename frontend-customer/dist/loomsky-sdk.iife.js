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
      var _a, _b, _c, _d, _e, _f;
      console.log(`LoomSky SDK: Processing event "${eventName}"...`);
      const planAllowsBlacklist = ((_c = (_b = (_a = this.config.planFeatures) == null ? void 0 : _a.tracking) == null ? void 0 : _b.blacklist) == null ? void 0 : _c.enabled) === true;
      if (planAllowsBlacklist && this.isBlacklisted()) {
        console.log(`LoomSky SDK: User is blacklisted. Skipping event.`);
        return null;
      }
      const planAllowsFilters = ((_f = (_e = (_d = this.config.planFeatures) == null ? void 0 : _d.tracking) == null ? void 0 : _e.event_filters) == null ? void 0 : _f.enabled) === true;
      if (planAllowsFilters && !this.passEventFilters(eventName, eventData)) {
        console.log(`LoomSky SDK: Event did not pass event filters. Skipping.`);
        return null;
      }
      const payload = this.buildPayload(eventName, eventData, collectedData);
      console.log(`LoomSky SDK: Event "${eventName}" passed all checks.`, { payload });
      return payload;
    }
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
      const filters = this.config.eventFilters.filter((f) => f.event_name === eventName);
      if (filters.length === 0) return true;
      return true;
    }
    buildPayload(eventName, eventData, collectedData) {
      var _a;
      const dataLayer = window.loomskyDataLayer || {};
      return {
        eventName,
        properties: {
          context: {
            page_url: window.location.href,
            page_title: document.title,
            platform: dataLayer.platform || "unknown",
            // (MỚI) Đính kèm dữ liệu đã thu thập vào context
            mapped_data: collectedData
          },
          user: {
            ls_user_id: this.identity.userId,
            authenticated_user_id: ((_a = dataLayer.user) == null ? void 0 : _a.wp_user_id) || null
          },
          facebook: {
            fbp: CookieManager.get("_fbp"),
            fbc: CookieManager.get("_fbc")
          },
          // Hợp nhất dữ liệu từ nhiều nguồn: dataLayer, dữ liệu tùy chỉnh, và dữ liệu thu thập
          ecommerce: {
            ...dataLayer.ecommerce,
            ...collectedData
            // Có thể ghi đè dataLayer nếu cần
          },
          ...eventData
        },
        sessionId: this.identity.sessionId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  class PixelManager {
    constructor(apiService) {
      this.loadedPixels = /* @__PURE__ */ new Set();
      this.api = apiService;
    }
    // Lớp 1: Chèn Pixel vào trang nếu thỏa mãn điều kiện
    injectPixels(pixelsConfig) {
      if (!pixelsConfig || pixelsConfig.length === 0) return;
      const dataLayer = window.loomskyDataLayer || {};
      const currentUrl = window.location.href;
      pixelsConfig.forEach((pixel) => {
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
    }
    shouldActivate(rules, dataLayer, currentUrl) {
      if (!rules || rules.length === 0) return true;
      return rules.some((rule) => {
        if (rule.type === "url_contains" && typeof rule.value === "string") {
          return currentUrl.includes(rule.value);
        }
        return false;
      });
    }
    // Gửi sự kiện tới các pixel đang hoạt động
    track(eventName, payload) {
      if (!window.fbq) return;
      this.loadedPixels.forEach((pixelId) => {
        const eventId = `evt.${pixelId}.${Date.now()}`;
        console.log(`LoomSky SDK: Tracking for Pixel ${pixelId}`, { eventName, eventId });
        fbq("track", eventName, payload.properties.ecommerce || {}, { eventID: eventId });
        const capiPayload = {
          ...payload,
          pixel_id: pixelId,
          event_id: eventId
        };
        this.api.trackEvent(capiPayload);
      });
    }
  }
  class DataCollector {
    /**
     * @param {Array<object>} mappings - Mảng các đối tượng DataMapping từ API config.
     */
    constructor(mappings = []) {
      this.mappings = mappings;
      this.collectedData = {};
    }
    /**
     * Trích xuất nội dung từ một phần tử DOM.
     * Ưu tiên value (cho input), sau đó đến innerText.
     * @param {HTMLElement} element - Phần tử DOM.
     * @returns {string|null}
     * @private
     */
    _extractValue(element) {
      if (!element) return null;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName)) {
        return element.value;
      }
      return element.innerText ? element.innerText.trim() : null;
    }
    /**
     * Quét toàn bộ trang và thu thập tất cả dữ liệu dựa trên các ánh xạ đã cung cấp.
     * @returns {object} - Một đối tượng chứa dữ liệu đã thu thập.
     */
    collectAll() {
      if (!this.mappings || this.mappings.length === 0) {
        return {};
      }
      console.log("LoomSky SDK: Collecting data based on mappings...");
      this.collectedData = {};
      this.mappings.forEach((mapping) => {
        try {
          const element = document.querySelector(mapping.selector);
          if (element) {
            const value = this._extractValue(element);
            if (value) {
              this.collectedData[mapping.variable_name] = value;
            }
          }
        } catch (error) {
          console.warn(`LoomSky SDK: Invalid selector "${mapping.selector}" for variable "${mapping.variable_name}".`, error);
        }
      });
      console.log("LoomSky SDK: Data collected.", this.collectedData);
      return this.collectedData;
    }
  }
  class EventListener {
    constructor(apiService) {
      this.api = apiService;
      this.processor = null;
      this.pixelManager = null;
      this.dataCollector = null;
      this.collectedData = {};
    }
    start(config, identity) {
      this.processor = new EventProcessor(config, identity);
      this.pixelManager = new PixelManager(this.api);
      this.dataCollector = new DataCollector(config.dataMappings);
      console.log("LoomSky SDK: EventListener started.");
      this.pixelManager.injectPixels(config.pixels);
      const onPageReady = () => {
        this.collectedData = this.dataCollector.collectAll();
        this.handleEvent("PageView");
      };
      if (document.readyState === "complete") {
        onPageReady();
      } else {
        window.addEventListener("load", onPageReady);
      }
    }
    handleEvent(eventName, eventData = {}) {
      const processedPayload = this.processor.process(eventName, eventData, this.collectedData);
      if (processedPayload) {
        this.pixelManager.track(eventName, processedPayload);
      }
    }
  }
  const API_BASE_URL = "http://localhost:3000/api/v1";
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
        console.error("LoomSky SDK: Failed to fetch configuration.", error);
        return null;
      }
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
    /**
     * (MỚI) Gửi setup_token lên backend để xác thực.
     * @param {string} token - Token lấy từ URL parameter.
     * @returns {Promise<object|null>} - Dữ liệu xác thực hoặc null nếu thất bại.
     */
    async verifySetupToken(token) {
      try {
        const response = await fetch(`${API_BASE_URL}/sdk/verify-setup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
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
  }
  const MAPPER_ASSETS_BASE_URL = "http://localhost:5173/dist";
  class MapperLoader {
    constructor(apiService) {
      this.api = apiService;
    }
    /**
     * Bắt đầu quá trình kích hoạt Mapper.
     * @param {string} token - Setup token từ URL.
     */
    async activate(token) {
      console.log("LoomSky SDK: Activating Mapper Mode...");
      const verification = await this.api.verifySetupToken(token);
      if (!verification || !verification.websiteId) {
        console.error("LoomSky SDK: Mapper activation failed. Invalid token.");
        return;
      }
      console.log("LoomSky SDK: Setup token verified. Injecting Mapper Agent from CDN...");
      try {
        await this._mountApp({ websiteId: verification.websiteId });
        console.log("LoomSky SDK: Mapper Agent injected and mounted successfully.");
      } catch (error) {
        console.error("LoomSky SDK: Failed to load Mapper Agent.", error);
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
      await this._injectScript();
      if (typeof window.mountDataMapperApp !== "function") {
        console.error("LoomSky SDK: Mapper mount function not found.");
        return;
      }
      const hostElement = document.createElement("div");
      hostElement.id = "loomsky-mapper-host";
      document.body.appendChild(hostElement);
      const shadowRoot = hostElement.attachShadow({ mode: "open" });
      await new Promise((resolve, reject) => {
        const cssLink = document.createElement("link");
        cssLink.rel = "stylesheet";
        cssLink.href = `${MAPPER_ASSETS_BASE_URL}/mapper.css`;
        cssLink.onload = resolve;
        cssLink.onerror = reject;
        shadowRoot.appendChild(cssLink);
      });
      const appMountPoint = document.createElement("div");
      shadowRoot.appendChild(appMountPoint);
      window.mountDataMapperApp(appMountPoint, {
        ...options,
        api: this.api
      });
    }
  }
  class Core {
    constructor() {
      console.log("LoomSky SDK: Core initializing...");
      this.apiKey = this.getApiKey();
      if (this.apiKey) {
        this.api = new ApiService(this.apiKey);
      }
    }
    getApiKey() {
      var _a;
      return ((_a = document.currentScript) == null ? void 0 : _a.getAttribute("data-api-key")) || null;
    }
    /**
     * Lấy các tham số thiết lập từ URL.
     * @returns {{isSetupMode: boolean, token: string|null}}
     */
    getSetupParams() {
      const urlParams = new URLSearchParams(window.location.search);
      return {
        isSetupMode: urlParams.get("ls_setup_mode") === "true",
        token: urlParams.get("ls_token")
      };
    }
    /**
     * Điểm khởi đầu của SDK.
     */
    async start() {
      if (!this.apiKey) {
        console.error("LoomSky SDK: API Key is missing. SDK will not start.");
        return;
      }
      const setupParams = this.getSetupParams();
      if (setupParams.isSetupMode) {
        const mapperLoader = new MapperLoader(this.api);
        await mapperLoader.activate(setupParams.token);
      } else {
        console.log("LoomSky SDK: Starting normal tracking...");
        const config = await this.api.getConfig();
        if (config) {
          console.log("LoomSky SDK: Configuration loaded successfully.", config);
          const identity = new Identity();
          const eventListener = new EventListener(this.api);
          eventListener.start(config, identity);
          console.log("LoomSky SDK: Started successfully.");
        } else {
          console.error("LoomSky SDK: Could not load configuration. SDK is disabled.");
        }
      }
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
