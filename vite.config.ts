import { defineConfig } from 'rolldown-vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api/inventory': {
        target: 'http://172.18.1.32',
        changeOrigin: true,
      },
      '/api/discovery': {
        target: 'http://172.18.1.32',
        changeOrigin: true,
      },
      '/analytics': {
        target: 'http://172.18.1.32',
        changeOrigin: true,
      },
      '/metrics': {
        target: 'http://172.18.1.32',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://172.18.1.32',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://172.18.1.32',
        changeOrigin: true,
      }
    }
  }
})
