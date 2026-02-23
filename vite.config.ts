import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// Environment variables prefixed with VITE_ are automatically exposed
// to the client via import.meta.env (e.g. VITE_BACKEND_URL)
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});