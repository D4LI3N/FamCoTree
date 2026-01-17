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
        short_name: 'FCT',
        description: 'Family tree editor (offline)',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: "/",
		    scope: "/",
        icons: [
          { src: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' }
        ],
        screenshots: [
          {
            src: 'wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: 'narrow.png',
            sizes: '375x667',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,json,webmanifest,woff2,woff,ttf}'], // cache everything in your build
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