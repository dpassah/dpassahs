# 📋 بنية مشروع Portail HUMANITAIRES - SILA

## 📌 نظرة عامة على المشروع

**اسم المشروع:** Portail Délégation SILA  
**النوع:** تطبيق ويب لإدارة المشاريع الإنسانية  
**التقنيات الرئيسية:** React + TypeScript + Node.js + Express + MySQL

---

## 🏗️ الهيكل العام للمشروع

```
d:\portail\
├── 📁 backend/              # خادم API (Backend)
├── 📁 components/           # مكونات React (Frontend)
├── 📁 services/             # خدمات API للواجهة الأمامية
├── 📁 dist/                 # ملفات البناء (Build)
├── 📁 node_modules/         # مكتبات Node.js
├── 📄 App.tsx               # المكون الرئيسي للتطبيق
├── 📄 index.tsx             # نقطة الدخول للتطبيق
├── 📄 index.html            # صفحة HTML الرئيسية
├── 📄 types.ts              # تعريفات الأنواع TypeScript
├── 📄 package.json          # تبعيات Frontend
├── 📄 tsconfig.json         # إعدادات TypeScript
├── 📄 vite.config.ts        # إعدادات Vite
├── 📄 .env.local            # متغيرات البيئة للواجهة الأمامية
├── 📄 .gitignore            # ملفات مستبعدة من Git
├── 📄 README.md             # دليل المشروع
└── 📄 run.sh                # سكريبت تشغيل سريع
```

---

## 🎨 الواجهة الأمامية (Frontend)

### 🛠️ التقنيات المستخدمة

| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| **React** | 19.2.0 | مكتبة بناء واجهة المستخدم |
| **TypeScript** | 5.8.2 | لغة البرمجة |
| **Vite** | 6.2.0 | أداة البناء والتطوير |
| **Lucide React** | 0.554.0 | أيقونات واجهة المستخدم |
| **React DOM** | 19.2.0 | عرض React في المتصفح |

### 📦 الحزم المثبتة (Frontend)

