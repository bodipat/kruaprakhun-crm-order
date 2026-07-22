# คู่มือการติดตั้งระบบสั่งอาหาร Krua Prakhun บน Hostinger VPS

แอปพลิเคชันนี้พัฒนาขึ้นโดยใช้เทคโนโลยี **Client-side HTML/CSS/JavaScript (Jamstack)** ซึ่งทำงานได้อย่างรวดเร็วและใช้หน่วยความจำน้อยมาก การติดตั้งบน VPS ของ Hostinger จึงสามารถทำได้ง่ายและเสถียรที่สุดด้วยการใช้ **Nginx** เป็น Web Server

---

## 📋 สิ่งที่ต้องเตรียมการล่วงหน้า
1. **Hostinger VPS** ที่ติดตั้งระบบปฏิบัติการ Linux (แนะนำเป็น **Ubuntu 20.04 LTS** หรือ **22.04 LTS**)
2. **ชื่อโดเมน (Domain Name)** ที่ชี้ IP Address (A Record) มายัง IP ของ VPS เครื่องนี้แล้ว (เช่น `kruaprakhun.com` หรือ `order.kruaprakhun.com`)
3. สิทธิ์การเข้าใช้งาน VPS ผ่าน **SSH** (ใช้โปรแกรม Terminal บน macOS/Linux หรือ PuTTY บน Windows)

---

## 🛠️ ขั้นตอนการติดตั้งทีละขั้นตอน

### ขั้นตอนที่ 1: เชื่อมต่อเข้าสู่ VPS ผ่าน SSH
เปิด Terminal บนเครื่องคอมพิวเตอร์ของคุณแล้วรันคำสั่งเชื่อมต่อ (แทนที่ `your_vps_ip` ด้วย IP VPS จริงของคุณ):
```bash
ssh root@your_vps_ip
```
*(ใส่รหัสผ่าน root ที่คุณตั้งไว้ในระบบ Hostinger Panel)*

---

### ขั้นตอนที่ 2: ติดตั้ง Nginx Web Server
เมื่อล็อกอินเข้าไปเรียบร้อยแล้ว ให้ทำการอัปเดตระบบและติดตั้ง Nginx:
```bash
sudo apt update
sudo apt install nginx -y
```

เปิดการทำงานและตรวจสอบสถานะของ Nginx:
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

---

### ขั้นตอนที่ 3: อัพโหลดไฟล์เว็บไซต์ขึ้นไปยัง VPS

มี 2 วิธีหลักในการนำไฟล์ขึ้นเครื่อง VPS:

#### วิธีที่ A: ใช้ Git (แนะนำ)
1. ติดตั้ง Git บน VPS:
   ```bash
   sudo apt install git -y
   ```
2. ดึงโค้ดลงมายังโฟลเดอร์เก็บเว็บ:
   ```bash
   sudo mkdir -p /var/www/kruaprakhun
   sudo git clone <ลิงก์_git_repository_ของคุณ> /var/www/kruaprakhun
   ```

#### วิธีที่ B: อัพโหลดผ่าน SFTP / SCP (จากเครื่องตัวเอง)
เปิด Terminal บนเครื่องคอมพิวเตอร์ของตนเอง (ไม่ใช่ใน VPS) และใช้คำสั่งส่งไฟล์โครงการขึ้นไป (ตรวจสอบว่ารันในโฟลเดอร์โครงการ):
```bash
# บีบอัดไฟล์ในเครื่องก่อน
tar -czf project.tar.gz *

# ส่งไฟล์บีบอัดไปยัง VPS
scp project.tar.gz root@your_vps_ip:/tmp

# กลับมาที่ VPS SSH เพื่อแตกไฟล์
ssh root@your_vps_ip
sudo mkdir -p /var/www/kruaprakhun
sudo tar -xzf /tmp/project.tar.gz -C /var/www/kruaprakhun
sudo rm /tmp/project.tar.gz
```

---

### ขั้นตอนที่ 4: ตั้งค่าสิทธิ์โฟลเดอร์ (Permissions)
กำหนดสิทธิ์ให้ Nginx สามารถอ่านไฟล์เว็บได้ถูกต้อง:
```bash
sudo chown -R www-data:www-data /var/www/kruaprakhun
sudo chmod -R 755 /var/www/kruaprakhun
```

---

### ขั้นตอนที่ 5: ตั้งค่า Nginx Server Block (Config)
สร้างไฟล์การตั้งค่าไซต์สำหรับร้านครัวพระคุณ:
```bash
sudo nano /etc/nginx/sites-available/kruaprakhun
```

