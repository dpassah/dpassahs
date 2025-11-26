# 🚀 دليل البدء السريع - نشر على Hostinger VPS

## ✅ قبل البدء - تحضير المعلومات

اجمع المعلومات التالية من لوحة Hostinger:

### 1. معلومات VPS
- [ ] عنوان IP: `___________________`
- [ ] كلمة مرور Root: `___________________`
- [ ] اسم المستخدم: `root` أو `___________________`

### 2. معلومات قاعدة البيانات
من: https://hpanel.hostinger.com/websites/tchadcare.com/databases

- [ ] DB_HOST: `___________________`
- [ ] DB_USER: `u557748645_yami`
- [ ] DB_PASSWORD: `___________________`
- [ ] DB_NAME: `___________________`

### 3. معلومات البريد الإلكتروني (SMTP)
- [ ] SMTP_HOST: `smtp.hostinger.com`
- [ ] SMTP_USER: `___________________@tchadcare.com`
- [ ] SMTP_PASS: `___________________`

### 4. API Keys
- [ ] GEMINI_API_KEY: احصل عليه من https://aistudio.google.com/app/apikey

---

## 📋 خطوات النشر (خطوة بخطوة)

### الخطوة 1️⃣: رفع الكود على GitHub

```bash
# على جهازك (Windows PowerShell)
cd d:\portail

# إنشاء repository على GitHub أولاً من:
# https://github.com/new

# ثم:
git init
git add .
git commit -m "Initial commit - Portail SILA"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/portail-sila.git
git push -u origin main
```

---

### الخطوة 2️⃣: الاتصال بـ VPS

```bash
# من PowerShell على جهازك
ssh root@YOUR-VPS-IP

# أدخل كلمة المرور عندما يُطلب منك
```

---

### الخطوة 3️⃣: تشغيل سكريبت الإعداد الأولي

```bash
# على VPS
cd ~
wget https://raw.githubusercontent.com/YOUR-USERNAME/portail-sila/main/setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh
```

**أو يدوياً:**

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# تثبيت الأدوات الأخرى
sudo apt install -y git nginx
sudo npm install -g pm2

# Certbot للـ SSL
sudo apt install -y certbot python3-certbot-nginx

# Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

---

### الخطوة 4️⃣: استنساخ المشروع

```bash
# على VPS
cd /var/www
sudo git clone https://github.com/YOUR-USERNAME/portail-sila.git
sudo chown -R $USER:$USER portail-sila
cd portail-sila
```

---

### الخطوة 5️⃣: إعداد Backend

```bash
cd /var/www/portail-sila/backend

# إنشاء ملف .env
nano .env
```

**انسخ والصق هذا المحتوى (مع تعديل القيم):**

```env
PORT=5000
NODE_ENV=production
ALLOWED_ORIGINS=https://tchadcare.com,http://tchadcare.com

DB_HOST=your-mysql-hostname
DB_PORT=3306
DB_USER=u557748645_yami
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_CONNECTION_LIMIT=10

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=noreply@tchadcare.com
SMTP_PASS=your-email-password
SMTP_SECURE=false
SMTP_FROM="Portail HUMANITAIRES <no-reply@tchadcare.com>"

ADMIN_DEFAULT_PASS=DPASSAHS@2025
JWT_SECRET=change-this-to-very-long-random-secret-min-32-chars
```

**احفظ:** `Ctrl+X` ثم `Y` ثم `Enter`

```bash
# تثبيت وبناء
npm install
npm run build

# تشغيل مع PM2
pm2 start dist/server.js --name portail-backend
pm2 save
```

---

### الخطوة 6️⃣: إعداد Frontend

```bash
cd /var/www/portail-sila

# إنشاء ملف .env.local
nano .env.local
```

**انسخ والصق:**

```env
GEMINI_API_KEY=your-gemini-api-key
VITE_API_BASE_URL=https://tchadcare.com/api
```

**احفظ:** `Ctrl+X` ثم `Y` ثم `Enter`

```bash
# تثبيت وبناء
npm install
npm run build
```

---

### الخطوة 7️⃣: إعداد Nginx

```bash
# نسخ ملف الإعدادات
sudo cp /var/www/portail-sila/nginx.conf /etc/nginx/sites-available/tchadcare.com

# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/tchadcare.com /etc/nginx/sites-enabled/

# حذف الموقع الافتراضي
sudo rm /etc/nginx/sites-enabled/default

# اختبار الإعدادات
sudo nginx -t

# إعادة تشغيل Nginx
sudo systemctl restart nginx
```

