# 🔧 แก้ไขปัญหา Total Row Percentage Display

## 🐛 **ปัญหาที่พบ**
แถวรวม (Total row) ของคอลัมน์:
- ยอดเสีย (Lost_Messages)
- เพจบล็อก 7วัน (Page_Blocks_7Days)  
- เพจบล็อก 30วัน (Page_Blocks_30Days)
- ทักเงียบ (Silent)
- ทักซ้ำ (Duplicate)
- มียูส (Has_User)
- ก่อกวน (Spam)
- บล็อก (Blocked)
- เด็ก (Under_18)
- อายุเกิน50 (Over_50)
- ต่างชาติ (Foreign)

**ไม่เปลี่ยนเป็นเปอร์เซ็นต์** เมื่อกดสลับระหว่าง จำนวน และ % 

## 🔍 **สาเหตุ**
1. **Logic Conflict**: มี logic หลายชั้นที่จัดการ percentage columns
2. **Priority Issues**: `numberColumns` logic ทำงานก่อน percentage logic
3. **isAverageCol Interference**: condition ของ `isAverageCol` ขัดแย้งกับ percentage logic

### สาเหตุโดยละเอียด:
```typescript
// Logic เดิมที่มีปัญหา
const numberColumns = ['Lost_Messages', 'Page_Blocks_7Days', ...] // ประมวลผลก่อน
if (numberColumns.includes(header)) {
  // แสดงแบบจำนวนเสมอ - ไม่สนใจ displayMode
  const sum = values.reduce((sum, v) => sum + v, 0)
  summary[header] = sum.toLocaleString('en-US', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  })
  return // จบที่นี่ - ไม่ไปถึง percentage logic
}
```

## ✅ **การแก้ไข**

### 1. **เพิ่ม Percentage Logic ก่อน Number Columns**
```typescript
// ตรวจสอบว่าเป็น percentage columns และอยู่ในโหมด percent หรือไม่
if (displayMode === 'percent' && percentageColumns.includes(header)) {
  // คำนวณ percentage สำหรับ Total row
  const sum = values.reduce((sum, v) => sum + v, 0)
  const totalMessagesSum = displayData
    .map(row => parseFloat(String(row['Total_Messages'] || '0').replace(/,/g, '')))
    .filter(v => !isNaN(v))
    .reduce((sum, v) => sum + v, 0)
  
  if (totalMessagesSum > 0) {
    const percentValue = (sum / totalMessagesSum) * 100
    summary[header] = percentValue.toFixed(2) + '%'
  } else {
    summary[header] = '0.00%'
  }
  return
}

// คอลัมน์ตัวเลขทั่วไป - ทำงานหลังจาก percentage logic
if (numberColumns.includes(header)) {
  const sum = values.reduce((sum, v) => sum + v, 0)
  summary[header] = sum.toLocaleString('en-US', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  })
  return
}
```

### 2. **แก้ไข isAverageCol Logic**
```typescript
// แก้ไข: ไม่ให้ percentage columns ในโหมด percent ไปอยู่ใน isAverageCol
const isAverageCol = hasPercentSign || 
                     header.includes('KPI') ||
                     header === 'Cost_per_Message_(Meta)' ||
                     (displayMode === 'percent' && isPercentageColumn && false) // ปิด condition นี้
```

### 3. **ลบ Logic ที่ซ้ำซ้อน**
ลบส่วนที่จัดการ percentage ใน `else` block ที่ซ้ำกับ logic ใหม่:
```typescript
// ลบออก
if (displayMode === 'percent' && isPercentageColumn) {
  // logic ที่ซ้ำซ้อน
}
```

## 🎯 **ผลลัพธ์**
1. **Total Row แสดงเปอร์เซ็นต์ถูกต้อง**: เมื่อเปลี่ยนเป็นโหมด %
2. **การคำนวณถูกต้อง**: ใช้ (ยอดรวมของคอลัมน์ / ยอดรวม Total_Messages) × 100
3. **ไม่กระทบคอลัมน์อื่น**: คอลัมน์ที่ไม่ใช่ percentage ยังทำงานปกติ
4. **Consistent Behavior**: ทั้งข้อมูลแต่ละแถวและแถวรวมแสดงผลเหมือนกัน

## 🔧 **การเปลี่ยนแปลงหลัก**
1. **Priority Reordering**: percentage logic ทำงานก่อน number columns logic
2. **Logic Separation**: แยก percentage และ number formatting ให้ชัดเจน  
3. **Conflict Resolution**: ปิด logic ที่ขัดแย้งใน isAverageCol
4. **Deduplication**: ลบ logic ที่ซ้ำซ้อนออก

## 🧪 **การทดสอบ**
1. ✅ เปิดหน้า Overview และเลือกทีม
2. ✅ คลิกปุ่มสลับระหว่าง "จำนวน" และ "%"
3. ✅ ตรวจสอบแถวรวมของคอลัมน์ที่ระบุ
4. ✅ ยืนยันว่าแสดงเปอร์เซ็นต์ถูกต้อง (เช่น 15.25%)
5. ✅ ตรวจสอบว่าคอลัมน์อื่นไม่ได้รับผลกระทบ

## 📝 **คอลัมน์ที่ได้รับการแก้ไข**
- `Lost_Messages` (ยอดเสีย)
- `Page_Blocks_7Days` (เพจบล็อก 7วัน)
- `Page_Blocks_30Days` (เพจบล็อก 30วัน)
- `Silent` (ทักเงียบ)
- `Duplicate` (ทักซ้ำ)
- `Has_User` (มียูส)
- `Spam` (ก่อกวน)
- `Blocked` (บล็อก)
- `Under_18` (เด็ก)
- `Over_50` (อายุเกิน50)
- `Foreign` (ต่างชาติ)

---
**วันที่แก้ไข**: 23 ตุลาคม 2025  
**ปัญหา**: Total Row ไม่แสดงเปอร์เซ็นต์  
**สถานะ**: ✅ แก้ไขเสร็จสิ้น  
**ไฟล์ที่แก้ไข**: `src/app/overview/page.tsx` (summaryRow logic)