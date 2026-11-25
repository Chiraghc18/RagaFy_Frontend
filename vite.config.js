import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['ragafy-logo.png'],
      manifest: {
        name: 'RagaFy Beats',
        short_name: 'RagaFy',
        description: 'Your Ultimate Music Experience',
        theme_color: '#080F27',
        background_color: '#080F27',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/ragafy-logo.png', sizes: '192x192', type: 'image/png' },
          { src: '/ragafy-logo.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // 🔥 THIS IS THE FIX: Increase the max size to 10MB
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, 
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ragafy-backend\.onrender\.com\/songs\/.*\/photo/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'song-cover-cache',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
});