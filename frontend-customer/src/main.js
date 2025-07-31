import './assets/styles/tokens.scss' // Import design tokens đầu tiên

import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Import các plugin
import vuetify from './plugins/vuetify'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify) // Sử dụng Vuetify

app.mount('#app')
