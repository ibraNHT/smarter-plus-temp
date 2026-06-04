import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const isVercel = process.env.VERCEL === "1";
const enablePwaOnVercel = process.env.ENABLE_PWA_ON_VERCEL === "true";
const disablePwa = process.env.DISABLE_PWA === "true";
const enablePwa = !disablePwa && (!isVercel || enablePwaOnVercel);

// https://vitejs.dev/config/
// Environment variables prefixed with VITE_ are automatically exposed
// to the client via import.meta.env (e.g. VITE_BACKEND_URL)
export default defineConfig({
  server: {
    proxy: {
      "^/api/(?!.*\\.(?:ts|tsx|js|jsx|mjs|cjs|map|json)$)": {
        target: process.env.VITE_API_PROXY_TARGET ?? "http://localhost:4040",
        changeOrigin: true,
      },
      // Local disk uploads from API (when Cloudinary server keys are unset)
      "/uploads": {
        target: process.env.VITE_API_PROXY_TARGET ?? "http://localhost:4040",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    ...(enablePwa
      ? [
          VitePWA({
            registerType: "autoUpdate",
            injectRegister: "auto",
            includeAssets: [
              "favicon.ico",
              "favicon-16x16.png",
              "favicon-32x32.png",
              "apple-touch-icon.png",
            ],
            workbox: {
              // Skip terser minification of the generated service worker.
              // workbox-build's internal @rollup/plugin-terser worker pool can exit
              // early on Node 20+/22 ("Unexpected early exit … (terser) renderChunk"),
              // which fails the whole build. The SW is a tiny generated file, so an
              // unminified version has no meaningful size/perf impact.
              mode: "development",
              maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
              cleanupOutdatedCaches: true,
              skipWaiting: true,
              clientsClaim: true,
              runtimeCaching: [],
            },
            manifest: {
              name: "AgriMarket Connect",
              short_name: "AgriMarket",
              description:
                "Bridging the gap between agricultural producers and consumers.",
              theme_color: "#16a34a",
              background_color: "#ffffff",
              display: "standalone",
              icons: [
                {
                  src: "pwa-192x192.png",
                  sizes: "192x192",
                  type: "image/png",
                },
                {
                  src: "pwa-512x512.png",
                  sizes: "512x512",
                  type: "image/png",
                },
                {
                  src: "pwa-512x512.png",
                  sizes: "512x512",
                  type: "image/png",
                  purpose: "any maskable",
                },
              ],
            },
            devOptions: {
              enabled: false,
              type: "module",
            },
          }),
        ]
      : []),
  ],
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-router") || id.includes("@remix-run"))
            return "router";
          if (id.includes("@tanstack/react-query")) return "query";
          if (id.includes("socket.io-client")) return "realtime";
          if (id.includes("lucide-react")) return "icons";
          return;
        },
      },
    },
  },
});
