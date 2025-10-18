# 🚀 คู่มือติดตั้งระบบ (ภาษาไทย)

## ✅ สิ่งที่ทำเสร็จแล้ว
- ✅ ติดตั้ง dependencies แล้ว (npm install)
- ✅ แก้ไข security vulnerabilities แล้ว
- ✅ สร้างไฟล์ .env แล้ว
- ✅ Prisma Client generate แล้ว

## ⚠️ ขั้นตอนที่ต้องทำต่อ

### 1. เปิด MySQL Server

#### ถ้าใช้ XAMPP:
1. เปิด **XAMPP Control Panel**
2. กด **Start** ที่ MySQL
3. รอจนสถานะเป็นสีเขียว

#### ถ้าใช้ WAMP:
1. เปิด **WAMP Server**
2. คลิกขวาที่ไอคอน WAMP → MySQL → Service → Start/Resume Service

#### ถ้าใช้ Command Line:
```powershell
# สำหรับ XAMPP
cd C:\xampp\mysql\bin
.\mysqld.exe

# หรือใช้ Windows Service
net start MySQL
```

### 2. สร้างฐานข้อมูล

เปิด **phpMyAdmin** หรือ **MySQL Workbench** แล้วรันคำสั่ง:

```sql
CREATE DATABASE admin_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

หรือใช้ Command Line:
```powershell
# เข้า MySQL
mysql -u root -p

# สร้างฐานข้อมูล
CREATE DATABASE admin_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

### 3. ตั้งค่า .env

ไฟล์ `.env` มีค่าดังนี้ (แก้ไขตามการตั้งค่า MySQL ของคุณ):

```env
DATABASE_URL="mysql://root:@localhost:3306/admin_auth"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NODE_ENV="development"
```

**หมายเหตุ:** 
- ถ้ามี password ให้ใส่หลัง `root:` เช่น `mysql://root:mypassword@localhost:3306/admin_auth`
- ถ้าใช้ port อื่น ให้เปลี่ยน `3306` เป็น port ที่ใช้

### 4. Push Database Schema

```powershell
npx prisma db push
```

คำสั่งนี้จะสร้างตารางทั้งหมด:
- ✅ User (ตารางผู้ใช้)
- ✅ Session (ตารางเซสชัน)
- ✅ UserSettings (ตารางการตั้งค่า)
- ✅ ActivityLog (ตารางบันทึกกิจกรรม)
- ✅ LoginAttempt (ตารางความพยายามเข้าสู่ระบบ)

### 5. สร้าง Admin User

รัน SQL ในไฟล์ `setup-database.sql` หรือคัดลอกคำสั่งนี้ไปรันใน phpMyAdmin:

```sql
USE admin_auth;

INSERT INTO User (id, username, password, role, teams, isLocked, createdAt, updatedAt)
VALUES (
  'admin-001',
  'admin',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5i4I3NqqMbzIi',
  'ADMIN',
  '[]',
  false,
  NOW(),
  NOW()
);
```

**ข้อมูลเข้าสู่ระบบ:**
- Username: `admin`
- Password: `admin123`

### 6. รันระบบ

```powershell
npm run dev
```

เปิดเบราว์เซอร์ไปที่: **http://localhost:3000**

---

## 🎯 ขั้นตอนสรุป (Quick Steps)

```powershell
# 1. เปิด MySQL (XAMPP/WAMP)

# 2. สร้างฐานข้อมูล
mysql -u root -p
CREATE DATABASE admin_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# 3. Push schema
npx prisma db push

# 4. รัน SQL สร้าง admin user (ใช้ phpMyAdmin หรือ MySQL Workbench)
# คัดลอกจากไฟล์ setup-database.sql

# 5. รันระบบ
npm run dev
```

---

## 🐛 แก้ปัญหา (Troubleshooting)

### ❌ Error: Can't reach database server at `localhost:3306`

**สาเหตุ:** MySQL ยังไม่ได้เปิด

**แก้ไข:**
1. เปิด XAMPP/WAMP Control Panel
2. Start MySQL
3. รันคำสั่งใหม่อีกครั้ง

---

### ❌ Error: Unknown database 'admin_auth'

**สาเหตุ:** ยังไม่ได้สร้างฐานข้อมูล

**แก้ไข:**
```sql
CREATE DATABASE admin_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### ❌ Error: Access denied for user 'root'@'localhost'

**สาเหตุ:** Password ไม่ถูกต้อง

**แก้ไข:**
แก้ไขไฟล์ `.env`:
```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/admin_auth"
```

---

### ❌ Error: Port 3306 already in use

**สาเหตุ:** MySQL รันอยู่แล้ว หรือมีโปรแกรมอื่นใช้ port นี้

**แก้ไข:**
1. หยุด MySQL ใน XAMPP/WAMP
2. Start ใหม่อีกครั้ง

---

### ❌ Module not found errors

**แก้ไข:**
```powershell
rm -r node_modules
rm package-lock.json
npm install
```

---

## 📊 ตรวจสอบการติดตั้ง

ใช้คำสั่งนี้เพื่อดูตารางที่สร้างแล้ว:

```powershell
npx prisma studio
```

เปิดเบราว์เซอร์ไปที่: **http://localhost:5555**

---

## 🎨 หลังจากเข้าสู่ระบบสำเร็จ

1. **เปลี่ยนรหัสผ่าน**
   - ไปที่ Settings (⚙️)
   - เปลี่ยนรหัสผ่านทันที

2. **ปรับแต่งธีม**
   - เลือกสี: สีน้ำเงิน, สีเขียว, สีชมพู และอีกมากมาย
   - เลือกฟอนต์: Inter, Kanit, Sarabun, Prompt, ฯลฯ
   - เปลี่ยนขนาดฟอนต์: เล็ก, กลาง, ใหญ่

3. **สร้างผู้ใช้ใหม่**
   - ไปที่ Admin → จัดการผู้ใช้
   - คลิก เพิ่มผู้ใช้
   - กรอกข้อมูลและกำหนดสิทธิ์

4. **ดูบันทึกกิจกรรม**
   - ไปที่ Admin → บันทึกกิจกรรม
   - ดูกิจกรรมทั้งหมดของผู้ใช้

5. **จัดการผู้ใช้ออนไลน์**
   - ไปที่ Admin → ผู้ใช้ออนไลน์
   - บังคับออกจากระบบได้ (Force Logout)

---

## 🚀 พร้อมแล้ว!

ระบบพร้อมใช้งาน เข้าสู่ระบบได้ที่:

**http://localhost:3000**

- Username: `admin`
- Password: `admin123`

**อย่าลืมเปลี่ยนรหัสผ่านหลังเข้าสู่ระบบครั้งแรก! 🔒**
