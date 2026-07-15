import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // El SW se actualiza y activa solo cuando hay una versión nueva.
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Permite probar la PWA (manifest + SW) en `npm run dev`.
      devOptions: { enabled: true },
      manifest: {
        name: 'MIXAPP — Constructor de mezclas',
        short_name: 'MIXAPP',
        description:
          'Constructor de mezclas musicales por bloques, 100% en el navegador',
        lang: 'es',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#1a1a1a',
        background_color: '#1a1a1a',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Solo se precachea el "app shell"; los audios del usuario viven en
        // IndexedDB, no en el cache del service worker.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // wavesurfer.js + realtime-bpm-analyzer generan bundles grandes.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
