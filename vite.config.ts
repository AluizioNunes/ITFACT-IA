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
        target: 'http://localhost',
        changeOrigin: true,
      },
      '/api/discovery': {
        target: 'http://localhost',
        changeOrigin: true,
      },
      '/analytics': {
        target: 'http://localhost',
        changeOrigin: true,
      },
      '/metrics': {
        target: 'http://localhost',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
      }
    }
  }
})
