# แก้ไขการแสดงผลเป้าหมายให้แสดงค่าที่แน่นอน

## วันที่: 23 ตุลาคม 2025

### ปัญหาที่พบ
- การ์ดเป้าหมายที่แสดงให้พนักงานดูมีการปัดเศษ เช่น 1.49 แสดงเป็น 1.50
- ผู้ใช้ต้องการเห็นค่าที่แน่นอนเหมือนกับที่แอดมินกรอกเข้าไป

### การแก้ไข
แก้ไขในไฟล์: `src/app/overview/page.tsx`

#### 1. เป้ายอด Cover ($)
```typescript
// เดิม
<div className="text-xs">{currentTargets.coverTarget.toFixed(2)}</div>

// แก้ไขเป็น
<div className="text-xs">{currentTargets.coverTarget}</div>
```

#### 2. เป้ายอด CPM
```typescript
// เดิม
<div className="text-xs">{currentTargets.cpmTarget.toFixed(2)}</div>

// แก้ไขเป็น
<div className="text-xs">{currentTargets.cpmTarget}</div>
```

#### 3. เป้าต้นทุนเติม
```typescript
// เดิม
<div className="text-xs">{currentTargets.costPerTopupTarget.toFixed(2)}</div>

// แก้ไขเป็น
<div className="text-xs">{currentTargets.costPerTopupTarget}</div>
```

#### 4. เป้ายอดเสีย (%)
```typescript
// เดิม
<div className="text-xs">{currentTargets.lostMessagesTarget.toFixed(1)}%</div>

// แก้ไขเป็น
<div className="text-xs">{currentTargets.lostMessagesTarget}%</div>
```

#### 5. เป้าทักซ้ำ (%)
```typescript
// เดิม
<div className="text-xs">{currentTargets.duplicateTarget.toFixed(1)}%</div>

// แก้ไขเป็น
<div className="text-xs">{currentTargets.duplicateTarget}%</div>
```

#### 6. เป้าเด็ก (%)
```typescript
// เดิม
<div className="text-xs">{currentTargets.under18Target.toFixed(1)}%</div>

// แก้ไขเป็น
<div className="text-xs">{currentTargets.under18Target}%</div>
```

#### 7. Rate $ / ฿
```typescript
// เดิม
1$ = ฿{exchangeRate.toFixed(2)}

// แก้ไขเป็น
1$ = ฿{exchangeRate}
```

### ผลลัพธ์
- พนักงานจะเห็นค่าเป้าหมายที่แน่นอนเหมือนกับที่แอดมินกรอกเข้าไป
- ตัวเลขจะไม่ถูกปัดเศษแล้ว เช่น 1.49 จะแสดงเป็น 1.49 (ไม่ใช่ 1.50)
- การแสดงผลสำหรับแอดมินยังคงเหมือนเดิม (ยังสามารถแก้ไขได้)

### สถานะ
✅ แก้ไขเสร็จสิ้น
✅ Build สำเร็จ
🔄 รอการทดสอบและยืนยันจากผู้ใช้

### การทดสอบที่แนะนำ
1. Login เป็น EMPLOYEE
2. เลือกทีม
3. ตรวจสอบว่าค่าเป้าหมายแสดงตรงกับที่แอดมินตั้งไว้
4. ตรวจสอบทุกประเภทเป้าหมาย (Cover, CPM, ต้นทุนเติม, ยอดเสีย, ทักซ้ำ, เด็ก)