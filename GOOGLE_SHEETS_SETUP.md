# การตั้งค่า Google Sheets API สำหรับหน้า Overview

## ขั้นตอนที่ 1: สร้าง Google API Key

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่หรือเลือก Project ที่มีอยู่
3. ไปที่ **APIs & Services** > **Library**
4. ค้นหาและเปิดใช้งาน **Google Sheets API**
5. ไปที่ **APIs & Services** > **Credentials**
6. คลิก **Create Credentials** > **API Key**
7. คัดลอก API Key ที่ได้

## ขั้นตอนที่ 2: ตั้งค่า Environment Variable

1. สร้างหรือแก้ไขไฟล์ `.env.local` ในโฟลเดอร์ root ของโปรเจค:

```bash
GOOGLE_API_KEY="YOUR_API_KEY_HERE"
```

2. แทนที่ `YOUR_API_KEY_HERE` ด้วย API Key ที่ได้จากขั้นตอนที่ 1

## ขั้นตอนที่ 3: ตั้งค่า Google Sheets

1. เปิด Google Sheets ที่ต้องการดึงข้อมูล
2. คลิก **Share** ที่มุมขวาบน
3. ตั้งค่าเป็น **Anyone with the link can view**
4. คัดลอก Spreadsheet ID จาก URL

URL Format:
```
https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
```

## ขั้นตอนที่ 4: อัพเดทโค้ด (ถ้าต้องการเปลี่ยน Spreadsheet)

แก้ไขไฟล์ `src/lib/googleSheets.ts`:

```typescript
const spreadsheetId = 'YOUR_SPREADSHEET_ID_HERE'
```

และ/หรือเปลี่ยน range:

```typescript
range: 'Sheet1!A1:Z1000', // ชื่อ Sheet และ range ที่ต้องการ
```

## ขั้นตอนที่ 5: รีสตาร์ทเซิร์ฟเวอร์

```bash
# หยุดเซิร์ฟเวอร์เดิม (Ctrl+C)
# รันใหม่
npm run dev
```

## โครงสร้างข้อมูล

Google Sheets ควรมีโครงสร้างดังนี้:

| Header 1 | Header 2 | Header 3 | ... |
|----------|----------|----------|-----|
| Data 1   | Data 2   | Data 3   | ... |
| Data 4   | Data 5   | Data 6   | ... |

- แถวแรกจะถือว่าเป็น **Headers**
- แถวถัดไปเป็น**ข้อมูล**

## Features

- ✅ ดึงข้อมูลจาก Google Sheets แบบ real-time
- ✅ ค้นหาข้อมูล
- ✅ Export เป็น CSV
- ✅ แสดงสถิติ (จำนวนแถว, คอลัมน์)
- ✅ Responsive design
- ✅ รองรับ Dark mode

## Troubleshooting

### Error: "GOOGLE_API_KEY is not set"
- ตรวจสอบว่าไฟล์ `.env.local` มี `GOOGLE_API_KEY`
- รีสตาร์ทเซิร์ฟเวอร์

### Error: "The caller does not have permission"
- ตรวจสอบว่า Google Sheets ถูกตั้งค่าเป็น **public** (Anyone with the link can view)
- ตรวจสอบว่า Google Sheets API เปิดใช้งานแล้ว

### Error: "Unable to parse range"
- ตรวจสอบชื่อ Sheet ว่าถูกต้อง
- ตรวจสอบ range format (เช่น `Sheet1!A1:Z1000`)

### ข้อมูลไม่อัพเดท
- คลิกปุ่ม **รีเฟรช** ในหน้า Overview
- ตรวจสอบว่า Google Sheets มีการเปลี่ยนแปลง

## Security Notes

⚠️ **สำคัญ:**
- อย่า commit `.env.local` ไปใน Git
- ใช้ API Key restrictions ใน Google Cloud Console
- จำกัดการเข้าถึงหน้า Overview ให้เฉพาะผู้ใช้ที่ login แล้ว (ทำอยู่แล้ว)

## การปรับแต่ง

### เปลี่ยนจำนวนแถวที่ดึง
แก้ไขใน `src/lib/googleSheets.ts`:
```typescript
range: 'Sheet1!A1:Z5000', // เพิ่มเป็น 5000 แถว
```

### เปลี่ยน Sheet Name
```typescript
range: 'MySheetName!A1:Z1000', // เปลี่ยนจาก Sheet1 เป็น MySheetName
```

### เพิ่มการ format ข้อมูล
แก้ไขใน `src/app/overview/page.tsx` ในส่วน render ของ table cells
