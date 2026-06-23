# نظام متابعة المتدربات — vllogsraye

تطبيق Node.js + SQLite لإدارة المتدربات، الجداول، تتبّع التمارين، والسعرات.
يُخدَّم على **نفس الدومين** تحت المسار `vllogsraye.com/app` (نفس شهادة SSL، بدون نطاق فرعي).
الموقع الرئيسي يبقى كما هو ولا يتأثر.

## المزايا
- **الإدارة**: لوحة إحصائيات، إضافة مشتركات بمدة اشتراك، تمديد/إيقاف، مكتبة تمارين (مع GIF/فيديو)، منشئ جداول، تقارير لكل مشتركة.
- **المتدربة**: دخول بيوزر/باسورد، تمرين اليوم، تتبّع كل ست (وزن + تكرارات)، متابعة السعرات والبروتين، صفحة تقدّم.
- بدون دفع — الإدارة تنشئ الحسابات يدوياً وتحدد المدة. ينتهي الدخول تلقائياً بانتهاء المدة.

## الحساب الافتراضي للإدارة (غيّري كلمة المرور بعد أول دخول)
- المستخدم: `vllogsraye` — كلمة المرور: `vllogs2025`

---

## خطوات الرفع على السيرفر (مرة واحدة)

> ملاحظة: ملفات التطبيق تُرفع تلقائياً مع المستودع عبر `git pull` في `/var/www/vllogsraye/app`.

### 1) ثبّتي Node.js (إن لم يكن موجوداً)
```bash
node -v   # لو ظهر رقم إصدار، تخطّي هذه الخطوة
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
```

### 2) ثبّتي الحزم وشغّلي التطبيق كخدمة دائمة (pm2)
```bash
cd /var/www/vllogsraye/app
npm install --omit=dev
npm install -g pm2
SESSION_SECRET="اكتبي-هنا-جملة-سرية-طويلة-عشوائية" pm2 start server.js --name vllogsraye-app
pm2 save
pm2 startup    # نفّذي السطر الذي يطبعه لك لتشغيل التطبيق تلقائياً بعد إعادة التشغيل
```
التطبيق الآن يعمل على المنفذ 3001 داخلياً تحت المسار `/app`.

### 3) أضيفي بلوك التمرير لإعداد Nginx الحالي لموقعك
داخل `server` block الخاص بـ vllogsraye.com (المنفذ 443 — الذي أنشأه certbot)،
أضيفي هذا البلوك قبل `location / {`:
```nginx
    client_max_body_size 30M;
    location /app/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location = /app { return 301 /app/; }
```
ثم:
```bash
nginx -t && systemctl reload nginx
```

> لا حاجة لسجل DNS جديد ولا شهادة SSL جديدة — يستخدم دومين وشهادة vllogsraye.com نفسها.

افتحي الآن: **https://vllogsraye.com/app** 🎉

---

## تحديث التطبيق لاحقاً (عند أي تعديل)
```bash
cd /var/www/vllogsraye && git pull
cd app && npm install --omit=dev
pm2 restart vllogsraye-app
```

## نسخة احتياطية للبيانات
كل البيانات في ملف واحد: `/var/www/vllogsraye/app/data.db`
```bash
cp /var/www/vllogsraye/app/data.db ~/backup-$(date +%F).db
```
