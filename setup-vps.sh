#!/bin/bash

# ========================================
# سكريبت الإعداد الأولي لـ VPS
# تشغيل هذا السكريبت مرة واحدة فقط عند الإعداد الأول
# ========================================

set -e

echo "🚀 بدء إعداد VPS لـ Portail SILA..."

# الألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ========================================
# 1. تحديث النظام
# ========================================
echo -e "${BLUE}📦 تحديث النظام...${NC}"
sudo apt update && sudo apt upgrade -y

# ========================================
# 2. تثبيت Node.js 20.x LTS
# ========================================
echo -e "${BLUE}📦 تثبيت Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo -e "${GREEN}✅ Node.js $(node --version)${NC}"
echo -e "${GREEN}✅ npm $(npm --version)${NC}"

# ========================================
# 3. تثبيت Git
# ========================================
echo -e "${BLUE}📦 تثبيت Git...${NC}"
sudo apt install -y git

echo -e "${GREEN}✅ Git $(git --version)${NC}"

# ========================================
# 4. تثبيت PM2
# ========================================
echo -e "${BLUE}📦 تثبيت PM2...${NC}"
sudo npm install -g pm2

# إنشاء مجلد السجلات
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

echo -e "${GREEN}✅ PM2 $(pm2 --version)${NC}"

# ========================================
# 5. تثبيت Nginx
# ========================================
echo -e "${BLUE}📦 تثبيت Nginx...${NC}"
sudo apt install -y nginx

echo -e "${GREEN}✅ Nginx $(nginx -v 2>&1)${NC}"

# ========================================
# 6. تثبيت Certbot (SSL)
# ========================================
echo -e "${BLUE}📦 تثبيت Certbot...${NC}"
sudo apt install -y certbot python3-certbot-nginx

echo -e "${GREEN}✅ Certbot مثبت${NC}"

# ========================================
# 7. إعداد Firewall
# ========================================
echo -e "${BLUE}🔥 إعداد Firewall...${NC}"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo -e "${GREEN}✅ Firewall معد${NC}"

# ========================================
# 8. إنشاء مجلد المشروع
# ========================================
echo -e "${BLUE}📁 إنشاء مجلد المشروع...${NC}"
sudo mkdir -p /var/www/portail-sila
sudo chown -R $USER:$USER /var/www/portail-sila

# ========================================
# 9. إعداد PM2 Startup
# ========================================
echo -e "${BLUE}🔄 إعداد PM2 Startup...${NC}"
pm2 startup | tail -n 1 | sudo bash

# ========================================
# 10. عرض معلومات النظام
# ========================================
echo -e "${GREEN}✨ تم إعداد VPS بنجاح!${NC}"
echo ""
echo -e "${YELLOW}📊 معلومات النظام:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Node.js: $(node --version)"
echo -e "npm: $(npm --version)"
echo -e "Git: $(git --version)"
echo -e "PM2: $(pm2 --version)"
echo -e "Nginx: $(nginx -v 2>&1)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}📋 الخطوات التالية:${NC}"
echo "1. استنساخ المشروع من Git:"
echo "   cd /var/www"
echo "   git clone https://github.com/your-username/portail-sila.git"
echo ""
echo "2. إعداد Backend:"
echo "   cd /var/www/portail-sila/backend"
echo "   nano .env  # أضف متغيرات البيئة"
echo "   npm install"
echo "   npm run build"
echo "   pm2 start ecosystem.config.js"
echo ""
echo "3. إعداد Frontend:"
echo "   cd /var/www/portail-sila"
echo "   nano .env.local  # أضف متغيرات البيئة"
echo "   npm install"
echo "   npm run build"
echo ""
echo "4. إعداد Nginx:"
echo "   sudo cp /var/www/portail-sila/nginx.conf /etc/nginx/sites-available/tchadcare.com"
echo "   sudo ln -s /etc/nginx/sites-available/tchadcare.com /etc/nginx/sites-enabled/"
echo "   sudo nginx -t"
echo "   sudo systemctl restart nginx"
echo ""
echo "5. تثبيت SSL:"
echo "   sudo certbot --nginx -d tchadcare.com -d www.tchadcare.com"
echo ""
echo -e "${GREEN}🎉 جاهز للنشر!${NC}"
