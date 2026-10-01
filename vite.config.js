import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/4teahooks/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        globIgnores: ['about/**'],
        // The about page is a real page, not an app route: the service
        // worker must not answer for it with the app shell.
        navigateFallbackDenylist: [/\/about\//],
      },
      manifest: {
        name: '4tea Hooks',
        short_name: '4tea Hooks',
        description: 'Keep your place in any crochet pattern. Private: your projects stay on your device.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f7f1e8',
        theme_color: '#f7f1e8',
        start_url: '/4teahooks/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
