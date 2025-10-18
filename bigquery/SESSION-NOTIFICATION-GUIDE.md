# 🔔 ระบบการแจ้งเตือนเซสชัน (Session Notification System)

## 📖 ภาพรวม

ระบบการแจ้งเตือนเซสชันถูกออกแบบมาเพื่อแจ้งเตือนผู้ใช้แบบ real-time เมื่อมีการเปลี่ยนแปลงเกี่ยวกับ session การล็อกอิน หรือความปลอดภัยของบัญชี

## ✨ ฟีเจอร์หลัก

### 1. **Single Session Management**
- ผู้ใช้แต่ละคนสามารถล็อกอินได้เครื่องเดียวเท่านั้น
- เมื่อมีการล็อกอินจากเครื่องใหม่ เครื่องเก่าจะได้รับการแจ้งเตือน

### 2. **Real-time Notifications**
- ใช้ Server-Sent Events (SSE) สำหรับการสื่อสารแบบ real-time
- การแจ้งเตือนจะปรากฏทันทีในรูปแบบ popup สวยงาม

### 3. **User-Friendly Experience**
- ผู้ใช้จะได้รับการแจ้งเตือนล่วงหน้า 10 วินาทีก่อนถูกเตะออก
- มีเวลาเตรียมตัวบันทึกงานหรือจัดการข้อมูล

## 🏗️ สถาปัตยกรรมระบบ

### Components

1. **Server-Sent Events API** (`/api/auth/notifications`)
   - จัดการ connection แบบ real-time
   - รองรับหลายผู้ใช้พร้อมกัน

2. **Session Service** (`lib/session-service.ts`)
   - จัดการ lifecycle ของ session
   - ตรวจสอบและยกเลิก session

3. **React Hook** (`lib/hooks/useSessionNotifications.ts`)
   - เชื่อมต่อกับ SSE
   - แสดงการแจ้งเตือน

4. **Notification Provider** (`components/SessionNotificationProvider.tsx`)
   - Component สำหรับ layout
   - ทำงานอัตโนมัติ

## 🚀 การติดตั้งและใช้งาน

### 1. ติดตั้งอัตโนมัติ
ระบบถูกติดตั้งใน `app/layout.tsx` แล้ว:

```tsx
import SessionNotificationProvider from '@/components/SessionNotificationProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <ThemeProvider>
          {children}
          <SessionNotificationProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. การทำงานของระบบ

#### เมื่อผู้ใช้ล็อกอิน:
1. ระบบตรวจสอบ session เดิม
2. ส่งการแจ้งเตือนไปยังเครื่องเก่า
3. รอ 1 วินาทีให้การแจ้งเตือนไปถึง
4. ยกเลิก session เก่าและสร้าง session ใหม่

#### เมื่อได้รับการแจ้งเตือน:
1. แสดง popup บนหน้าจอ
2. มี animation slide-in/out
3. หายไปอัตโนมัติหลังจาก 8 วินาที (warning) หรือ 5 วินาที (alert)

## 🎨 ประเภทการแจ้งเตือน

### 1. Session Warning (⚠️)
- **สี**: แดง-ส้म gradient
- **ใช้งาน**: แจ้งเตือนก่อนยกเลิก session
- **ระยะเวลา**: 8 วินาที
- **ตัวอย่าง**: "มีการเข้าสู่ระบบจากอุปกรณ์ใหม่ เซสชันเก่าจะถูกปิดภายใน 10 วินาที"

### 2. Session Alert (🔔)
- **สี**: น้ำเงิน-ม่วง gradient
- **ใช้งาน**: แจ้งเตือนทั่วไป
- **ระยะเวลา**: 5 วินาที
- **ตัวอย่าง**: "ระบบได้อัปเดตการตั้งค่าความปลอดภัยแล้ว"

## 🔧 การทดสอบระบบ

### 1. การทดสอบแบบ Manual
1. เปิด browser หลายตัว
2. ล็อกอินด้วย account เดียวกัน
3. ล็อกอินใหม่จาก browser อื่น
4. ตรวจสอบการแจ้งเตือนใน browser เก่า

### 2. การทดสอบด้วย Test Page
เปิดไฟล์ `test-notifications.html` เพื่อ:
- ทดสอบ SSE connection
- จำลองการแจ้งเตือนต่างๆ
- ตรวจสอบ log ของระบบ

## 📝 Log และ Debugging

### Server Logs
```
📡 Starting SSE connection for user 1
📡 SSE connection established for user 1
🔔 Sending notification to 1 connections for user 1: [message]
🔒 Deactivated 1 sessions for user 1
```

### Client Logs
```
📡 Session notifications connected successfully
🔔 Session warning received: [data]
📢 Session alert received: [data]
🔒 Session notifications disconnected
```

## ⚙️ การตั้งค่า

### Environment Variables
ไม่มี environment variables เพิ่มเติม ระบบใช้การตั้งค่าเดียวกับ authentication system

### Database
ใช้ตาราง `UserSession` ที่มีอยู่แล้วใน Prisma schema

### Security
- ตรวจสอบ JWT token ก่อนอนุญาต SSE connection
- ส่งการแจ้งเตือนเฉพาะผู้ใช้ที่ถูกต้อง
- Connection จะถูกปิดอัตโนมัติเมื่อ token หมดอายุ

## 🐛 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **ไม่ได้รับการแจ้งเตือน**
   - ตรวจสอบ console logs
   - ตรวจสอบ network tab ใน dev tools
   - ตรวจสอบว่า token ยังใช้งานได้

2. **SSE Connection Error**
   - ตรวจสอบ authentication status
   - ตรวจสอบ middleware configuration
   - restart development server

3. **การแจ้งเตือนไม่แสดง**
   - ตรวจสอบ CSS และ JavaScript
   - ตรวจสอบ browser console errors
   - ตรวจสอบ z-index ของ popup

### Debug Commands
```bash
# ตรวจสอบ logs ของ development server
npm run dev

# ตรวจสอบ database sessions
npx prisma studio
```

## 🔮 การพัฒนาต่อ

### ฟีเจอร์ที่อาจเพิ่มในอนาคต
1. การแจ้งเตือนผ่าน email
2. การแจ้งเตือนผ่าน push notifications
3. การตั้งค่าประเภทการแจ้งเตือนที่ต้องการ
4. ประวัติการแจ้งเตือน
5. การแจ้งเตือนเมื่อมีการเข้าถึงจาก IP address ใหม่

### API Extensions
```typescript
// ส่งการแจ้งเตือนแบบกำหนดเอง
notifyUserSessions(userId, "Custom message", "custom_type");

// ส่งการแจ้งเตือนไปยังผู้ใช้หลายคน
notifyMultipleUsers([userId1, userId2], "Broadcast message");
```

---

## 📞 การติดต่อ

หากมีปัญหาหรือข้อสงสัยเกี่ยวกับระบบ notification สามารถ:
1. ตรวจสอบ console logs
2. ดู test page สำหรับการทดสอบ
3. ตรวจสอบ network requests ใน dev tools

ระบบนี้ออกแบบมาเพื่อให้ user experience ที่ดีที่สุดในการจัดการ session และความปลอดภัยของบัญชีผู้ใช้ 🎉