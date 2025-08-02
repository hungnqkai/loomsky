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

// --- GIAI ĐOẠN 0: TÍCH HỢP DESIGN TOKENS (FIXED) ---
// Cấu hình theme cho Vuetify để sử dụng các màu sắc từ Brand Guidelines.
//
// LƯU Ý: Chúng ta định nghĩa màu trực tiếp ở đây để đảm bảo Vuetify
// có thể tính toán các biến thể màu (lighten, darken) một cách ổn định nhất.
// Điều này tạo ra một sự trùng lặp nhỏ với file `tokens.scss`, nhưng đảm bảo
// hệ thống hoạt động đáng tin cậy.
//
// QUY TẮC: Khi cập nhật màu trong `tokens.scss`, cần cập nhật đồng bộ ở file này.
const loomskyTheme = {
  themes: {
    light: {
      dark: false,
      colors: {
        primary: '#6366F1',     // Tương ứng với --loomsky-primary
        secondary: '#EC4899',   // Tương ứng với --loomsky-secondary
        accent: '#10B981',      // Tương ứng với --loomsky-accent
        error: '#EF4444',       // Tương ứng với --loomsky-error
        warning: '#F59E0B',     // Tương ứng với --loomsky-warning
        info: '#3B82F6',        // Tương ứng với --loomsky-info
        success: '#10B981',     // Tương ứng với --loomsky-success
        background: '#F8FAFC',  // Tương ứng với --loomsky-neutral-50
        surface: '#FFFFFF',     // Tương ứng với --loomsky-white
        colorless: '#ffffff00',   // Trong suốt
        
        // Định nghĩa thêm các màu chữ tương phản để Vuetify tự động sử dụng
        'on-background': '#1F2937', // Tương ứng với --loomsky-neutral-800
        'on-surface': '#111827',    // Tương ứng với --loomsky-neutral-900
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
