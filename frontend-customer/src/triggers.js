// File: frontend-customer/src/triggers.js - Event Triggers Setup Tool Entry Point

import { createApp } from 'vue';
import TriggerSetupTool from './components/triggers/TriggerSetupTool.vue';

// Import Vuetify components
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

function mountTriggerSetupApp(appMountPoint, options = {}) {
  // Create separate Vuetify instance for Trigger Setup Tool
  const vuetify = createVuetify({
    components,
    directives,
    // CRITICAL: Attach all dynamic components (dialogs, menus, etc.) 
    // to the Shadow DOM container, not document.body
    defaults: {
      global: {
        attach: appMountPoint,
      }
    },
  });

  const app = createApp(TriggerSetupTool, {
    ...options
  });
  
  // Use the dedicated Vuetify instance
  app.use(vuetify);
  
  app.mount(appMountPoint);
}

window.mountTriggerSetupApp = mountTriggerSetupApp;