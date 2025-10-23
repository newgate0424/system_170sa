# การแก้ไขสีแถวรวมสำหรับคอลัมน์ ยอดเสีย, ทักซ้ำ, เด็ก

## ปัญหาที่พบ
แถว "รวม" ในคอลัมน์ ยอดเสีย, ทักซ้ำ, เด็ก ไม่แสดงสีตามเป้าหมายที่ตั้งไว้ของทีม

## ข้อกำหนดใหม่
การแสดงสีต้องคำนวณจากเปอร์เซ็นต์ตามเป้าหมายของทีม:
- **ยอดเสีย**: คำนวณจากค่า เป้ายอดเสีย (%)  
- **ทักซ้ำ**: คำนวณจากค่า เป้าทักซ้ำ (%)
- **เด็ก**: คำนวณจากค่า เป้าเด็ก (%)

### กฎการแสดงสี:
- **≤100%** → 🟢 สีเขียว (ผลงานอยู่ในเป้า)
- **>100%** → 🟡 สีแดง (เกินเป้าหมาย)
- **>120%** → 🔴 สีแดงเข้ม (เกินเป้าหมายมาก)

## สาเหตุของปัญหา
แถวรวมใช้ `getSummaryCellStyle()` ที่เรียก `getQualityMetricsStyle()` แต่:
1. ข้อมูลในแถวรวมเป็น string เปอร์เซ็นต์แล้ว (เช่น "5.25%")
2. `getQualityMetricsStyle()` ถูกออกแบบมาสำหรับข้อมูลดิบ
3. ต้องแยกการคำนวณระหว่างแถวปกติกับแถวรวม

## การแก้ไข

### 1. ปรับ `getQualityMetricsStyle()` ให้รองรับแถวรวม:
```typescript
const getQualityMetricsStyle = (row: SheetData, header: string, isSummaryRow: boolean = false) => {
  // ...baseStyle setup...
  
  let actualValue = 0
  
  if (isSummaryRow) {
    // สำหรับแถวรวม: ข้อมูลจาก summaryRow เป็น string เปอร์เซ็นต์แล้ว (เช่น "5.25%")
    const valueStr = String(row[header] || '0').replace(/[%,]/g, '')
    actualValue = parseFloat(valueStr)
  } else {
    // สำหรับแถวปกติ: คำนวณเปอร์เซ็นต์จากข้อมูลดิบ
    const totalMessages = parseFloat(String(row['Total_Messages'] || '0').replace(/,/g, ''))
    // ... คำนวณจาก raw data ...
  }
  
  // ... logic การกำหนดสีเหมือนเดิม ...
}
```

### 2. การเรียกใช้ใน `getSummaryCellStyle()`:
```typescript
// ถ้าเป็นคอลัมน์ Lost_Messages, Duplicate, Under_18 ในแถวรวม
if (header === 'Lost_Messages' || header === 'Duplicate' || header === 'Under_18') {
  const summaryRowData: SheetData = {}
  displayHeaders.forEach(h => {
    summaryRowData[h] = summaryRow[h] || ''
  })
  return getQualityMetricsStyle(summaryRowData, header, true) // true = summary row
}
```

## การทำงาน

### ตัวอย่างการคำนวณแถวรวม:
- **ข้อมูลในแถวรวม**: "6.25%" (ยอดเสียเฉลี่ย)
- **เป้ายอดเสีย**: 5%
- **เปอร์เซ็นต์ของเป้า**: (6.25/5) × 100 = 125%
- **ผลลัพธ์**: สีแดงเข้ม (>120%)

### Debug Logs แยกตามประเภท:
```javascript
// แถวรวม
console.log('📊 Lost_Messages Color Calculation (Summary):', {
  actualValue: '6.25',      // จาก summaryRow string
  targetValue: 5,
  percentageOfTarget: '125.00%',
  colorRule: 'DARK_RED'
})

// แถวปกติ  
console.log('📊 Lost_Messages Color Calculation (Regular):', {
  actualValue: '6.00',      // คำนวณจาก raw data
  targetValue: 5,
  percentageOfTarget: '120.00%',
  colorRule: 'DARK_RED'
})
```

## ผลลัพธ์หลังการแก้ไข
- ✅ **แถวรวมแสดงสีถูกต้อง**: ใช้ข้อมูลเปอร์เซ็นต์ที่คำนวณแล้วจาก summaryRow
- ✅ **แถวปกติทำงานปกติ**: ยังคำนวณจากข้อมูลดิบ
- ✅ **ใช้เป้าหมายจริงของทีม**: ไม่ใช่ค่า default
- ✅ **คำนวณตรงตามข้อกำหนด**: เปอร์เซ็นต์ของเป้าหมาย
- ✅ **Debug logs ครบถ้วน**: แยกระหว่าง Summary และ Regular

## การไหลของข้อมูล
```
1. แถวปกติ → Raw Data → คำนวณ % → เปรียบเทียบเป้า → สี
2. แถวรวม → summaryRow["5.25%"] → parse 5.25 → เปรียบเทียบเป้า → สี
```

## ไฟล์ที่แก้ไข
- `src/app/overview/page.tsx`: ฟังก์ชัน `getQualityMetricsStyle`

## วันที่แก้ไข
$(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

## สถานะ
✅ **แก้ไขสำเร็จ** - แถวรวมแสดงสีตามเปอร์เซ็นต์ของเป้าหมายที่ตั้งไว้ (เฉพาะแถวรวม)