import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const isVercel = process.env.VERCEL === '1';
const enablePwaOnVercel = process.env.ENABLE_PWA_ON_VERCEL === 'true';
const enablePwa = !isVercel || enablePwaOnVercel;

// https://vitejs.dev/config/
// Environment variables prefixed with VITE_ are automatically exposed
// to the client via import.meta.env (e.g. VITE_BACKEND_URL)
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    ...(enablePwa ? [VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'AgriMarket Connect',
        short_name: 'AgriMarket',
        description: 'Bridging the gap between agricultural producers and consumers.',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: false,
        type: 'module',
      }
    })] : [])
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router') || id.includes('@remix-run')) return 'router';
          if (id.includes('@tanstack/react-query')) return 'query';
          if (id.includes('socket.io-client')) return 'realtime';
          if (id.includes('lucide-react')) return 'icons';
          return;
        },
      },
    },
  }
});