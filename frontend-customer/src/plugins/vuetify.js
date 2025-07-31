/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// Lấy theme từ Brand Guidelines của LoomSky
// Đây là nơi chúng ta định nghĩa màu sắc thương hiệu cho các component của Vuetify
const loomskyTheme = {
  themes: {
    light: {
      colors: {
        primary: '#6366F1',
        'primary-light': '#818CF8',
        'primary-dark': '#4F46E5',
        secondary: '#EC4899',
        'secondary-light': '#F472B6',
        'secondary-dark': '#DB2777',
        accent: '#10B981', // Note: Using success color as accent for better visibility
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
        success: '#10B981',
        background: '#F8FAFC', // Màu nền chung của app (màu Neutral-50)
        surface: '#FFFFFF', // Màu của các bề mặt như Card, Menu
      },
    },
  },
}

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: loomskyTheme.themes.light,
    },
  },
})
