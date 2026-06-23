# نظام متابعة المتدربات — vllogsraye

تطبيق Node.js + SQLite لإدارة المتدربات، الجداول، تتبّع التمارين، والسعرات.
يُرفع على نطاق فرعي منفصل (`app.vllogsraye.com`) ولا يؤثر على الموقع الرئيسي.

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
التطبيق الآن يعمل على المنفذ 3001 داخلياً.

### 3) أضيفي A record للنطاق الفرعي في Netlify
- النوع: `A` — الاسم: `app` — القيمة: `207.180.202.200`

### 4) أنشئي إعداد Nginx للنطاق الفرعي
```bash
cat > /etc/nginx/sites-available/app.vllogsraye << 'EOF'
server {
    listen 80;
    server_name app.vllogsraye.com;
    client_max_body_size 30M;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
ln -s /etc/nginx/sites-available/app.vllogsraye /etc/nginx/sites-enabled/app.vllogsraye
nginx -t && systemctl reload nginx
```

### 5) فعّلي شهادة SSL (https)
```bash
certbot --nginx -d app.vllogsraye.com
```

افتحي الآن: **https://app.vllogsraye.com** 🎉

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
