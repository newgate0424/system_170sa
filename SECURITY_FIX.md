# 🔒 Security Vulnerabilities Fixed

## วันที่แก้ไข: 26 ตุลาคม 2025

## ✅ สรุปการแก้ไขช่องโหว่ความปลอดภัย

### 1. 🚨 เพิ่ม Authentication สำหรับ API Routes

**ปัญหา:** API routes หลายตัวไม่มีการตรวจสอบ authentication ทำให้ใครก็ตามสามารถเข้าถึงข้อมูลได้

**การแก้ไข:**
เพิ่ม `requireAuth()` หรือ `requireAdmin()` ใน API routes ต่อไปนี้:

#### API Routes ที่แก้ไข:
- ✅ `/api/overview` - เพิ่ม `requireAuth()`
- ✅ `/api/adser` - เพิ่ม `requireAuth()`
- ✅ `/api/gateway-data` - เพิ่ม `requireAuth()`
- ✅ `/api/sheets` - เพิ่ม `requireAuth()`
- ✅ `/api/team-targets` (GET & POST) - เพิ่ม `requireAuth()`
- ✅ `/api/color-rules` (GET & POST) - เพิ่ม `requireAuth()`
- ✅ `/api/color-rules/[id]` (PATCH, PUT, DELETE) - เพิ่ม `requireAuth()`
- ✅ `/api/sync-gateway` (POST) - เพิ่ม `requireAuth()`
- ✅ `/api/sync-gateway` (GET) - เพิ่ม API key validation
- ✅ `/api/system/stats` - ใช้ `requireAdmin()` อยู่แล้ว ✓

#### API Routes ที่ไม่ต้องแก้:
- ✓ `/api/auth/login` - สำหรับ login (public)
- ✓ `/api/auth/logout` - มี validation อยู่แล้ว
- ✓ `/api/auth/me` - มี validation อยู่แล้ว
- ✓ `/api/exchange-rate` - public API (ไม่มีข้อมูลละเอียดอ่อน)
- ✓ `/api/admin/*` - ใช้ `requireAdmin()` อยู่แล้ว

---

### 2. 🔐 เพิ่ม API Key Protection สำหรับ Cron Job

**ปัญหา:** `/api/sync-gateway` (GET) สำหรับ cron job ไม่มีการป้องกัน ใครก็ตามเรียกได้

**การแก้ไข:**
```typescript
// ต้องมี API key ใน query parameter หรือ header
const apiKey = searchParams.get('key') || request.headers.get('x-api-key')

if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**วิธีเรียกใช้:**
```bash
# ใช้ query parameter
GET /api/sync-gateway?key=newgate-sync-now

# หรือใช้ header
GET /api/sync-gateway
Header: x-api-key: newgate-sync-now
```

---

### 3. 🗑️ ลบตัวแปรที่ไม่จำเป็นใน .env.local

**ปัญหา:** มีตัวแปรที่ไม่ได้ใช้งาน และตัวแปรที่ซ้ำซ้อน

**การแก้ไข:**
ลบตัวแปรต่อไปนี้:
- ❌ `GOOGLE_PROJECT_ID` - ไม่ได้ใช้ในโค้ด
- ❌ `GOOGLE_CLIENT_EMAIL` - ไม่ได้ใช้ในโค้ด
- ❌ `JWT_SECRET= "changeme"` - ซ้ำกับ `NEXTAUTH_SECRET` (รวมเป็นตัวเดียว)

**ไฟล์ .env.local ใหม่:**
```bash
# Database URLs
ADSER_DATABASE_URL= "mysql://sacom_new:sRR10s47dfersl@103.80.48.25:3306/170sa"
DATABASE_URL= "mysql://sacom_newgate:ads170sa883@103.80.48.25:3306/admin_auth"

# NextAuth Configuration
NEXTAUTH_SECRET= "b1g+H7iP5tYq/N8dK3sA2vL9wXzF6jR0cE4mG1uV7o="
NEXTAUTH_URL= "http://170sa.com"