#### Dependencies (الاعتماديات الرئيسية)
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "lucide-react": "^0.554.0",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.19.2",
  "mysql2": "^3.10.0"
}
```

#### DevDependencies (أدوات التطوير)
```json
{
  "@vitejs/plugin-react": "^5.0.0",
  "@types/node": "^22.14.0",
  "@types/cors": "^2.8.17",
  "@types/express": "^4.17.21",
  "typescript": "~5.8.2",
  "vite": "^6.2.0"
}
```

### 📁 مكونات React (Components)

| المكون | الوصف | الحجم |
|--------|-------|------|
| **Home.tsx** | الصفحة الرئيسية | 35 KB |
| **AdminPanel.tsx** | لوحة تحكم المسؤول | 72 KB |
| **Dashboard.tsx** | لوحة تحكم المنظمات | 33 KB |
| **ProjectsPage.tsx** | صفحة عرض المشاريع | 35 KB |
| **ProjectManagerDashboard.tsx** | لوحة تحكم مدير المشروع | 51 KB |
| **ProjectForm.tsx** | نموذج إضافة مشروع | 21 KB |
| **ProjectTable.tsx** | جدول عرض المشاريع | 18 KB |
| **StatsPage.tsx** | صفحة الإحصائيات | 14 KB |
| **Register.tsx** | صفحة التسجيل | 11 KB |
| **PublicLayout.tsx** | تخطيط الصفحات العامة | 11 KB |
| **ContactPage.tsx** | صفحة الاتصال | 7 KB |
| **PartnersPage.tsx** | صفحة الشركاء | 6 KB |
| **AdminLogin.tsx** | تسجيل دخول المسؤول | 6 KB |
| **ProjectManagerLogin.tsx** | تسجيل دخول مدير المشروع | 4 KB |
| **AboutPage.tsx** | صفحة من نحن | 4 KB |
| **ProjectManagerPanelPage.tsx** | صفحة لوحة مدير المشروع | 1 KB |
| **OrganisationDashboardPage.tsx** | صفحة لوحة المنظمة | 1 KB |

### ⚙️ إعدادات Vite

```typescript
// vite.config.ts
{
  server: {
    port: 3000,              // المنفذ: 3000
    host: '0.0.0.0'          // السماح بالوصول من الشبكة
  },
  plugins: [react()],
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
  }
}
```

### 🔧 إعدادات TypeScript

```json
{
  "target": "ES2022",
  "module": "ESNext",
  "jsx": "react-jsx",
  "moduleResolution": "bundler",
  "paths": {
    "@/*": ["./*"]
  }
}
```

---

## 🖥️ الخادم الخلفي (Backend)

### 📂 هيكل Backend

```
backend/
├── 📁 src/
│   ├── 📄 server.ts         # خادم Express الرئيسي (40 KB)
│   ├── 📄 db.ts             # إدارة قاعدة البيانات (30 KB)
│   ├── 📄 types.ts          # تعريفات الأنواع (2 KB)
│   ├── 📄 storage.ts        # إدارة التخزين (1 KB)
│   ├── 📁 middleware/       # Middleware للمصادقة
│   └── 📁 generated/        # ملفات مولدة تلقائياً
├── 📁 prisma/               # إعدادات Prisma ORM
├── 📁 data/                 # بيانات مخزنة محلياً
├── 📁 dist/                 # ملفات JavaScript المترجمة
├── 📄 package.json          # تبعيات Backend
├── 📄 tsconfig.json         # إعدادات TypeScript
├── 📄 .env                  # متغيرات البيئة
├── 📄 check-orgs.ts         # سكريبت فحص المنظمات
├── 📄 reset-admin.ts        # سكريبت إعادة تعيين المسؤول
└── 📄 test-db-connection.ts # سكريبت اختبار الاتصال بقاعدة البيانات
```

### 🛠️ التقنيات المستخدمة (Backend)

| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| **Node.js** | - | بيئة التشغيل |
| **Express** | 4.18.2 | إطار عمل الخادم |
| **TypeScript** | 5.0.3 | لغة البرمجة |
| **MySQL2** | 2.3.3 | قاعدة البيانات |
| **Prisma** | 7.0.0 | ORM لقاعدة البيانات |
| **JWT** | 9.0.2 | المصادقة والتوكنات |
| **Bcrypt** | 3.0.3 | تشفير كلمات المرور |
| **Nodemailer** | 6.9.16 | إرسال البريد الإلكتروني |
| **CORS** | 2.8.5 | إدارة الوصول عبر النطاقات |

### 📦 الحزم المثبتة (Backend)

#### Dependencies (الاعتماديات الرئيسية)
```json
{
  "@prisma/client": "^7.0.0",
  "bcryptjs": "^3.0.3",
  "cors": "^2.8.5",
  "dotenv": "^16.0.3",
  "express": "^4.18.2",
  "jsonwebtoken": "^9.0.2",
  "mysql2": "^2.3.3",
  "nodemailer": "^6.9.16"
}
```

#### DevDependencies (أدوات التطوير)
```json
{
  "@types/bcryptjs": "^2.4.6",
  "@types/cors": "^2.8.13",
  "@types/express": "^4.17.17",
  "@types/jsonwebtoken": "^9.0.10",
  "@types/node": "^18.15.11",
  "@types/nodemailer": "^6.4.15",
  "nodemon": "^2.0.22",
  "prisma": "^7.0.0",
  "ts-node": "^10.9.1",
  "typescript": "^5.0.3"
}
```

### 🗄️ قاعدة البيانات MySQL

#### الجداول الرئيسية

1. **orgs** - جدول المنظمات
   ```sql
   - org_id (VARCHAR 64) - معرف المنظمة
   - org_name (VARCHAR 255) - اسم المنظمة
   - org_name_full (VARCHAR 255) - الاسم الكامل
   - org_type (VARCHAR 128) - نوع المنظمة
   - contact_name (VARCHAR 255) - اسم جهة الاتصال
   - contact_email (VARCHAR 255) - البريد الإلكتروني
   - contact_phone (VARCHAR 64) - رقم الهاتف
   - org_password_hash (VARCHAR 255) - كلمة المرور المشفرة
   - created_at (BIGINT) - تاريخ الإنشاء
   - is_activated (TINYINT) - حالة التفعيل
   ```

2. **projects** - جدول المشاريع
   ```sql
   - id (VARCHAR 64) - معرف المشروع
   - org_id (VARCHAR 64) - معرف المنظمة
   - bailleur (VARCHAR 255) - الممول
   - start_date (DATE) - تاريخ البدء
   - end_date (DATE) - تاريخ الانتهاء
   - type (VARCHAR 64) - نوع المشروع
   - sector (VARCHAR 128) - القطاع
   - location (TEXT) - الموقع
   - project_name (VARCHAR 255) - اسم المشروع
   - project_description (TEXT) - وصف المشروع
   - beneficiaries_type (VARCHAR 255) - نوع المستفيدين
   - beneficiaries_planned (INT) - عدد المستفيدين المخطط
   - activities_planned (INT) - عدد الأنشطة المخططة
   - project_manager_name (VARCHAR 255) - اسم مدير المشروع
   - project_manager_phone (VARCHAR 64) - هاتف مدير المشروع
   - project_manager_email (VARCHAR 255) - بريد مدير المشروع
   - created_at (BIGINT) - تاريخ الإنشاء
   ```

3. **project_activities** - جدول أنشطة المشاريع
   ```sql
   - id (VARCHAR 64) - معرف النشاط
   - project_id (VARCHAR 64) - معرف المشروع
   - org_id (VARCHAR 64) - معرف المنظمة
   - title (VARCHAR 255) - عنوان النشاط
   - date (DATE) - تاريخ النشاط
   - location (VARCHAR 255) - الموقع
   - status (VARCHAR 64) - الحالة
   - description (TEXT) - الوصف
   - beneficiaries_count (INT) - عدد المستفيدين
   - created_at (BIGINT) - تاريخ الإنشاء
   - image_url (VARCHAR 255) - رابط الصورة
   ```

4. **admins** - جدول المسؤولين
   ```sql
   - id (INT AUTO_INCREMENT) - المعرف
   - username (VARCHAR 64) - اسم المستخدم
   - password_hash (VARCHAR 255) - كلمة المرور المشفرة
   - created_at (BIGINT) - تاريخ الإنشاء
   ```

5. **delegation_events** - جدول فعاليات الوفد
   ```sql
   - id (VARCHAR 64) - المعرف
   - title (VARCHAR 255) - العنوان
   - date (DATE) - التاريخ
   - location (VARCHAR 255) - الموقع
   - description (TEXT) - الوصف
   - created_at (BIGINT) - تاريخ الإنشاء
   ```

6. **province_stats** - إحصائيات المحافظة
   ```sql
   - id (VARCHAR 64) - المعرف
   - month (VARCHAR 2) - الشهر
   - year (INT) - السنة
   - total_refugees (INT) - إجمالي اللاجئين
   - new_refugees (INT) - اللاجئون الجدد
   - total_returnees (INT) - إجمالي العائدين
   - new_returnees (INT) - العائدون الجدد
   - created_at (BIGINT) - تاريخ الإنشاء
   ```

7. **province_structural_stats** - الإحصائيات الهيكلية
   ```sql
   - id (VARCHAR 64) - المعرف
   - population_total (INT) - إجمالي السكان
   - disabled_total (INT) - إجمالي ذوي الإعاقة
   - flood_affected (INT) - المتضررون من الفيضانات
   - fire_affected (INT) - المتضررون من الحرائق
   - very_vulnerable (INT) - الفئات شديدة الضعف
   - updated_at (BIGINT) - تاريخ التحديث
   ```

8. **project_update_requests** - طلبات تحديث المشاريع
   ```sql
   - id (VARCHAR 64) - المعرف
   - orgId (VARCHAR 64) - معرف المنظمة
   - projectId (VARCHAR 64) - معرف المشروع
   - payload (JSON) - بيانات التحديث
   - status (VARCHAR 16) - الحالة
   - created_at (BIGINT) - تاريخ الإنشاء
   - decided_at (BIGINT) - تاريخ القرار
   ```

---

## 🔐 المصادقة والأمان

### أنواع المستخدمين

1. **المسؤول (Admin)**
   - اسم المستخدم الافتراضي: `DPASSAHS`
   - كلمة المرور الافتراضية: `DPASSAHS@2025`
   - الصلاحيات: إدارة كاملة للنظام

2. **المنظمات (Organizations)**
   - تسجيل الدخول باسم المنظمة + معرف فريد
   - إدارة المشاريع الخاصة بالمنظمة

3. **مديرو المشاريع (Project Managers)**
   - تسجيل الدخول بمعرف المشروع + كلمة المرور
   - إدارة نشاط مشروع محدد

### التشفير
- **Bcrypt** لتشفير كلمات المرور (10 rounds)
- **JWT** للتوكنات والجلسات

---

## 📡 API Endpoints

### المصادقة
- `POST /api/admin/login` - تسجيل دخول المسؤول
- `POST /api/login` - تسجيل دخول المنظمة
- `POST /api/register` - تسجيل منظمة جديدة
- `POST /api/project-manager/login` - تسجيل دخول مدير المشروع

### المنظمات
- `GET /api/orgs` - جلب جميع المنظمات
- `GET /api/orgs/:id` - جلب منظمة محددة
- `PUT /api/orgs/:id` - تحديث منظمة
- `POST /api/orgs/:id/disable` - تعطيل منظمة
- `POST /api/orgs/:id/enable` - تفعيل منظمة

### المشاريع
- `GET /api/projects` - جلب جميع المشاريع
- `GET /api/projects/:id` - جلب مشروع محدد
- `POST /api/projects` - إضافة مشروع جديد
- `PUT /api/projects/:id` - تحديث مشروع
- `DELETE /api/projects/:id` - حذف مشروع
- `GET /api/admin/projects` - جلب المشاريع مع الترقيم

### الأنشطة
- `GET /api/activities/:projectId` - جلب أنشطة مشروع
- `POST /api/activities` - إضافة نشاط جديد
- `GET /api/admin/activities` - جلب جميع الأنشطة

### الإحصائيات
- `GET /api/stats/province` - إحصائيات المحافظة
- `POST /api/stats/province` - إضافة إحصائيات
- `GET /api/stats/structural` - الإحصائيات الهيكلية
- `POST /api/stats/structural` - تحديث الإحصائيات الهيكلية

### الفعاليات
- `GET /api/delegation-events` - جلب فعاليات الوفد
- `POST /api/delegation-events` - إضافة فعالية جديدة

---

## 🌐 متغيرات البيئة

### Frontend (.env.local)
```env
GEMINI_API_KEY=your_gemini_api_key_here
VITE_API_BASE_URL=http://localhost:5000
```

### Backend (.env)
```env
# Server
PORT=5000
ALLOWED_ORIGINS=http://localhost:3000

