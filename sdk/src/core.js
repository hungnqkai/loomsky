// File: sdk/src/core.js (FIX DEBUG METHODS)
/*
SOLUTION: Expose debug methods ra global window object
*/

import Identity from './modules/identity';
import EventListener from './modules/eventListener';
import ApiService from './utils/api';
import MapperLoader from './modules/mapperLoader';

const SESSION_STORAGE_KEY = 'loomskySetupSession';

class Core {
    constructor() {
        console.log('LoomSky SDK: Core initializing...');
        this.apiKey = this.getApiKey();
        
        // Store references to main components
        this.eventListener = null;
        this.identity = null;
        this.config = null;
        
        if (this.apiKey) {
            this.api = new ApiService(this.apiKey);
        }
    }

    getApiKey() {
        return document.currentScript?.getAttribute('data-api-key') || null;
    }

    getSetupState() {
        try {
            const sessionData = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY));
            if (sessionData && sessionData.isActive && sessionData.token) {
                console.log('LoomSky SDK: Found active setup session in sessionStorage.');
                return { isSetupMode: true, token: sessionData.token, fromSession: true };
            }
        } catch (e) { /* ... */ }
        
        const urlParams = new URLSearchParams(window.location.search);
        const isUrlMode = urlParams.get('ls_setup_mode') === 'true';
        const urlToken = urlParams.get('ls_token');

        if (isUrlMode && urlToken) {
            console.log('LoomSky SDK: Found setup params in URL.');
            return { isSetupMode: true, token: urlToken, fromSession: false };
        }

        return { isSetupMode: false, token: null };
    }

    async start() {
        if (!this.apiKey) { 
            console.warn('LoomSky SDK: No API key found.');
            return; 
        }

        const setupState = this.getSetupState();

        if (setupState.isSetupMode) {
            console.log('LoomSky SDK: Activating Mapper Mode...');
            const mapperLoader = new MapperLoader(this.api);
            
            const isActivated = await mapperLoader.activate(setupState);
            
            if (isActivated && !setupState.fromSession) {
                const sessionData = { isActive: true, token: setupState.token };
                sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
                console.log('LoomSky SDK: Setup session saved.');
            }
            
            if (isActivated) {
                window.addEventListener('message', (event) => {
                    if (event.data?.type === 'LOOMSKY_CLOSE_MAPPER') {
                        console.log('LoomSky SDK: Closing setup session.');
                        sessionStorage.removeItem(SESSION_STORAGE_KEY);
                    }
                });
            } else if (!setupState.fromSession) {
                console.log('LoomSky SDK: Invalid token from URL, clearing session.');
                sessionStorage.removeItem(SESSION_STORAGE_KEY);
            }
        } else {
            // Normal tracking mode
            console.log('LoomSky SDK: Starting normal tracking...');
            this.config = await this.api.getConfig();
            
            if (this.config) {
                console.log('LoomSky SDK: Configuration loaded successfully.', this.config);
                
                // ✅ Store references to components
                this.identity = new Identity();
                this.eventListener = new EventListener(this.api);
                this.eventListener.start(this.config, this.identity);
                
                // ✅ EXPOSE DEBUG METHODS TO GLOBAL SCOPE
                this.exposeDebugMethods();
                
                console.log('LoomSky SDK: Started successfully.');
            } else {
                console.error('LoomSky SDK: Could not load configuration. SDK is disabled.');
            }
        }
    }

    /**
     * ✅ NEW: Expose debug methods to global window object
     */
    exposeDebugMethods() {
        // Create global LoomSkySDK object with debug methods
        window.LoomSkySDK = {
            // Core info
            version: '1.0.0',
            loaded: true,
            apiKey: this.apiKey?.substring(0, 8) + '...',
            
            // ✅ Debug Methods
            testDataCollection: () => {
                if (!this.eventListener) {
                    return { error: 'EventListener not initialized' };
                }
                return this.eventListener.testDataCollection();
            },

            testSelector: (selector) => {
                if (!this.eventListener) {
                    return { error: 'EventListener not initialized' };
                }
                return this.eventListener.testSelector(selector);
            },

            getPerformanceMetrics: () => {
                if (!this.eventListener) {
                    return { error: 'EventListener not initialized' };
                }
                return this.eventListener.getPerformanceMetrics();
            },

            // ✅ Manual Event Triggering
            handleEvent: (eventName, eventData = {}, recollectData = false) => {
                if (!this.eventListener) {
                    console.error('LoomSky SDK: EventListener not initialized');
                    return false;
                }
                this.eventListener.handleEvent(eventName, eventData, recollectData);
                return true;
            },

            // ✅ Current State Inspection
            getCurrentData: () => {
                return {
                    manualData: this.eventListener?.manualData || {},
                    config: this.config,
                    identity: {
                        userId: this.identity?.userId,
                        sessionId: this.identity?.sessionId
                    },
                    isReady: this.eventListener?.isReady || false
                };
            },

            // ✅ Re-collect Data
            recollectData: () => {
                if (!this.eventListener) {
                    return { error: 'EventListener not initialized' };
                }
                this.eventListener._collectInitialData();
                return { success: true, message: 'Data re-collected' };
            },

            // ✅ Get Available Methods
            getMethods: () => {
                return Object.keys(window.LoomSkySDK).filter(key => typeof window.LoomSkySDK[key] === 'function');
            },

            // ✅ Debug Info
            getDebugInfo: () => {
                return {
                    sdk: {
                        version: '1.0.0',
                        loaded: true,
                        apiKey: this.apiKey?.substring(0, 8) + '...',
                        mode: 'tracking'
                    },
                    components: {
                        eventListener: !!this.eventListener,
                        identity: !!this.identity,
                        config: !!this.config
                    },
                    config: this.config ? {
                        websiteId: this.config.websiteId,
                        dataMappings: this.config.dataMappings?.length || 0,
                        pixels: this.config.pixels?.length || 0,
                        planFeatures: this.config.planFeatures
                    } : null,
                    page: {
                        url: window.location.href,
                        title: document.title,
                        timestamp: new Date().toISOString()
                    }
                };
            }
        };

        // ✅ Also expose EventListener directly for advanced debugging
        if (typeof window !== 'undefined' && window.localStorage?.getItem('loomsky_debug') === 'true') {
            window.loomskyEventListener = this.eventListener;
            window.loomskyIdentity = this.identity;
            window.loomskyConfig = this.config;
            console.log('🔧 LoomSky DEBUG: Advanced debug objects exposed to window');
        }

        console.log('🔧 LoomSky SDK: Debug methods exposed to window.LoomSkySDK');
        console.log('💡 Available methods:', Object.keys(window.LoomSkySDK).filter(key => typeof window.LoomSkySDK[key] === 'function'));
    }
}

export default Core;