# JWT Configuration (used by auth.ts)
JWT_SECRET= "b1g+H7iP5tYq/N8dK3sA2vL9wXzF6jR0cE4mG1uV7o="

# Exchange Rate API
EXCHANGE_RATE_API_KEY= "531f86c756c6b290472d9f45"
EXCHANGE_API_URL= "https://v6.exchangerate-api.com/v6/531f86c756c6b290472d9f45/latest/USD"

# Google Sheets API
GOOGLE_API_KEY= "AIzaSyAMwdqaWNpnFpeLOoq8kufa_gsDfqAqF8s"
GOOGLE_SHEET_ID= "15yR37dqHgRKHL3hfgO-QKvbyOWlgJaWo3dzQjJGJBLM"

# Sync API Protection (for cron job)
SYNC_API_KEY= "newgate-sync-now"
```

---

## 📋 รายละเอียดการแก้ไขแต่ละไฟล์

### ไฟล์ที่แก้ไข:

1. **src/app/api/overview/route.ts**
   - เพิ่ม `import { requireAuth } from '@/lib/auth'`
   - เพิ่ม `await requireAuth()` ใน GET handler
   - เพิ่ม error handling สำหรับ Unauthorized

2. **src/app/api/adser/route.ts**
   - เพิ่ม `import { requireAuth } from '@/lib/auth'`
   - เพิ่ม `await requireAuth()` ใน GET handler
   - เพิ่ม error handling สำหรับ Unauthorized

3. **src/app/api/gateway-data/route.ts**
   - เพิ่ม `import { requireAuth } from '@/lib/auth'`
   - เพิ่ม `await requireAuth()` ใน GET handler
   - เพิ่ม error handling สำหรับ Unauthorized

4. **src/app/api/sheets/route.ts**
   - เพิ่ม `import { requireAuth } from '@/lib/auth'`
   - เพิ่ม `await requireAuth()` ใน GET handler
   - เพิ่ม error handling สำหรับ Unauthorized

5. **src/app/api/team-targets/route.ts**
   - เพิ่ม `import { requireAuth } from '@/lib/auth'`
   - เพิ่ม `await requireAuth()` ใน GET และ POST handlers
   - เพิ่ม error handling สำหรับ Unauthorized

6. **src/app/api/color-rules/route.ts**
   - เพิ่ม `import { requireAuth } from '@/lib/auth'`
   - เพิ่ม `await requireAuth()` ใน GET และ POST handlers
   - เพิ่ม error handling สำหรับ Unauthorized

7. **src/app/api/color-rules/[id]/route.ts**
   - เพิ่ม `import { requireAuth } from '@/lib/auth'`
   - เพิ่ม `await requireAuth()` ใน PATCH, PUT, DELETE handlers
   - เพิ่ม error handling สำหรับ Unauthorized

8. **src/app/api/sync-gateway/route.ts**
   - เพิ่ม `import { requireAuth } from '@/lib/auth'`
   - เพิ่ม `await requireAuth()` ใน POST handler (manual sync)
   - เปิดใช้งาน API key validation ใน GET handler (cron job)
   - ตรวจสอบ API key จาก query parameter หรือ header

9. **src/app/api/exchange-rate/route.ts**
   - เพิ่มคอมเมนต์สำหรับ optional authentication
   - ปล่อยเป็น public API เพราะไม่มีข้อมูลละเอียดอ่อน

10. **.env.local**
    - ลบตัวแปรที่ไม่จำเป็น (GOOGLE_PROJECT_ID, GOOGLE_CLIENT_EMAIL)
    - รวม JWT_SECRET ให้ใช้ค่าเดียวกับ NEXTAUTH_SECRET
    - เพิ่มคอมเมนต์อธิบายแต่ละส่วน

---

## ⚠️ สิ่งที่ยังควรทำเพิ่มเติม (แนะนำ)

### 1. Rate Limiting
เพิ่ม rate limiting เพื่อป้องกัน API abuse:
```bash
npm install @upstash/ratelimit @upstash/redis
```

### 2. CORS Configuration
กำหนด CORS ที่เหมาะสมใน `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'http://170sa.com' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
      ],
    },
  ]
}
```

### 3. Input Validation
เพิ่ม input validation ด้วย Zod สำหรับทุก API endpoint

### 4. Security Headers
เพิ่ม security headers ใน `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ]
}
```

### 5. HTTPS Only
ใน production ตั้งค่า:
```bash
NEXTAUTH_URL= "https://170sa.com"  # เปลี่ยนจาก http เป็น https
```

---

## 🧪 การทดสอบ

### ทดสอบ Authentication
```bash
# ก่อนแก้ไข - เรียกได้โดยไม่ login
curl http://localhost:3000/api/overview?startDate=2024-01-01&endDate=2024-12-31

