# Gateway Data Sync - Cron Job Setup

## 📋 API Endpoints

### 1. Sync Data (GET - สำหรับ Cron Job)
```
GET https://your-domain.com/api/sync-gateway
```

**Response:**
```json
{
  "totalSheets": 7,
  "successCount": 7,
  "failedCount": 0,
  "totalSynced": 1500,
  "totalErrors": 0,
  "details": [...],
  "syncedAt": "2024-10-22T10:30:00.000Z",
  "source": "cron-job"
}
```

### 2. Sync Data (POST - สำหรับ Manual)
```
POST https://your-domain.com/api/sync-gateway
Content-Type: application/json

{
  "sheets": ["สาวอ้อย", "อลิน"]  // Optional: เลือก sheets เฉพาะ
}
```

### 3. ดูสถานะ
```
GET https://your-domain.com/api/sync-gateway/status
```

**Response:**
```json
{
  "success": true,
  "stats": [...],
  "totalRecords": 1500,
  "lastSync": "2024-10-22T10:30:00.000Z"
}
```

---

## 🔧 Cron Job Setup

### Option 1: cron-job.org (แนะนำ - ฟรี)

1. ไปที่ https://cron-job.org
2. สมัครสมาชิก (ฟรี)
3. สร้าง Cron Job ใหม่:
   - **Title**: Gateway Data Sync
   - **URL**: `https://your-domain.com/api/sync-gateway`
   - **Schedule**: 
     - ทุกวัน เวลา 00:00 น.: `0 0 * * *`
     - ทุก 6 ชั่วโมง: `0 */6 * * *`
     - ทุกชั่วโมง: `0 * * * *`
   - **Method**: GET
4. บันทึกและเปิดใช้งาน

### Option 2: EasyCron (ฟรี)

1. ไปที่ https://www.easycron.com
2. สมัครสมาชิก
3. Create New Cron Job:
   - **URL to call**: `https://your-domain.com/api/sync-gateway`
   - **When to execute**: Custom
     - ทุกวัน 00:00: `0 0 * * *`
   - **HTTP Method**: GET
4. Save

### Option 3: Server Cron (Linux/Ubuntu)

```bash
# แก้ไข crontab
crontab -e

# เพิ่มบรรทัดนี้ (sync ทุกวัน เวลา 00:00)
0 0 * * * curl -X GET https://your-domain.com/api/sync-gateway

# หรือ sync ทุก 6 ชั่วโมง
0 */6 * * * curl -X GET https://your-domain.com/api/sync-gateway
```

### Option 4: Windows Task Scheduler

1. เปิด Task Scheduler
2. Create Basic Task
3. ตั้งชื่อ: "Gateway Data Sync"
4. Trigger: Daily เวลา 00:00
5. Action: Start a program
   - Program: `curl`
   - Arguments: `-X GET https://your-domain.com/api/sync-gateway`
6. Finish

---

## 🔒 การเพิ่มความปลอดภัย (Optional)

### 1. เพิ่ม API Key

แก้ไข `.env`:
```env
SYNC_API_KEY=your-secret-key-here
```

แก้ไข `src/app/api/sync-gateway/route.ts`:
```typescript
// Uncomment บรรทัดนี้
if (apiKey !== process.env.SYNC_API_KEY) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

เรียกใช้:
```
GET https://your-domain.com/api/sync-gateway?key=your-secret-key-here
```

---

## 📊 ตัวอย่าง Cron Schedule

| รูปแบบ | คำอธิบาย | Cron Expression |
|--------|----------|-----------------|
| ทุกวัน เวลา 00:00 | Sync หลังเที่ยงคืน | `0 0 * * *` |
| ทุกวัน เวลา 06:00 | Sync ตอนเช้า | `0 6 * * *` |
| ทุก 6 ชั่วโมง | Sync 4 ครั้งต่อวัน | `0 */6 * * *` |
| ทุก 12 ชั่วโมง | Sync 2 ครั้งต่อวัน | `0 */12 * * *` |
| ทุกชั่วโมง | Sync ทุกชั่วโมง | `0 * * * *` |

---

## 🧪 ทดสอบ

### ทดสอบด้วย Browser
```
https://your-domain.com/api/sync-gateway
```

### ทดสอบด้วย curl
```bash
curl -X GET https://your-domain.com/api/sync-gateway
```

### ทดสอบด้วย PowerShell
```powershell
Invoke-WebRequest -Uri "https://your-domain.com/api/sync-gateway" -Method GET
```

---

## 📝 หมายเหตุ

- แนะนำให้ sync วันละ 1-2 ครั้ง (เพียงพอสำหรับข้อมูลที่อัพเดททุกวัน)
- การ sync ใช้เวลาประมาณ 1-2 นาที (ขึ้นอยู่กับปริมาณข้อมูล)
- ตรวจสอบสถานะได้ที่ `/api/sync-gateway/status`
- Log จะแสดงใน server console

---

## 🔗 Links สำคัญ

- **Sync URL**: `https://your-domain.com/api/sync-gateway`
- **Status URL**: `https://your-domain.com/api/sync-gateway/status`
- **Sync Page**: `https://your-domain.com/sync`
