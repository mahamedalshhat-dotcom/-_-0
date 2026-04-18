import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // أضفنا هذا السطر ليعمل الموقع بشكل صحيح على GitHub Pages داخل مجلد المستودع
  base: '/-_-0/', 
  
  plugins: [react()],
  
  build: {
    // للتأكد من أن ملفات الـ Assets يتم توليدها بأسماء واضحة
    outDir: 'dist',
    assetsDir: 'assets',
  },
})