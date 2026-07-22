#!/bin/bash
# สคริปต์นี้สำหรับรันอัปเดตระบบในครั้งต่อๆ ไป เมื่อมีการแก้ไขฟังก์ชันหรือดีไซน์ใหม่
set -e

# ไปที่โฟลเดอร์ของสคริปต์
cd "$(dirname "$0")"

echo "==========================================="
echo "   อัปเกรดระบบ ครัวพระคุณ ขึ้น Hostinger VPS   "
echo "==========================================="

# ดึง IP จากค่าที่บันทึกไว้ในครั้งแรก หรือถามใหม่หากไม่มี
CONFIG_FILE=".vps_config"
if [ -f "$CONFIG_FILE" ]; then
  source "$CONFIG_FILE"
fi

if [ -z "$VPS_IP" ]; then
  read -p "กรอก IP Address ของ Hostinger VPS: " VPS_IP
  echo "VPS_IP=\"$VPS_IP\"" > "$CONFIG_FILE"
fi

echo "🚀 อัปเดตไปยังเซิร์ฟเวอร์ IP: $VPS_IP"

# 1. บีบอัดไฟล์โครงการ (ข้ามไฟล์ไม่จำเป็น)
echo "📦 1. กำลังบีบอัดโค้ดเวอร์ชันล่าสุด..."
tar --exclude='.git' \
    --exclude='node_modules' \
    --exclude='project.tar.gz' \
    --exclude='deploy.sh' \
    --exclude='update.sh' \
    -czf project.tar.gz *

# 2. ส่งไฟล์ขึ้น VPS ไปทับในโฟลเดอร์เดิม
echo "📤 2. กำลังอัปโหลดไฟล์โค้ดล่าสุดไปยัง VPS..."
scp project.tar.gz root@$VPS_IP:/tmp/

# 3. สั่งแตกไฟล์ทับของเดิมและรีสตาร์ทบริการหลังบ้าน
echo "⚙️ 3. รีเฟรชโค้ดบน VPS และรีสตาร์ทบ็อตหลังบ้าน..."
ssh -t root@$VPS_IP "
  tar -xzf /tmp/project.tar.gz -C /var/www/kruaprakhun
  rm -f /tmp/project.tar.gz
  chown -R www-data:www-data /var/www/kruaprakhun
  
  # รีสตาร์ท PM2 เพื่อให้บ็อตแจ้งเตือนออเดอร์อ่านโค้ดใหม่
  if command -v pm2 &> /dev/null; then
    pm2 restart kruaprakhun-notify || true
  fi
  
  echo '✔️ อัปเกรดไฟล์หน้าบ้านและหลังบ้านสำเร็จ!'
"

# 4. ทำความสะอาดไฟล์ชั่วคราว
rm -f project.tar.gz

echo "==========================================="
echo "🟢 อัปเกรดฟีเจอร์ใหม่เรียบร้อยและออนไลน์แล้ว!"
echo "==========================================="
