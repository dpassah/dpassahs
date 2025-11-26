# 🚀 دليل نشر التطبيق على Hostinger VPS

## 📋 المتطلبات الأساسية

- ✅ VPS Hostinger نشط
- ✅ الوصول إلى SSH
- ✅ قاعدة بيانات MySQL على Hostinger
- ✅ Domain (tchadcare.com)

---

## 🔧 الخطوة 1: الاتصال بـ VPS عبر SSH

### من Windows (PowerShell أو CMD)

```bash
ssh root@your-vps-ip
# أو
ssh username@tchadcare.com
```

**ستحتاج إلى:**
- عنوان IP الخاص بـ VPS (من لوحة Hostinger)
- كلمة المرور أو SSH Key

---

## 📦 الخطوة 2: تثبيت المتطلبات على VPS

### 1. تحديث النظام

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. تثبيت Node.js و npm

```bash
# تثبيت Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# التحقق من التثبيت
node --version
npm --version
```

### 3. تثبيت Git

```bash
sudo apt install -y git
```

### 4. تثبيت PM2 (لإدارة التطبيق)

```bash
sudo npm install -g pm2
```

### 5. تثبيت Nginx (كـ Reverse Proxy)

```bash
sudo apt install -y nginx
```

---

## 📂 الخطوة 3: رفع الكود إلى VPS

### الطريقة 1: استخدام Git (الأفضل)

#### أ. إنشاء Repository على GitHub

1. اذهب إلى https://github.com/new
2. أنشئ repository جديد (مثلاً: `portail-sila`)
3. اجعله **Private** لحماية البيانات الحساسة

#### ب. رفع الكود من جهازك

```bash
# في مجلد المشروع على جهازك (d:\portail)
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/portail-sila.git
git push -u origin main
```

#### ج. استنساخ المشروع على VPS

```bash
# على VPS
cd /var/www
sudo git clone https://github.com/your-username/portail-sila.git
sudo chown -R $USER:$USER portail-sila
cd portail-sila
```

### الطريقة 2: استخدام FileZilla أو SCP

```bash
# من جهازك (Windows)
scp -r d:\portail root@your-vps-ip:/var/www/portail-sila
```

---

## ⚙️ الخطوة 4: إعداد Backend

### 1. الانتقال إلى مجلد Backend

```bash
cd /var/www/portail-sila/backend
```

### 2. تثبيت Dependencies

```bash
npm install
```

### 3. إنشاء ملف .env

```bash
nano .env
```

**أضف المحتوى التالي:**

```env
# Server
PORT=5000
NODE_ENV=production
ALLOWED_ORIGINS=https://tchadcare.com,http://tchadcare.com

# Database (من لوحة Hostinger)
DB_HOST=mysql_hostname_from_hostinger
DB_PORT=3306
DB_USER=u557748645_yami
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
DB_CONNECTION_LIMIT=10

# Email (SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=your-email@tchadcare.com
SMTP_PASS=your-email-password
SMTP_SECURE=false
SMTP_FROM="Portail HUMANITAIRES <no-reply@tchadcare.com>"

# Admin
ADMIN_DEFAULT_PASS=DPASSAHS@2025

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**احفظ الملف:** `Ctrl + X` ثم `Y` ثم `Enter`

### 4. بناء Backend

```bash
npm run build
```

### 5. تشغيل Backend مع PM2

```bash
pm2 start dist/server.js --name portail-backend
pm2 save
pm2 startup
```

**للتحقق من الحالة:**
```bash
pm2 status
pm2 logs portail-backend
```

---

## 🎨 الخطوة 5: إعداد Frontend

### 1. الانتقال إلى مجلد المشروع الرئيسي

```bash
cd /var/www/portail-sila
```

### 2. إنشاء ملف .env.local

```bash
nano .env.local
```

**أضف:**

```env
GEMINI_API_KEY=your_gemini_api_key
VITE_API_BASE_URL=https://tchadcare.com/api
```

**احفظ الملف**

### 3. تثبيت Dependencies

```bash
npm install
```

### 4. بناء Frontend للإنتاج

```bash
npm run build
```

سيتم إنشاء مجلد `dist` يحتوي على ملفات الإنتاج.

---

## 🌐 الخطوة 6: إعداد Nginx

### 1. إنشاء ملف إعدادات Nginx

```bash
sudo nano /etc/nginx/sites-available/tchadcare.com
```

### 2. أضف الإعدادات التالية:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name tchadcare.com www.tchadcare.com;

    # Frontend (Static Files)
    root /var/www/portail-sila/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Frontend Routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API (Reverse Proxy)
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static Assets Caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**احفظ الملف**

### 3. تفعيل الموقع

```bash
sudo ln -s /etc/nginx/sites-available/tchadcare.com /etc/nginx/sites-enabled/
```

### 4. اختبار إعدادات Nginx

```bash
sudo nginx -t
```

### 5. إعادة تشغيل Nginx

```bash
sudo systemctl restart nginx
```

---

## 🔒 الخطوة 7: تثبيت SSL (HTTPS)

### استخدام Let's Encrypt (مجاني)

```bash
# تثبيت Certbot
sudo apt install -y certbot python3-certbot-nginx

