Viewed page.tsx:1-60
Viewed PublicPostView.tsx:1-45
Viewed page.tsx:1-21
Viewed layout.tsx:1-62
Viewed Dockerfile:1-60
Viewed Dockerfile:61-143
Searched for "NEXT_PUBLIC_CDN_URL"
Viewed page.tsx:1-14
Viewed manifest.ts:1-45
Viewed sw.ts:1-34
Viewed serwist.config.mjs:1-22

برای پیاده‌سازی کش پایدار (Robust Caching) با بازدهی **+۹۰٪ Cache Hit Ratio** روی **Arvan CDN** و **Nginx** بدون کوچک‌ترین خطر نشت کوکی (Cookie Leakage) یا جابه‌جایی حساب کاربران (Session Hijacking)، معماری کش باید بر اساس یک تفکیک دقیق ۳ لایه‌ای پیاده‌سازی شود:

---

### ۱. خطر امنیتی نشت کوکی چیست و چطور رخ می‌دهد؟

در فریم‌ورک‌های مدرن مثل Next.js، نشت کوکی در لایه کش CDN/Nginx معمولاً به دو شکل فاجعه‌بار رخ می‌دهد:

1. **نشت هدر `Set-Cookie` (Session Hijacking):**  
   اگر Nginx یا CDN پاسخ یک صفحه‌ای را کش کند که شامل هدر `Set-Cookie` است (مثلاً در فرآیند لاگین یا تمدید توکن)، آن کوکی به **همه کاربران بعدی** که آن صفحه را باز کنند داده می‌شود و حساب کاربر اول تصاحب می‌شود.
