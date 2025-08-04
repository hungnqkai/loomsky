/*
File: sdk/src/core.js (CẬP NHẬT)
- Truyền ApiService vào EventListener.
*/
import Identity from './modules/identity';
import EventListener from './modules/eventListener';
import ApiService from './utils/api';

class Core {
    constructor() {
        console.log('LoomSky SDK: Core initializing...');
        this.apiKey = this.getApiKey();
        this.config = null;
        
        if (this.apiKey) {
            this.api = new ApiService(this.apiKey);
            this.identity = new Identity();
            this.eventListener = new EventListener(this.api); // Truyền api service vào
        }
    }

    getApiKey() {
        return document.currentScript?.getAttribute('data-api-key') || null;
    }

    async fetchConfig() {
        if (!this.api) return;
        console.log(`LoomSky SDK: Fetching config for API Key: ${this.apiKey}`);
        this.config = await this.api.getConfig();
        if (this.config) {
            console.log('LoomSky SDK: Configuration loaded successfully.', this.config);
        }
    }

    async start() {
        if (!this.apiKey) {
            console.error('LoomSky SDK: API Key is missing. SDK will not start.');
            return;
        }
        
        console.log('LoomSky SDK: Starting...');
        await this.fetchConfig();
        
        if (this.config) {
            this.eventListener.start(this.config, this.identity);
            console.log('LoomSky SDK: Started successfully.');
        } else {
            console.error('LoomSky SDK: Could not load configuration. SDK is disabled.');
        }
    }
}

export default Core;