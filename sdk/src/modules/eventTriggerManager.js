// File: sdk/src/modules/eventTriggerManager.js
/*
Event Trigger Manager - Handles URL and Click-based trigger execution
Similar to DataMapper flow but for trigger setup and execution
*/

const TRIGGER_ASSETS_BASE_URL = 'http://localhost:5173/dist'; // CDN URL for trigger setup assets

class EventTriggerManager {
    constructor(api) {
        this.api = api;
        this.triggers = {
            url_triggers: [],
            click_triggers: []
        };
        this.isSetupMode = false;
        this.setupToken = null;
        this.boundHandlers = new Map();
        
        console.log('LoomSky SDK: EventTriggerManager initialized');
    }

    // Initialize triggers from config
    initialize(config, identity) {
        console.log('LoomSky SDK: EventTriggerManager initializing triggers...');
        
        if (config && config.pixels) {
            // Extract triggers from all pixels
            config.pixels.forEach(pixel => {
                if (pixel.event_triggers) {
                    this.triggers.url_triggers.push(...pixel.event_triggers.url_triggers || []);
                    this.triggers.click_triggers.push(...pixel.event_triggers.click_triggers || []);
                }
            });
        }

        console.log('LoomSky SDK: Loaded triggers:', {
            url_triggers: this.triggers.url_triggers.length,
            click_triggers: this.triggers.click_triggers.length
        });

        // Start trigger execution
        this.startTriggerExecution(identity);
    }

    // Start trigger execution (normal mode)
    startTriggerExecution(identity) {
        // Setup URL triggers
        this.setupUrlTriggers(identity);
        
        // Setup click triggers
        this.setupClickTriggers(identity);
        
        console.log('LoomSky SDK: EventTriggerManager execution started');
    }

    // Setup URL-based triggers
    setupUrlTriggers(identity) {
        if (this.triggers.url_triggers.length === 0) return;

        const currentUrl = window.location.href;
        const currentPath = window.location.pathname;

        this.triggers.url_triggers.forEach(trigger => {
            if (!trigger.enabled) return;

            let shouldFire = false;

            switch (trigger.url_match_type) {
                case 'contains':
                    shouldFire = currentUrl.includes(trigger.url_pattern);
                    break;
                case 'equals':
                    shouldFire = currentPath === trigger.url_pattern;
                    break;
                case 'starts_with':
                    shouldFire = currentPath.startsWith(trigger.url_pattern);
                    break;
                case 'ends_with':
                    shouldFire = currentPath.endsWith(trigger.url_pattern);
                    break;
                case 'regex':
                    try {
                        const regex = new RegExp(trigger.url_pattern);
                        shouldFire = regex.test(currentUrl);
                    } catch (e) {
                        console.error('LoomSky SDK: Invalid regex pattern:', trigger.url_pattern, e);
                    }
                    break;
            }

            if (shouldFire) {
                this.fireTrigger(trigger, identity);
            }
        });
    }

    // Setup click-based triggers
    setupClickTriggers(identity) {
        if (this.triggers.click_triggers.length === 0) return;

        this.triggers.click_triggers.forEach(trigger => {
            if (!trigger.enabled) return;

            try {
                const elements = document.querySelectorAll(trigger.selector);
                
                elements.forEach(element => {
                    // Create bound handler to avoid memory leaks
                    const handlerKey = `${trigger.id}_${Math.random()}`;
                    const clickHandler = (event) => {
                        // Check if element text matches (if specified)
                        if (trigger.element_text && trigger.element_text.trim()) {
                            const elementText = element.textContent?.trim();
                            if (elementText !== trigger.element_text.trim()) {
                                return;
                            }
                        }

                        this.fireTrigger(trigger, identity, {
                            element: element,
                            selector: trigger.selector
                        });
                    };

                    // Store handler reference for cleanup
                    this.boundHandlers.set(handlerKey, {
                        element: element,
                        handler: clickHandler,
                        trigger: trigger
                    });

                    element.addEventListener('click', clickHandler);
                });

                console.log(`LoomSky SDK: Setup click trigger for selector: ${trigger.selector} (${elements.length} elements)`);
            } catch (e) {
                console.error('LoomSky SDK: Invalid CSS selector:', trigger.selector, e);
            }
        });
    }

