import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // لتحديث التطبيق تلقائياً عند رفع نسخة جديدة
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-able-icon.png'],
      manifest: {
        name: 'نور الحق',
        short_name: 'نور',
        description: 'مساعد إسلامي ذكي لعلوم القرآن والتفسير',
        theme_color: '#003366', // اللون الكحلي ليتناسق مع خلفية الأيقونة
        background_color: '#ffffff',
        display: 'standalone', // ليفتح كأنه تطبيق منفصل وليس داخل المتصفح
        orientation: 'portrait', // لتثبيت العرض الرأسي
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable' // مهم جداً لظهور الأيقونة بشكل سليم في أندرويد
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ],
      },
      devOptions: {
        enabled: true // لتجربة ميزات الـ PWA حتى أثناء التطوير (localhost)
      }
    }),
  ],
});