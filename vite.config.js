/*
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()]
});
*/

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    sveltekit(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'x.png', 'x2.png'], // your static files
      manifest: {
        name: 'FamCoTree',
        short_name: 'FamCoTree',
        description: 'Family tree editor with offline support',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/?pwa=true',
        icons: [
          { src: '/x.png', sizes: '192x192', type: 'image/png' },
          { src: '/x2.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'], // cache everything in your build
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*$/, // optional: cache external APIs
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 }
            }
          }
        ]
      }
    })
  ]
});