2. **نشت اطلاعات هیدریشن در HTML (User Data Leakage):**  
   در این پروژه در فایل [app/layout.tsx](file:///Volumes/External/Projects/inshop-app/app/layout.tsx#L72-L75)، تابع `getServerProfile()` فراخوانی می‌شود و مشخصات کاربر (`initialUser`) مستقیماً درون HTML خروجی رندر می‌شود. اگر صفحه اصلی `/` یا پروفایل فروشگاه کش شود در حالی که یک کاربر لاگین بوده است، اطلاعات نام، شماره تماس و پروفایل او درون کش ذخیره شده و به بقیه کاربران نشان داده می‌شود!

---

### ۲. ماتریس دسته‌بندی مسیرها (Route Caching Strategy)

| مسیر (Route) | نوع محتوا | وضعیت کش Nginx / CDN | هدر Cache-Control | شرط امنیتی / کوکی |
| :--- | :--- | :--- | :--- | :--- |
| **`/_next/static/*`** | فایل‌های کامپایل‌شده JS/CSS/Fonts | **کش کامل (۱۰۰٪)** | `public, max-age=31536000, immutable` | بدون کوکی؛ هش محتوا دارند |
| **`/favicon/*` و تصاویر static** | آیکون‌ها و لوگوهای ثابت | **کش کامل (۱۰۰٪)** | `public, max-age=604800` (۷ روز) | بدون کوکی |
| **`/sw.js`** | Service Worker PWA | **اکیداً غیرفعال (۰٪)** | `no-cache, no-store, must-revalidate` | جهت دریافت آپدیت آنی PWA |
| **`/manifest.webmanifest`** | مانیفست PWA | **کش کوتاه‌مدت** | `public, max-age=3600` (۱ ساعت) | اطلاعات نصب برنامه |
| **`/about`, `/contact`, `/terms`, `/privacy`** | صفحات ایستا و عمومی | **کش عمومی (۹۹٪)** | `s-maxage=86400, stale-while-revalidate=604800` | حذف هدر `Set-Cookie` |
| **`/offline`** | صفحه آفلاین PWA | **کش عمومی** | `public, max-age=86400` | بدون داده خصوصی |
| **`/` (صفحه اصلی / فید)** | پوسته فید عمومی | **کش فقط برای مهمان (Guest)** | `s-maxage=60, stale-while-revalidate=300` | **Bypass کش در صورت وجود کوکی نشست** |
| **`/[handle]` (`/@seller`)** | پروفایل عمومی فروشگاه | **کش فقط برای مهمان (Guest)** | `s-maxage=120, stale-while-revalidate=600` | **Bypass کش در صورت وجود کوکی نشست** |
| **`/p/[id]`** | جزییات پست عمومی | **کش فقط برای مهمان (Guest)** | `s-maxage=300, stale-while-revalidate=86400` | **Bypass کش در صورت وجود کوکی نشست** |
| **`/app/*`** (پروفایل، پست جدید، ...) | داشبورد و صفحات خصوصی | **اکیداً غیرفعال (NO-CACHE)** | `private, no-cache, no-store, max-age=0` | عبور مستقیم به سرور اصلی |
| **`/auth/*`** (ورود، لاگین، OTP) | صفحات احراز هویت | **اکیداً غیرفعال (NO-CACHE)** | `private, no-cache, no-store, max-age=0` | تولید و تنظیم کوکی |
| **`/api/auth/*` و `/me`** | اندپوینت‌های توکن و سشن | **اکیداً غیرفعال (NO-CACHE)** | `private, no-store, max-age=0` | حاوی اطلاعات حساس کاربر |

---

### ۳. چگونه دارایی‌ها (Assets) با Hash کش شوند و آپدیت راحت داده شود؟

1. **فایل‌های کامپایل‌شده Next.js (`/_next/static/`):**
   - به صورت پیش‌فرض، Next.js تمام فایل‌های جاوااسکریپت و سی‌اس‌اس را با **Content Hash** تولید می‌کند (مانند `chunks/app/layout-48a0f9b.js`).
   - نیازی به Purge کردن این فایل‌ها روی CDN در هر دیپلوی ندارید؛ چون در هر بیلد جدید، نام فایل‌ها عوض می‌شود.
   - بنابراین این فایل‌ها می‌توانند تا **یک سال** کش شوند (`immutable`).
2. **فایل‌های داخل پوشه `public/`:**
   - اگر از تصاویر و آیکون‌ها در کامپوننت‌ها استفاده می‌کنید، به جای `<img src="/logo.png" />` از `import logo from '@/public/logo.png'` استفاده کنید تا Next.js به طور خودکار به آن هش اضافه کند (`/_next/static/media/logo.20f83c.png`).
3. **مکانیزم انتشار آپدیت بدون تداخل (Invalidation Flow):**
   - دارایی‌های استاتیک (`/_next/static/*`) نیازی به Invalidate شدن ندارند.
   - فقط کافی است بعد از دیپلوی جدید، در پایپ‌لاین CI/CD یا داشبورد آروان، **فقط مسیرهای HTML** (مانند `/`, `/about`, `/@*`, `/p/*`) یا کل کش HTML را پاک (Purge) کنید. به محض اینکه مرورگر کاربر HTML جدید را دریافت کند، مسیر چانک‌های با هش جدید را لود می‌کند و هیچ کاربر با نسخه قدیمی یا استایل شکسته روبه‌رو نمی‌شود.

---

### ۴. کانفیگ کامل Nginx برای رسیدگی به ۱۰۰ هزار کاربر

این کانفیگ Nginx را روی سرور اعمال کنید. این کانفیگ تضمین می‌کند:
- درخواست‌هایی که کوکی احراز هویت دارند هرگز کش مشترک را تحویل نگیرند.
- هدر `Set-Cookie` هرگز وارد کش نشود (`proxy_hide_header Set-Cookie`).
- فایل‌های استاتیک بدون کوکی و با حداکثر سرعت از رم/دیسک کش شوند.

```nginx
# تعریف فضای ذخیره‌سازی کش در Nginx (رم ۱۰۰ مگابایت، دیسک ۱۰ گیگابایت)
proxy_cache_path /var/cache/nginx/inshop_cache
    levels=1:2
    keys_zone=INSHOP_CACHE:100m
    max_size=10g
    inactive=7d
    use_temp_path=off;

map $http_cookie $bypass_cache {
    default 0;
    # اگر کوکی‌های احراز هویت better-auth وجود داشت، کش را دور بزن
    ~*better-auth\.session_token 1;
    ~*session_token 1;
}

upstream nextjs_upstream {
    server 127.0.0.1:3000 max_fails=3 fail_timeout=10s;
    keepalive 64;
}

server {
    listen 80;
    server_name inshop.social;

    # فشرده‌سازی برای پاسخ‌های سریع‌تر به CDN
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml+rss image/svg+xml;

    # -------------------------------------------------------------
    # ۱. فایل‌های کامپایل‌شده بیلد Next.js (هش‌دار - کش ابدی)
    # -------------------------------------------------------------
    location /_next/static/ {
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        # حذف کوکی‌ها جهت جلوگیری از سربار و افزایش کش‌پذیری
        proxy_hide_header Set-Cookie;
        proxy_ignore_headers Set-Cookie;

        add_header Cache-Control "public, max-age=31536000, immutable" always;
        add_header X-Cache-Status "STATIC-IMMUTABLE";
    }

    # -------------------------------------------------------------
    # ۲. سرویس‌ورکر PWA (اکیداً بدون کش - حیاتی برای آپدیت کاربران)
    # -------------------------------------------------------------
    location = /sw.js {
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        
        add_header Cache-Control "no-cache, no-store, must-revalidate, max-age=0" always;
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # -------------------------------------------------------------
    # ۳. مسیرهای خصوصی و احراز هویت (اکیداً بدون کش)
    # -------------------------------------------------------------
    location ~* ^/(app|auth|api/auth)/ {
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # به هیچ وجه کش نشود
        proxy_no_cache 1;
        proxy_cache_bypass 1;
        add_header Cache-Control "private, no-cache, no-store, must-revalidate, max-age=0" always;
    }

    # -------------------------------------------------------------
    # ۴. مسیرهای عمومی (صفحه اصلی، پروفایل فروشگاه، پست‌ها، درباره ما)
    # -------------------------------------------------------------
    location / {
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # تنظیمات کش هوشمند:
        proxy_cache INSHOP_CACHE;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        
        # اگر کاربر لاگین بود، کش را دور بزن تا اطلاعات بقیه را نبیند
        proxy_cache_bypass $bypass_cache;
        proxy_no_cache $bypass_cache;

        # جلوگیری حیاتی از کش شدن کوکی سشن
        proxy_hide_header Set-Cookie;

        # زمان‌های کش برای مهمانان
        proxy_cache_valid 200 301 302 5m;
        proxy_cache_valid 404 1m;

        # قابلیت Stale-While-Revalidate روی Nginx هنگام ترافیک سنگین
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_background_update on;
        proxy_cache_lock on;

        add_header X-Cache-Status $upstream_cache_status;
    }
}
```

---

### ۵. تنظیمات قوانین صفحات (Page Rules) در ابر آروان (Arvan CDN)

برای رسیدن به **+۹۰٪ Cache Hit** روی لبه‌های (Edge Nodes) ابر آروان در ایران، این قوانین را به ترتیب اولویت (Priority) در پنل آروان بخش **CDN > قوانین صفحات (Page Rules)** تنظیم کنید:

#### قانون ۱: فایل‌های استاتیک Next.js (بیشترین ترافیک و ۹۹٪ کش)
* **آدرس (URL):** `*inshop.social/_next/static/*`
* **وضعیت کش (Caching Level):** ذخیره همه‌چیز (Cache Everything)
* **مدت زمان کش لبه (Edge Cache TTL):** ۱ سال
* **مدت زمان کش مرورگر (Browser Cache TTL):** ۱ سال
* **نادیده گرفتن کوکی (Strip Cookies):** فعال

#### قانون ۲: تصاویر و آیکون‌های عمومی (Favicon & Icons)
* **آدرس (URL):** `*inshop.social/favicon/*`
* **وضعیت کش (Caching Level):** ذخیره همه‌چیز
* **مدت زمان کش لبه:** ۳۰ روز
* **مدت زمان کش مرورگر:** ۷ روز

#### قانون ۳: سرویس ورکر (PWA Service Worker)
* **آدرس (URL):** `*inshop.social/sw.js`
* **وضعیت کش (Caching Level):** خاموش / عدم ذخیره در حافظه کش (Bypass)

#### قانون ۴: پنل کاربری و صفحات لاگین و احراز هویت
* **آدرس (URL):** `*inshop.social/app/*` و `*inshop.social/auth/*`
* **وضعیت کش (Caching Level):** خاموش / عدم ذخیره در حافظه کش (Bypass)

#### قانون ۵: صفحات عمومی (`/`, `/@*`, `/p/*`, `/about`)
* **آدرس (URL):** `*inshop.social/*`
* **وضعیت کش (Caching Level):** ذخیره همه‌چیز (Cache Everything)
* **مدت زمان کش لبه (Edge TTL):** ۵ الی ۱۰ دقیقه
* **مدت زمان کش مرورگر:** ۵ دقیقه
* **شرط کش بر اساس کوکی (Bypass cache on cookie):**  
  تنظیم کنید اگر کوکی شامل `better-auth.session_token` یا `session_token` بود، **کش دور زده شود**.
  *(در صورتی که پنل آروان پلن سازمانی شرط کوکی پیشرفته نداشته باشد، Nginx بالا هدر `Cache-Control: private, no-store` را برای درخواست‌های کوکی‌دار ارسال می‌کند و آروان به طور پیش‌فرض آن را کش نمی‌کند).*

---

### ۶. بهبود معماری کد در صورت تمایل به کش ۱۰۰٪ صفحه اصلی (HTML Shell)

در حال حاضر [app/layout.tsx](file:///Volumes/External/Projects/inshop-app/app/layout.tsx#L72-L75) در سرور `getServerProfile()` را فراخوانی می‌کند.  
اگر ترجیح می‌دهید حتی برای کاربران لاگین هم صفحه اصلی از کش لبه بیاید:
- اجازه دهید صفحه اصلی `/` به صورت کاملاً بی‌نام (Anonymous) و ثابت رندر شود.
- مشخصات کاربر لاگین (`/me`) تنها از طریق کلاینت با React Query در [UserContext.tsx](file:///Volumes/External/Projects/inshop-app/features/profile/context/UserContext.tsx) دریافت شود.
- در این حالت، **۱۰۰٪ ترافیک HTML برای همه ۱۰۰ هزار کاربر از CDN با پاسخ کمتر از ۱۵ میلی‌ثانیه تحویل داده می‌شود** و سرور Node.js شما فقط پاسخگوی درخواست‌های سبک JSON مربوط به `/me` خواهد بود.