# الحصول على شهادة SSL
sudo certbot --nginx -d tchadcare.com -d www.tchadcare.com

# تجديد تلقائي
sudo certbot renew --dry-run
```

سيتم تحديث إعدادات Nginx تلقائياً لاستخدام HTTPS.

---

## 🔥 الخطوة 8: إعداد Firewall

```bash
# السماح بـ SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 🗄️ الخطوة 9: إعداد قاعدة البيانات

### 1. إضافة عنوان IP الخاص بـ VPS في Hostinger

1. اذهب إلى: https://hpanel.hostinger.com/websites/tchadcare.com/databases/remote-my-sql
2. احصل على عنوان IP الخاص بـ VPS:
   ```bash
   curl ifconfig.me
   ```
3. أضف هذا العنوان في **Remote MySQL** على Hostinger

### 2. اختبار الاتصال بقاعدة البيانات

```bash
cd /var/www/portail-sila/backend
node -e "require('./dist/db').initDB().then(() => console.log('DB Connected!')).catch(console.error)"
```

---

## 📊 الخطوة 10: إدارة التطبيق

### أوامر PM2 المفيدة

```bash
# عرض حالة التطبيق
pm2 status

# عرض السجلات
pm2 logs portail-backend

# إعادة تشغيل
pm2 restart portail-backend

# إيقاف
pm2 stop portail-backend

# حذف من PM2
pm2 delete portail-backend

# مراقبة الموارد
pm2 monit
```

### إعادة تشغيل Nginx

```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

---

## 🔄 الخطوة 11: تحديث التطبيق

عند إجراء تعديلات على الكود:

```bash
# على VPS
cd /var/www/portail-sila

# سحب آخر التحديثات من Git
git pull origin main

# تحديث Backend
cd backend
npm install
npm run build
pm2 restart portail-backend

# تحديث Frontend
cd ..
npm install
npm run build

# إعادة تشغيل Nginx
sudo systemctl restart nginx
```

---

## 🛠️ الخطوة 12: تعديل ملفات API في Frontend

### تحديث عنوان API

تأكد من أن جميع استدعاءات API في Frontend تستخدم المسار الصحيح:

**قبل (Development):**
```javascript
const API_URL = 'http://localhost:5000/api';
```

**بعد (Production):**
```javascript
const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';
```

---

## 📝 ملف خدمة Systemd (بديل لـ PM2)

إذا أردت استخدام systemd بدلاً من PM2:

```bash
sudo nano /etc/systemd/system/portail-backend.service
```

```ini
[Unit]
Description=Portail SILA Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/portail-sila/backend
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable portail-backend
sudo systemctl start portail-backend
sudo systemctl status portail-backend
```

---

## 🔍 استكشاف الأخطاء

### 1. التطبيق لا يعمل

```bash
# تحقق من سجلات PM2
pm2 logs portail-backend

# تحقق من سجلات Nginx
sudo tail -f /var/log/nginx/error.log
```

### 2. خطأ في قاعدة البيانات

```bash
# تحقق من الاتصال
cd /var/www/portail-sila/backend
cat .env | grep DB_
```

### 3. خطأ 502 Bad Gateway

```bash
# تحقق من أن Backend يعمل
pm2 status
curl http://localhost:5000/api/health

# تحقق من إعدادات Nginx
sudo nginx -t
```

### 4. الموقع لا يفتح

```bash
# تحقق من حالة Nginx
sudo systemctl status nginx

# تحقق من Firewall
sudo ufw status
```

---

## 📋 Checklist النشر النهائي

- [ ] Node.js مثبت على VPS
- [ ] الكود مرفوع على VPS
- [ ] ملف `.env` في Backend معد بشكل صحيح
- [ ] ملف `.env.local` في Frontend معد بشكل صحيح
- [ ] Backend مبني (`npm run build`)
- [ ] Frontend مبني (`npm run build`)
- [ ] PM2 يدير Backend
- [ ] Nginx معد كـ Reverse Proxy
- [ ] SSL مثبت (HTTPS)
- [ ] Firewall معد
- [ ] عنوان IP مضاف في Remote MySQL
- [ ] قاعدة البيانات متصلة
- [ ] Domain يشير إلى VPS IP

---

## 🎯 الوصول إلى التطبيق

بعد إكمال جميع الخطوات:

- **الموقع:** https://tchadcare.com
- **API:** https://tchadcare.com/api
- **لوحة المسؤول:** https://tchadcare.com (ثم تسجيل الدخول)

---

## 📞 الدعم

إذا واجهت أي مشكلة:

1. تحقق من السجلات: `pm2 logs` و `sudo tail -f /var/log/nginx/error.log`
2. تأكد من أن جميع الخدمات تعمل: `pm2 status` و `sudo systemctl status nginx`
3. تحقق من الاتصال بقاعدة البيانات

---

**تاريخ الإنشاء:** 2025-11-26  
**الحالة:** جاهز للنشر 🚀
