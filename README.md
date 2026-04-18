# نور الحق (Noor Al-Haq)

تطبيق إسلامي شامل يهدف إلى مرافقة المسلم في يومه، مع ميزات ذكية وتصميم عصري.

## المميزات
- **مواقيت الصلاة:** حساب دقيق لمواقيت الصلاة بناءً على الموقع الجغرافي.
- **القرآن الكريم:** قراءة السور مع ميزة البحث الذكي والتنقل السهل.
- **الأذكار:** قوائم أذكار الصباح والمساء والنوم مع عداد تفاعلي.
- **مصحح التلاوة:** ميزة ذكية للتحقق من صحة التلاوة باستخدام الذكاء الاصطناعي.
- **الآية اليومية:** عرض آية عشوائية يومياً مع التفسير والترجمة.
- **المزامنة السحابية:** حفظ الإعدادات والتقدم عبر أجهزة متعددة باستخدام Firebase.

## المتطلبات التقنية
- Node.js (الإصدار 18 أو أحدث)
- npm أو yarn

## طريقة التشغيل محلياً

1. قم بتحميل المشروع أو عمل `git clone`.
2. قم بتثبيت المكتبات:
   ```bash
   npm install
   ```
3. قم بإنشاء ملف `.env` بناءً على `.env.example` وأضف مفاتيح API الخاصة بك:
   - `GEMINI_API_KEY`: مفتاح Google Gemini للذكاء الاصطناعي.
4. قم بتشغيل المشروع في وضع التطوير:
   ```bash
   npm run dev
   ```

## الرفع على الاستضافة (Deployment)

### 1. GitHub Pages / Vercel / Netlify (Static Hosting)
هذا المشروع مبني باستخدام Vite، لذا يمكنك رفعه كـ SPA (Single Page Application):
1. قم ببناء المشروع:
   ```bash
   npm run build
   ```
2. سيتم إنشاء مجلد `dist`. قم برفع محتويات هذا المجلد إلى الاستضافة.
3. **ملاحظة:** إذا كنت تستخدم GitHub Pages، تأكد من ضبط `base` في `vite.config.ts` إذا كان المشروع في مستودع فرعي.

### 2. HostGator / Bluehost (Shared Hosting)
1. قم بتنفيذ `npm run build`.
2. ارفع محتويات مجلد `dist` إلى مجلد `public_html` عبر FTP أو مدير الملفات.
3. تأكد من وجود ملف `.htaccess` للتعامل مع مسارات React (SPA Routing):
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

## تحويل المشروع إلى تطبيق موبايل (Mobile App)

لقد قمت بتهيئة المشروع ليدعم طريقتين للعمل على الموبايل:

### 1. تطبيق ويب تقدمي (PWA) - الأسهل والأسرع
التطبيق الآن يدعم خاصية PWA، مما يعني أنه يمكنك تثبيته على هاتفك دون الحاجة لرفعه على المتجر:
1. ارفع المشروع على أي استضافة (مثل Vercel أو GitHub Pages).
2. افتح الرابط من متصفح الهاتف (Chrome للاندرويد أو Safari للايفون).
3. اضغط على "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).
4. سيظهر التطبيق كأيقونة على هاتفك ويعمل بشكل مستقل.

### 2. تطبيق أصلي (Native App) باستخدام Capacitor
إذا أردت رفع التطبيق على متجر Google Play أو App Store، اتبع الخطوات التالية:
1. قم بتثبيت Capacitor في مشروعك:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init [اسم_التطبيق] [com.example.app]
   ```
2. قم ببناء المشروع:
   ```bash
   npm run build
   ```
3. أضف المنصات التي تريدها:
   ```bash
   npm install @capacitor/android @capacitor/ios
   npx cap add android
   npx cap add ios
   ```
4. لفتح المشروع في Android Studio أو Xcode:
   ```bash
   npx cap open android
   npx cap open ios
   ```

## التقنيات المستخدمة
- **React 19** & **TypeScript**
- **Vite** (Build Tool)
- **Tailwind CSS** (Styling)
- **Firebase** (Auth & Firestore)
- **Dexie.js** (Local Database)
- **Gemini API** (AI Features)

## الترخيص
هذا المشروع متاح للاستخدام الشخصي والتعليمي.
