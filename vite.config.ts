import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { securityHeadersPlugin } from './plugins/securityHeaders';

import { VitePWA } from 'vite-plugin-pwa';

/** Remove deprecated apple-mobile-web-app-capable and ensure standard mobile-web-app-capable is used. */
function fixPwaMetaPlugin() {
  return {
    name: 'fix-pwa-meta',
    enforce: 'post' as const,
    transformIndexHtml(html: string) {
      let out = html.replace(
        /<meta\s+name="apple-mobile-web-app-capable"\s+content="[^"]*"\s*\/?>\s*/gi,
        ''
      );
      if (!/name="mobile-web-app-capable"/i.test(out)) {
        out = out.replace(
          /(<meta\s+name="viewport"[^>]*>)/i,
          '$1\n  <meta name="mobile-web-app-capable" content="yes">'
        );
      }
      return out;
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3015,
      host: '127.0.0.1',
      strictPort: true,
      // Proxy API + upload routes + static /uploads to backend: same browser origin as Vite → no CORS in dev.
      proxy: {
        '/api': { target: 'http://127.0.0.1:3016', changeOrigin: true },
        '/upload': { target: 'http://127.0.0.1:3016', changeOrigin: true },
        '/uploads': { target: 'http://127.0.0.1:3016', changeOrigin: true },
      },
    },
    // Only add security headers plugin in production (e.g. `vite preview`). In dev they block Vite's inline scripts and break the app.
    plugins: [
      react(),
      ...(mode === 'production' ? [securityHeadersPlugin()] : []),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'smarter-apple-touch-icon.png', 'icon.svg'],
        devOptions: { enabled: true },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          maximumFileSizeToCacheInBytes: 5000000,
          navigateFallback: '/index.html',
        },
        manifest: {
          name: 'Smarter Panel',
          short_name: 'SmarterPanel',
          description: 'Advanced administration and business logic panel.',
          theme_color: '#1f2937', // gray-800
          background_color: '#111827', // gray-900
          display: 'standalone',
          icons: [
            {
              src: '/smarter-pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/smarter-pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/smarter-pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/smarter-pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        }
      }),
      fixPwaMetaPlugin(),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
