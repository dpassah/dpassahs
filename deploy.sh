#!/bin/bash

# ========================================
# سكريبت النشر التلقائي على Hostinger VPS
# ========================================

set -e  # إيقاف عند أول خطأ

echo "🚀 بدء عملية النشر..."

# الألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# المتغيرات
PROJECT_DIR="/var/www/portail-sila"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR"

# ========================================
# 1. سحب آخر التحديثات
# ========================================
echo -e "${BLUE}📥 سحب آخر التحديثات من Git...${NC}"
cd $PROJECT_DIR
git pull origin main

# ========================================
# 2. تحديث Backend
# ========================================
echo -e "${BLUE}🔧 تحديث Backend...${NC}"
cd $BACKEND_DIR

# تثبيت Dependencies
echo "📦 تثبيت Dependencies..."
npm install --production

# بناء Backend
echo "🏗️ بناء Backend..."
npm run build

# إعادة تشغيل PM2
echo "🔄 إعادة تشغيل Backend..."
pm2 restart portail-backend || pm2 start dist/server.js --name portail-backend

# ========================================
# 3. تحديث Frontend
# ========================================
echo -e "${BLUE}🎨 تحديث Frontend...${NC}"
cd $FRONTEND_DIR

# تثبيت Dependencies
echo "📦 تثبيت Dependencies..."
npm install

# بناء Frontend
echo "🏗️ بناء Frontend..."
npm run build

# ========================================
# 4. إعادة تشغيل Nginx
# ========================================
echo -e "${BLUE}🌐 إعادة تشغيل Nginx...${NC}"
sudo systemctl restart nginx

# ========================================
# 5. التحقق من الحالة
# ========================================
echo -e "${BLUE}✅ التحقق من الحالة...${NC}"
pm2 status
sudo systemctl status nginx --no-pager

echo -e "${GREEN}✨ تم النشر بنجاح!${NC}"
echo -e "${GREEN}🌐 الموقع: https://tchadcare.com${NC}"
echo -e "${GREEN}📊 لوحة PM2: pm2 monit${NC}"
echo -e "${GREEN}📝 السجلات: pm2 logs portail-backend${NC}"