วางโค้ดตั้งค่าด้านล่างนี้ลงไป (แทนที่ `yourdomain.com` ด้วยโดเมนจริงของคุณ):
```nginx
server {
    listen 80;
    listen [::]:80;

    server_name yourdomain.com www.yourdomain.com;

    root /var/www/kruaprakhun;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # เปิดการบีบอัดไฟล์เพื่อความเร็วสูงสุดในการโหลดหน้าจอ
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;
    gzip_disable "MSIE [1-6]\.";

    error_log /var/log/nginx/kruaprakhun_error.log;
    access_log /var/log/nginx/kruaprakhun_access.log;
}
```
*กด `Ctrl+O` แล้ว `Enter` เพื่อบันทึก และ `Ctrl+X` เพื่อปิดโปรแกรมแก้ไข*

เปิดใช้งานการตั้งค่านี้โดยการทำ Symbolic Link:
```bash
sudo ln -s /etc/nginx/sites-available/kruaprakhun /etc/nginx/sites-enabled/
```

ตรวจสอบความถูกต้องของ Syntax ของ Nginx:
```bash
sudo nginx -t
```
*(ถ้าขึ้นว่า `syntax is ok` และ `test is successful` แสดงว่าถูกต้อง)*

รีสตาร์ท Nginx เพื่อปรับปรุงการทำงาน:
```bash
sudo systemctl restart nginx
```

---

### ขั้นตอนที่ 6: ติดตั้งระบบความปลอดภัย SSL (HTTPS ฟรีจาก Let's Encrypt)
เนื่องจากระบบสั่งอาหารมีการชำระเงินและเก็บข้อมูลลูกค้าผ่านระบบ CRM จึงควรใช้งานผ่าน HTTPS เพื่อความปลอดภัย:

1. ติดตั้ง Certbot และปลั๊กอินสำหรับ Nginx:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   ```
2. ขอติดตั้งใบรับรองความปลอดภัย SSL ฟรี:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```
   *(ระบบจะถามอีเมลของคุณ ให้กดยอมรับเงื่อนไข และเลือกข้อเสนอในการ Redirect HTTP ไปยัง HTTPS อัตโนมัติ)*