# Database
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_CONNECTION_LIMIT=10

# Email (SMTP)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_SECURE=false
SMTP_FROM="Portail HUMANITAIRES <no-reply@domain>"

# Admin
ADMIN_DEFAULT_PASS=DPASSAHS@2025

# JWT
JWT_SECRET=your-jwt-secret-key
```

---

## 🚀 كيفية التشغيل

### 1. تشغيل Backend
```bash
cd backend
npm install
npm run dev        # وضع التطوير
# أو
npm run build      # بناء للإنتاج
npm start          # تشغيل الإنتاج
```

### 2. تشغيل Frontend
```bash
npm install
npm run dev        # وضع التطوير (المنفذ 3000)
# أو
npm run build      # بناء للإنتاج
npm run preview    # معاينة البناء
```

### 3. تشغيل كلاهما معاً
```bash
# في Terminal 1
cd backend && npm run dev

# في Terminal 2
npm run dev
```

---

## 📊 إحصائيات المشروع

### حجم الملفات
- **Frontend Components:** ~260 KB
- **Backend Code:** ~70 KB
- **إجمالي المكونات:** 17 مكون React
- **إجمالي الجداول:** 8 جداول MySQL

### المنافذ المستخدمة
- **Frontend:** 3000 (Vite Dev Server)
- **Backend:** 5000 (Express API)
- **Database:** 3306 (MySQL)

---

## 🔧 أدوات التطوير

### Frontend
- **Vite** - أداة بناء سريعة
- **TypeScript** - للكتابة الآمنة
- **React DevTools** - للتطوير

### Backend
- **Nodemon** - إعادة التشغيل التلقائي
- **ts-node** - تشغيل TypeScript مباشرة
- **Prisma Studio** - واجهة قاعدة البيانات

### Scripts مفيدة
```bash
# Backend
npm run dev          # تشغيل مع المراقبة
npm run build        # ترجمة TypeScript
npm start            # تشغيل الإنتاج

