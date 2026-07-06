import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  build: {
    sourcemap: false, // Pastikan ini false untuk produksi
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',   // ← tambahkan ini
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://kitainspect.test',
        changeOrigin: true,
      },
    },
  },
})