3. ทดสอบการต่ออายุใบรับรองอัตโนมัติ (Let's Encrypt จะหมดอายุทุก 90 วันและต่อให้อัตโนมัติ):
   ```bash
   sudo certbot renew --dry-run
   ```

---

### ขั้นตอนที่ 7: การตั้งค่าระบบเชื่อมต่อ (Firebase + LINE LIFF) และการรันแจ้งเตือนหลังบ้าน (LINE Notify Proxy)

เพื่อให้ระบบเชื่อมโยงกันแบบเรียลไทม์ (Live Sync) และดึงโปรไฟล์ LINE ลูกค้าได้โดยตรง รวมถึงยิงแจ้งเตือนแอดมิน:

#### A. สมัครบริการ Firebase และนำคีย์มาตั้งค่าในโค้ด
1. เข้าไปที่ [Firebase Console](https://console.firebase.google.com/) ล็อกอินด้วยบัญชี Google
2. กด **Add Project** และทำตามขั้นตอนตั้งชื่อโครงการให้เสร็จสิ้น (เช่น `kruaprakhun-order`)
3. ในหน้าแรกของโครงการ กดรูปไอคอนเว็บ `</>`เพื่อลงทะเบียนแอปพลิเคชันเว็บ
4. ระบบจะแสดงโค้ด `firebaseConfig` ให้คัดลอกส่วนคีย์เหล่านั้น:
   ```javascript
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
5. เปิดไฟล์ `/var/www/kruaprakhun/app.js` บน VPS และนำข้อมูลคีย์นี้ไปวางแทนที่ตัวแปร `firebaseConfig` ที่บรรทัดแรกสุดของไฟล์
6. ที่แถบเมนูด้านซ้ายใน Firebase Console ให้ไปที่ **Firestore Database** แล้วกด **Create Database**
   * เลือกโหมดเริ่มต้นเป็น **Start in test mode** เพื่อให้สามารถอ่านเขียนข้อมูลทดสอบได้
   * เลือกทำเลที่ตั้งเซิร์ฟเวอร์ (แนะนำเป็น `asia-southeast1` สิงคโปร์ เพื่อความเร็วสูงสุดในการเชื่อมต่อจากไทย)

#### B. การตั้งค่า LINE Developers & LINE LIFF
1. เข้าไปที่ [LINE Developers Console](https://developers.line.biz/console/) ล็อกอินด้วยบัญชี LINE
2. กด **Create a Provider** ตั้งชื่อผู้ให้บริการ (เช่น Krua Prakhun)
3. กด **Create a LINE Login channel** ตั้งชื่อแชนเนลและกรอกข้อมูลให้เสร็จสิ้น
4. ไปที่แท็บ **LIFF** แล้วกด **Add** เพื่อเปิดการใช้งาน LIFF App:
   * ตั้งชื่อแอป LIFF เช่น `Krua Prakhun Menu`
   * เลือกประเภทขนาดการแสดงผล (แนะนำเป็น **Full** หรือ **Tall**)
   * ช่อง **Endpoint URL** ให้กรอกที่อยู่อิเล็กทรอนิกส์สำหรับเข้าหน้าเว็บจริงของคุณ เช่น `https://yourdomain.com`
   * สิทธิ์ **Scopes**: เปิดใช้งานสิทธิ์ `profile` เพื่อดึงชื่อและรูปภาพโปรไฟล์ลูกค้า
5. กดบันทึก แล้วนำ **LIFF ID** ที่ได้ (เช่น `12345678-abcde`) ไปวางที่ตัวแปร `liffId` ที่ด้านบนของไฟล์ `/var/www/kruaprakhun/app.js`

#### C. การรันบริการยิงแจ้งเตือนแอดมิน (LINE Notify Proxy) ด้วย PM2
เพื่อป้องกันไม่ให้ผู้ใช้แฮกดู LINE Notify Token ของเจ้าของร้านในโค้ดหน้าบ้าน เราได้เตรียมบริการ `notify-server.js` ซึ่งจะดึงความปลอดภัยไปรันอยู่เบื้องหลัง VPS ของคุณ

1. ทำการขอ Token จาก [LINE Notify](https://notify-bot.line.me/) โดยเข้าสู่ระบบและกดออก Token สำหรับส่งข้อความส่วนตัวหรือเข้ากลุ่ม
2. ติดตั้ง **Node.js** บน VPS (หากยังไม่มี):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```
3. ติดตั้งโปรแกรมจัดการเซอร์วิส **PM2** เพื่อให้สคริปต์รันทำงานตลอดเวลาใน Background แม้จะปิดหน้าต่าง SSH:
   ```bash
   sudo npm install -y -g pm2
   ```
4. ทดสอบทดลองสั่งรันบริการแจ้งเตือนหลังบ้านด้วยคำสั่งนี้ (แทนที่ `<ใส่_line_notify_token_ของคุณ>` ด้วย Token จริง):
   ```bash
   LINE_NOTIFY_TOKEN="<ใส่_line_notify_token_ของคุณ>" PORT=3000 pm2 start /var/www/kruaprakhun/notify-server.js --name "kruaprakhun-notify"
   ```
5. ตั้งค่าให้ PM2 รันตัวเองอัตโนมัติหากเครื่อง VPS โดนรีบูต:
   ```bash
   pm2 startup
   # คัดลอกและนำคำสั่ง sudo env PATH=... ที่ขึ้นแสดงบนหน้าจอไปรันต่อ
   pm2 save
   ```
6. ไปแก้ไขตัวแปร `notifyProxyUrl` ที่แถวบนสุดของ `/var/www/kruaprakhun/app.js` บน VPS ให้ชี้ไปยังพอร์ตของบริการนี้:
   ```javascript
   const notifyProxyUrl = "http://your_vps_ip:3000/api/notify";
   ```

---

## 🎉 การทดสอบความเสร็จสมบูรณ์
ตอนนี้ คุณสามารถเปิดเบราว์เซอร์แล้วเข้าไปที่โดเมนของคุณ `https://yourdomain.com` 
* เวบไซต์ของคุณจะขึ้นแสดงผลสวยงามและมีความปลอดภัยสูง (HTTPS)
* ข้อมูลการสั่งอาหาร เมนูอาหาร และลูกค้าทั้งหมดจะบันทึกซิงค์เชื่อมต่อเข้ากับฐานข้อมูล Firebase Firestore จริงทันที ทำให้ซิงค์สถานะระหว่างแอดมิน ห้องครัว และลูกค้าข้ามอุปกรณ์ได้แบบเรียลไทม์
* เมื่อลูกค้าส่งออเดอร์ใหม่ ระบบจะยิงข้อความรายละเอียดออเดอร์นั้นเตือนเข้า LINE Notify ของแอดมินทันที
* แคมเปญการตลาด CRM จะยังคงบันทึกผ่าน URL parameters ทันทีเมื่อมีผู้ใช้งานผ่าน QR Code หรือ Google Ads
