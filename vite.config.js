import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const DEV_API_TARGET = process.env.VITE_DEV_API_TARGET || 'http://localhost:5000';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  define: {
    // Cloudflare Environment Variable
    __API_URL__: JSON.stringify(
      process.env.VITE_API_URL || 
      'https://your-domain.com/api'
    ),
    __ENV__: JSON.stringify(process.env.NODE_ENV || 'production')
  },

  build: {
    // Optimize for Cloudflare Pages
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        // Rolldown expects manualChunks as a function.
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react';
          }
          if (id.includes('node_modules/react-router-dom')) {
            return 'router';
          }
          if (id.includes('node_modules/zustand')) {
            return 'state';
          }
          if (id.includes('node_modules/axios')) {
            return 'http';
          }
          return undefined;
        }
      }
    }
  },

  server: {
    // Dev server config
    port: 5173,
    proxy: {
      // Proxy relative /api calls to local backend in dev.
      '/api': {
        target: DEV_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