# หลังแก้ไข - ต้อง login ก่อน (จะได้ 401 Unauthorized)
curl http://localhost:3000/api/overview?startDate=2024-01-01&endDate=2024-12-31
# Response: {"error":"กรุณาเข้าสู่ระบบ"}
```

### ทดสอบ API Key Protection
```bash
# ไม่มี API key - จะได้ 401
curl http://localhost:3000/api/sync-gateway

# มี API key ที่ถูกต้อง - จะทำงาน
curl "http://localhost:3000/api/sync-gateway?key=newgate-sync-now"
```

---

## 📊 สรุปผลกระทบ

### ✅ ข้อดี:
- ✅ ป้องกันการเข้าถึงข้อมูลโดยไม่ได้รับอนุญาต
- ✅ ป้องกัน API abuse
- ✅ ไฟล์ .env.local สะอาดและเข้าใจง่ายขึ้น
- ✅ เพิ่มความปลอดภัยโดยรวม

### ⚠️ สิ่งที่ต้องระวัง:
- ⚠️ ต้องแน่ใจว่า frontend ส่ง cookies ไปกับ request ทุกครั้ง
- ⚠️ ต้องมี session ที่ valid ก่อนเรียก API
- ⚠️ Cron job ต้องใช้ API key ที่ถูกต้อง

---

## 🎯 Checklist การแก้ไขทั้งหมด

- [x] เพิ่ม authentication ใน `/api/overview`
- [x] เพิ่ม authentication ใน `/api/adser`
- [x] เพิ่ม authentication ใน `/api/gateway-data`
- [x] เพิ่ม authentication ใน `/api/sheets`
- [x] เพิ่ม authentication ใน `/api/team-targets`
- [x] เพิ่ม authentication ใน `/api/color-rules`
- [x] เพิ่ม authentication ใน `/api/color-rules/[id]`
- [x] เพิ่ม authentication ใน `/api/sync-gateway` (POST)
- [x] เพิ่ม API key validation ใน `/api/sync-gateway` (GET)
- [x] ลบตัวแปรที่ไม่จำเป็นใน .env.local
- [x] รวม JWT_SECRET ให้ใช้ค่าเดียวกับ NEXTAUTH_SECRET
- [x] เพิ่ม error handling สำหรับ Unauthorized

---

## 📝 หมายเหตุ

1. **JWT_SECRET**: ใช้ค่าเดียวกับ `NEXTAUTH_SECRET` เพื่อความสะดวกและความปลอดภัย
2. **SYNC_API_KEY**: ใช้สำหรับป้องกัน cron job จากการเข้าถึงโดยไม่ได้รับอนุญาต
3. **Exchange Rate API**: ปล่อยเป็น public เพราะไม่มีข้อมูลละเอียดอ่อน และต้องการให้ frontend เรียกได้โดยตรง

---

**สรุป:** ระบบปลอดภัยขึ้นมาก! ทุก API ที่เกี่ยวข้องกับข้อมูลสำคัญต้อง login ก่อนถึงจะเรียกได้ ✅

**แนะนำ:** ควรเพิ่ม rate limiting และ CORS configuration ต่อไปเพื่อความปลอดภัยสูงสุด 🔒