# Frontend
npm run dev          # تشغيل Vite
npm run build        # بناء للإنتاج
npm run preview      # معاينة البناء
```

---

## 📝 ملاحظات مهمة

### مشاكل شائعة وحلولها

#### 1. خطأ الاتصال بقاعدة البيانات
```
Error: Access denied for user
```
**الحل:** تأكد من إضافة عنوان IP في لوحة تحكم الاستضافة (Remote MySQL)

#### 2. خطأ المنفذ مستخدم
```
Error: EADDRINUSE: address already in use :::5000
```
**الحل:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <process_id> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

#### 3. خطأ CORS
```
Access to fetch blocked by CORS policy
```
**الحل:** تأكد من إضافة عنوان Frontend في `ALLOWED_ORIGINS`

---

## 📚 الموارد والمراجع

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Express Documentation](https://expressjs.com)
- [MySQL2 Documentation](https://github.com/sidorares/node-mysql2)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

---

## 👥 الأدوار والصلاحيات

| الدور | الصلاحيات |
|-------|-----------|
| **Admin** | إدارة كاملة، عرض جميع المشاريع، إدارة المنظمات، الإحصائيات |
| **Organization** | إضافة/تعديل المشاريع الخاصة، إدارة الأنشطة |
| **Project Manager** | إدارة نشاط مشروع محدد فقط |

---

## 🎯 الميزات الرئيسية

✅ إدارة المنظمات والمشاريع  
✅ نظام مصادقة متعدد المستويات  
✅ لوحات تحكم تفاعلية  
✅ إحصائيات وتقارير  
✅ إدارة الأنشطة والفعاليات  
✅ نظام إرسال البريد الإلكتروني  
✅ واجهة مستخدم عصرية وسريعة الاستجابة  
✅ قاعدة بيانات MySQL آمنة  

---

**تاريخ الإنشاء:** 2025-11-25  
**الإصدار:** 0.0.0  
**الحالة:** قيد التطوير النشط 🚧
