#!/bin/bash
# สคริปต์นี้จะรันบนเซิร์ฟเวอร์ VPS (รันผ่าน SSH Pipe จากเครื่อง Mac)
set -e

echo "==========================================="
echo "   เริ่มขั้นตอนการตั้งค่าบน VPS (ครัวพระคุณ)   "
echo "==========================================="

# 1. อัปเดตและติดตั้ง Nginx
echo "1. กำลังติดตั้ง Nginx..."
apt-get update
apt-get install -y nginx

# 2. เตรียมโฟลเดอร์สำหรับเก็บไฟล์เว็บ
echo "2. เตรียมโฟลเดอร์เว็บไซต์..."
mkdir -p /var/www/kruaprakhun
tar -xzf /tmp/project.tar.gz -C /var/www/kruaprakhun
rm -f /tmp/project.tar.gz

# 3. กำหนดสิทธิ์การเข้าถึงไฟล์ให้ Nginx
chown -R www-data:www-data /var/www/kruaprakhun
chmod -R 755 /var/www/kruaprakhun

# 4. เขียนไฟล์ตั้งค่า Nginx Config (Server Block)
echo "4. กำลังสร้างไฟล์ Nginx Configuration..."
cat << 'EOF' > /etc/nginx/sites-available/kruaprakhun
server {
    listen 80;
    listen [::]:80;

    # แก้ไข domain ภายหลังได้ในไฟล์นี้
    server_name _;

    root /var/www/kruaprakhun;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;
    gzip_disable "MSIE [1-6]\.";

    error_log /var/log/nginx/kruaprakhun_error.log;
    access_log /var/log/nginx/kruaprakhun_access.log;
}
EOF

# 5. เปิดการทำงาน Nginx config
if [ ! -f /etc/nginx/sites-enabled/kruaprakhun ]; then
    ln -s /etc/nginx/sites-available/kruaprakhun /etc/nginx/sites-enabled/
fi

# ลบ default site ของ nginx ออกถ้ามี
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm -f /etc/nginx/sites-enabled/default
fi

# ทดสอบและรีสตาร์ท Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

# 6. ตรวจสอบการติดตั้ง Node.js และ PM2 เพื่อรันระบบแจ้งเตือนหลังบ้าน
echo "6. ตรวจสอบสภาพแวดล้อม Node.js..."
if ! command -v node &> /dev/null; then
    echo "กำลังติดตั้ง Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
    echo "กำลังติดตั้ง PM2..."
    npm install -g pm2
fi

# 7. รับค่า LINE Notify Token และเริ่มรันบริการ
echo "==========================================="
echo "กรุณากรอก LINE Notify Token (หรือกด Enter ข้ามไปก่อนเพื่อรันโหมดจำลอง):"
read -p "LINE Notify Token: " LINE_TOKEN

if [ -n "$LINE_TOKEN" ]; then
    echo "กำลังบันทึกและเริ่มรัน LINE Notify Proxy..."
    pm2 delete kruaprakhun-notify || true
    LINE_NOTIFY_TOKEN="$LINE_TOKEN" PORT=3000 pm2 start /var/www/kruaprakhun/notify-server.js --name "kruaprakhun-notify"
    pm2 save
    pm2 startup || true
    echo "LINE Notify Proxy รันเรียบร้อยแล้วบนพอร์ต 3000"
else
    echo "ข้ามการตั้งค่า LINE Notify Token (คุณสามารถรันด้วยตนเองภายหลังได้)"
fi

# 8. ถามความสมัครใจเรื่อง SSL (Let's Encrypt)
echo "==========================================="
read -p "คุณต้องการติดตั้ง SSL (HTTPS) ฟรีทันทีเลยหรือไม่? (y/n): " INSTALL_SSL
if [ "$INSTALL_SSL" = "y" ] || [ "$INSTALL_SSL" = "Y" ]; then
    read -p "กรอกชื่อโดเมนของคุณ (เช่น yourdomain.com): " MY_DOMAIN
    if [ -n "$MY_DOMAIN" ]; then
        echo "กำลังติดตั้ง Certbot..."
        apt-get install -y certbot python3-certbot-nginx
        
        # ปรับแก้ server_name ใน config ก่อนขอใบรับรอง
        sed -i "s/server_name _;/server_name $MY_DOMAIN www.$MY_DOMAIN;/g" /etc/nginx/sites-available/kruaprakhun
        nginx -t
        systemctl restart nginx

        echo "กำลังขอใบรับรอง SSL สำหรับ $MY_DOMAIN..."
        certbot --nginx -d "$MY_DOMAIN" -d "www.$MY_DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email
        echo "ติดตั้ง SSL สำเร็จแล้ว!"
    else
        echo "โดเมนว่างเปล่า ยกเลิกการติดตั้ง SSL"
    fi
fi

echo "==========================================="
echo "🎉 ติดตั้งแอปพลิเคชันครัวพระคุณบน VPS สำเร็จแล้ว!"
echo "==========================================="
