import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'mapper') {
    // --- Cấu hình build dành riêng cho Data Mapper Mini-App ---
    return {
      // Bật chế độ build library
      build: {
        lib: {
          // File đầu vào của mini-app
          entry: resolve(__dirname, 'src/mapper.js'),
          // Tên của biến global khi được chèn vào trang
          name: 'LoomSkyDataMapper',
          // Tên file output
          fileName: 'mapper',
          // Định dạng IIFE (Immediately Invoked Function Expression) là hoàn hảo để chèn vào thẻ <script>
          formats: ['iife'], 
        },
        emptyOutDir: false, // Không xóa thư mục dist để build chính không bị ảnh hưởng
        rollupOptions: {
          output: {
            // Đặt tên file output một cách tường minh
            entryFileNames: 'mapper.js',
            assetFileNames: 'mapper.[ext]',
          },
        },
      },
      plugins: [
        vue(),
        vuetify({ autoImport: true }),
      ],
      define: {
        'process.env': {}
      },
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url))
        }
      }
    }
  } else {
    // --- Cấu hình build mặc định cho ứng dụng Dashboard chính ---
    return {
      plugins: [
        vue(),
        vuetify({ autoImport: true }),
      ],
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url))
        }
      }
    }
  }
})
