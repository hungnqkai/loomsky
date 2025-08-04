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
    process(eventName, eventData) {
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
      const payload = this.buildPayload(eventName, eventData);
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
    buildPayload(eventName, eventData) {
      var _a, _b, _c, _d;
      return {
        eventName,
        properties: {
          context: {
            page_url: window.location.href,
            page_title: document.title,
            platform: ((_a = window.loomskyDataLayer) == null ? void 0 : _a.platform) || "unknown"
          },
          user: {
            ls_user_id: this.identity.userId,
            authenticated_user_id: ((_c = (_b = window.loomskyDataLayer) == null ? void 0 : _b.user) == null ? void 0 : _c.wp_user_id) || null
          },
          facebook: {
            fbp: CookieManager.get("_fbp"),
            fbc: CookieManager.get("_fbc")
          },
          ecommerce: ((_d = window.loomskyDataLayer) == null ? void 0 : _d.ecommerce) || {},
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
  class EventListener {
    constructor(apiService) {
      this.api = apiService;
      this.processor = null;
      this.pixelManager = null;
    }
    start(config, identity) {
      this.processor = new EventProcessor(config, identity);
      this.pixelManager = new PixelManager(this.api);
      console.log("LoomSky SDK: EventListener started.");
      this.pixelManager.injectPixels(config.pixels);
      if (document.readyState === "complete") {
        this.handleEvent("PageView");
      } else {
        window.addEventListener("load", () => this.handleEvent("PageView"));
      }
    }
    handleEvent(eventName, eventData = {}) {
      const processedPayload = this.processor.process(eventName, eventData);
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
  }
  class Core {
    constructor() {
      console.log("LoomSky SDK: Core initializing...");
      this.apiKey = this.getApiKey();
      this.config = null;
      if (this.apiKey) {
        this.api = new ApiService(this.apiKey);
        this.identity = new Identity();
        this.eventListener = new EventListener(this.api);
      }
    }
    getApiKey() {
      var _a;
      return ((_a = document.currentScript) == null ? void 0 : _a.getAttribute("data-api-key")) || null;
    }
    async fetchConfig() {
      if (!this.api) return;
      console.log(`LoomSky SDK: Fetching config for API Key: ${this.apiKey}`);
      this.config = await this.api.getConfig();
      if (this.config) {
        console.log("LoomSky SDK: Configuration loaded successfully.", this.config);
      }
    }
    async start() {
      if (!this.apiKey) {
        console.error("LoomSky SDK: API Key is missing. SDK will not start.");
        return;
      }
      console.log("LoomSky SDK: Starting...");
      await this.fetchConfig();
      if (this.config) {
        this.eventListener.start(this.config, this.identity);
        console.log("LoomSky SDK: Started successfully.");
      } else {
        console.error("LoomSky SDK: Could not load configuration. SDK is disabled.");
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