    // Fire trigger event
    async fireTrigger(trigger, identity, context = {}) {
        console.log('LoomSky SDK: Firing trigger:', trigger.event_name, trigger);

        try {
            // Prepare event data
            const eventData = {
                event_name: trigger.event_name,
                trigger_id: trigger.id,
                trigger_type: trigger.trigger_type,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                user_id: identity.getUserId(),
                session_id: identity.getSessionId(),
                ...context
            };

            // Send to tracking API
            await this.api.track('trigger_fired', eventData);

            console.log('LoomSky SDK: Trigger fired successfully:', trigger.event_name);
        } catch (error) {
            console.error('LoomSky SDK: Error firing trigger:', error);
        }
    }

    // Activate trigger setup mode (like mapper setup)
    async activateSetupMode(setupState) {
        console.log('LoomSky SDK: Activating Trigger Setup Mode...');
        
        this.isSetupMode = true;
        this.setupToken = setupState.token;

        try {
            // Verify setup token with API
            const response = await this.api.verifySetupToken(setupState.token);
            
            if (!response || !response.success) {
                console.error('LoomSky SDK: Invalid setup token');
                return false;
            }

            // Load and inject trigger setup tool
            await this.loadTriggerSetupTool(response.data);
            
            return true;
        } catch (error) {
            console.error('LoomSky SDK: Error activating trigger setup:', error);
            return false;
        }
    }

    // Load trigger setup tool (similar to mapper loading)
    async loadTriggerSetupTool(sessionData) {
        console.log('LoomSky SDK: Loading trigger setup tool...');

        try {
            // Create shadow DOM container
            const hostElement = document.createElement('div');
            hostElement.id = 'loomsky-trigger-host';
            hostElement.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                z-index: 999999 !important;
                pointer-events: none !important;
            `;

            const shadowRoot = hostElement.attachShadow({ mode: 'open' });
            const appMountPoint = document.createElement('div');
            document.body.appendChild(hostElement);
            
            // Load CSS first and wait for it to complete (same as mapper)
            await new Promise((resolve, reject) => {
                const cssLink = document.createElement('link');
                cssLink.rel = 'stylesheet';
                cssLink.href = `${TRIGGER_ASSETS_BASE_URL}/triggers.css`;
                cssLink.onload = resolve;
                cssLink.onerror = reject;
                shadowRoot.appendChild(cssLink);
            });
            
            console.log('LoomSky SDK: Trigger CSS loaded successfully.');

            // Load JavaScript after CSS is ready (same as mapper)
            await this._injectTriggerScript();
            console.log('LoomSky SDK: Trigger JS loaded successfully.');

            // Check if mount function is available
            if (typeof window.mountTriggerSetupApp !== 'function') {
                throw new Error('LoomSky SDK: Trigger mount function not found.');
            }

            // Mount app container in Shadow DOM (same as mapper)
            shadowRoot.appendChild(appMountPoint);
            window.mountTriggerSetupApp(appMountPoint, {
                websiteId: sessionData.websiteId,
                pixelId: sessionData.pixelId,
                token: this.setupToken
            });
            
            console.log('LoomSky SDK: Trigger setup tool mounted successfully');

        } catch (error) {
            console.error('LoomSky SDK: Error loading trigger setup tool:', error);
            throw error;
        }
    }

    /**
     * Load trigger setup JavaScript from CDN
     * @private
     */
    _injectTriggerScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `${TRIGGER_ASSETS_BASE_URL}/triggers.js`;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Cleanup method
    destroy() {
        console.log('LoomSky SDK: EventTriggerManager cleaning up...');
        
        // Remove click event listeners
        this.boundHandlers.forEach((handlerData, key) => {
            handlerData.element.removeEventListener('click', handlerData.handler);
        });
        this.boundHandlers.clear();

        // Remove setup tool if exists
        const hostElement = document.getElementById('loomsky-trigger-host');
        if (hostElement) {
            hostElement.remove();
        }
    }
}

export default EventTriggerManager;