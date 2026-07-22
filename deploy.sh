#!/bin/bash
# สคริปต์นี้จะรันบนเครื่อง Mac ของผู้ใช้เพื่อทำการอัปโหลดและติดตั้งบน VPS อัตโนมัติ
set -e

# ไปที่โฟลเดอร์ของสคริปต์
cd "$(dirname "$0")"

echo "==========================================="
echo "   สคริปต์ช่วยติดตั้ง ครัวพระคุณ ขึ้น Hostinger VPS   "
echo "==========================================="

# รับค่า IP ของ VPS
read -p "กรอก IP Address ของ Hostinger VPS: " VPS_IP

if [ -z "$VPS_IP" ]; then
  echo "⚠️ ข้อผิดพลาด: ไม่พบ IP Address ของ VPS"
  exit 1
fi

# บันทึก IP Address ไว้สำหรับอัพเกรดในครั้งถัดไป
echo "VPS_IP=\"$VPS_IP\"" > .vps_config


# 1. บีบอัดไฟล์โครงการ (ข้ามไฟล์ไม่จำเป็น)
echo "1. กำลังบีบอัดไฟล์โครงการ..."
tar --exclude='.git' \
    --exclude='node_modules' \
    --exclude='project.tar.gz' \
    --exclude='deploy.sh' \
    -czf project.tar.gz *

# 2. ส่งไฟล์ขึ้น VPS ผ่าน SCP
echo "2. กำลังอัปโหลดไฟล์โครงการไปยัง VPS (กรุณากรอกรหัสผ่าน root ของ VPS เมื่อระบบถาม)..."
scp project.tar.gz remote_setup.sh root@$VPS_IP:/tmp/

# 3. สั่งรันสคริปต์ตั้งค่าบนเซิร์ฟเวอร์แบบอัตโนมัติ
echo "3. เชื่อมต่อ SSH เข้าไปยัง VPS เพื่อเริ่มทำการตั้งค่าระบบ..."
ssh -t root@$VPS_IP "bash /tmp/remote_setup.sh"

# 4. ทำความสะอาดไฟล์ชั่วคราว
echo "4. ลบไฟล์ชั่วคราวบนเครื่อง..."
rm -f project.tar.gz

echo "==========================================="
echo "🟢 การดำเนินการเสร็จสิ้น!"
echo "==========================================="