---

### الخطوة 8️⃣: إضافة IP في Remote MySQL

1. اذهب إلى: https://hpanel.hostinger.com/websites/tchadcare.com/databases/remote-my-sql
2. احصل على IP الخاص بـ VPS:
   ```bash
   curl ifconfig.me
   ```
3. أضف هذا الـ IP في Remote MySQL
4. أو أضف `%` للسماح من أي مكان (للتطوير)

---

### الخطوة 9️⃣: تثبيت SSL (HTTPS)

```bash
# على VPS
sudo certbot --nginx -d tchadcare.com -d www.tchadcare.com

# اتبع التعليمات:
# - أدخل بريدك الإلكتروني
# - اقبل الشروط (Y)
# - اختر إعادة التوجيه إلى HTTPS (2)
```

---

### الخطوة 🔟: التحقق من كل شيء

```bash
# حالة PM2
pm2 status
pm2 logs portail-backend

# حالة Nginx
sudo systemctl status nginx

# اختبار قاعدة البيانات
cd /var/www/portail-sila/backend
node -e "require('./dist/db').initDB().then(() => console.log('✅ DB OK')).catch(console.error)"
```

---

## 🎉 تم! افتح الموقع

افتح المتصفح واذهب إلى:
- **https://tchadcare.com**

### تسجيل الدخول كمسؤول:
- اسم المستخدم: `DPASSAHS`
- كلمة المرور: `DPASSAHS@2025`

---

## 🔄 تحديث التطبيق لاحقاً

عند إجراء تعديلات على الكود:

```bash
# على جهازك
cd d:\portail
git add .
git commit -m "وصف التحديث"
git push origin main

# على VPS
cd /var/www/portail-sila
chmod +x deploy.sh
./deploy.sh
```

---

## 🆘 استكشاف الأخطاء

### Backend لا يعمل
```bash
pm2 logs portail-backend
pm2 restart portail-backend
```

### خطأ قاعدة البيانات
```bash
# تحقق من .env
cat /var/www/portail-sila/backend/.env | grep DB_

# تحقق من Remote MySQL في Hostinger
```

### خطأ 502 Bad Gateway
```bash
# تحقق من Backend
pm2 status
curl http://localhost:5000/api/health

# تحقق من Nginx
sudo nginx -t
sudo systemctl restart nginx
```

### الموقع لا يفتح
```bash
# تحقق من Nginx
sudo systemctl status nginx

# تحقق من Firewall
sudo ufw status

# تحقق من DNS
ping tchadcare.com
```

---

## 📞 أوامر مفيدة

```bash
# PM2
pm2 status              # حالة التطبيقات
pm2 logs                # جميع السجلات
pm2 logs portail-backend  # سجلات Backend
pm2 monit               # مراقبة الموارد
pm2 restart all         # إعادة تشغيل الكل
pm2 stop all            # إيقاف الكل

# Nginx
sudo systemctl status nginx    # الحالة
sudo systemctl restart nginx   # إعادة تشغيل
sudo nginx -t                  # اختبار الإعدادات
sudo tail -f /var/log/nginx/error.log  # السجلات

# النظام
htop                    # مراقبة الموارد
df -h                   # مساحة القرص
free -m                 # الذاكرة
```

---

## ✅ Checklist النهائي

- [ ] VPS معد ومحدث
- [ ] Node.js, Git, PM2, Nginx مثبتة
- [ ] الكود مرفوع على GitHub
- [ ] المشروع مستنسخ على VPS
- [ ] ملف `.env` في Backend معد
- [ ] ملف `.env.local` في Frontend معد
- [ ] Backend مبني ويعمل مع PM2
- [ ] Frontend مبني
- [ ] Nginx معد ويعمل
- [ ] IP مضاف في Remote MySQL
- [ ] قاعدة البيانات متصلة
- [ ] SSL مثبت (HTTPS)
- [ ] الموقع يعمل على https://tchadcare.com
- [ ] تسجيل الدخول كمسؤول يعمل

---

**🎯 وقت التنفيذ المتوقع:** 30-45 دقيقة

**📚 للمزيد من التفاصيل:** راجع `DEPLOYMENT_GUIDE.md`
