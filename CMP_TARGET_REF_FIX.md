# การแก้ไขปัญหา CMP Target Reference และข้อมูลหาย

## ปัญหาที่พบ
1. **Data Loss ข้อมูลหายในแท็บ Adser**: หลังจากการ auto-refresh ทุก 30 วินาที ข้อมูลในแท็บ adser หายหมด แสดงข้อความ "ไม่มีข้อมูล"
2. **ปัญหาครั้งแรก**: เจาะจงกับ ADMIN users เท่านั้น
3. **ปัญหาครั้งที่สอง**: แพร่กระจายไปยัง EMPLOYEE users ด้วย

## สาเหตุของปัญหา
- **currentTargetsRef ไม่ถูกซิงโครไนซ์**: ตัวแปร `currentTargetsRef.current.cmpTarget` ยังคงเป็น 0 แม้ว่า state `currentTargets` จะมีค่าถูกต้องแล้ว
- **การป้องกันการเรียก API**: เมื่อ `cmpTarget === 0` ระบบจะข้ามการเรียก API ทำให้ไม่มีข้อมูลถูกโหลด
- **Ref ไม่อัปเดตทันที**: useRef synchronization ในฟังก์ชัน loadTeamTargets และ updateTeamTarget ไม่ทำงานทันที

## การแก้ไข

### 1. แก้ไข loadTeamTargets Function
```typescript
const loadTeamTargets = async (team: string) => {
  // ... existing code ...
  
  if (data && !data.error) {
    const newTargets = {
      coverTarget: data.coverTarget || 0,
      cmpTarget: data.cmpTarget || 0,
      costPerTopupTarget: data.costPerTopupTarget || 0,
      lostMessagesTarget: data.lostMessagesTarget || 0,
      duplicateTarget: data.duplicateTarget || 0,
      under18Target: data.under18Target || 0,
    }
    
    console.log('📊 Setting new targets:', newTargets)
    setCurrentTargets(newTargets)
    
    // ✅ อัปเดต ref ทันที
    currentTargetsRef.current = newTargets
    console.log('✅ Team targets updated. New cmpTarget:', newTargets.cmpTarget, 'Ref cmpTarget:', currentTargetsRef.current.cmpTarget)
  }
}
```

### 2. แก้ไข updateTeamTarget Function
```typescript
const updateTeamTarget = async (field: keyof TeamTargets, value: number) => {
  // ... existing code ...
  
  // ✅ อัพเดต state และ ref ด้วยค่าที่บันทึกสำเร็จแล้ว
  setCurrentTargets(result)
  currentTargetsRef.current = result
  console.log('📊 Updated targets. New cmpTarget:', result.cmpTarget, 'Ref cmpTarget:', currentTargetsRef.current.cmpTarget)
}
```

### 3. เพิ่ม Debug Logs ใน fetchData
```typescript
const debugInfo = {
  cmpTarget: cmpTarget,
  exchangeRate: exchangeRate,
  teamFilter,
  silent,
  timestamp: new Date().toISOString(),
  currentTargetsState: currentTargets.cmpTarget, // ✅ เพิ่ม state value
  refTargets: currentTargetsRef.current // ✅ เพิ่ม ref value
}

if (cmpTarget === 0) {
  console.warn('⚠️ cmpTarget is 0, skipping API call. Debug:', {
    refValue: currentTargetsRef.current.cmpTarget,
    stateValue: currentTargets.cmpTarget,
    isLoadingTargets,
    teamFilter
  })
}
```

### 4. เพิ่ม Debug Logs ใน fetchAdserData
```typescript
console.log('🎯 fetchAdserData Debug:', {
  cmpTarget,
  currentTargetsState: currentTargets.cmpTarget,
  refTargets: currentTargetsRef.current,
  teamFilter,
  selectedAdser,
  silent,
  userRole
})
```

## ผลลัพธ์หลังการแก้ไข
- ✅ **API Call ทำงานปกติ**: `/api/team-targets` และ `/api/gateway-data` ถูกเรียกด้วย cmpTarget=2.2
- ✅ **Ref Synchronization**: currentTargetsRef ถูกอัปเดตทันทีเมื่อมีการโหลดหรือบันทึกข้อมูล
- ✅ **Debug Visibility**: มี logs ที่ชัดเจนเพื่อติดตามค่าใน state และ ref
- ✅ **ข้อมูลไม่หาย**: ข้อมูลในแท็บ adser แสดงปกติและไม่หายหลัง auto-refresh

## ไฟล์ที่เกี่ยวข้อง
- `src/app/overview/page.tsx`: ไฟล์หลักที่มีการแก้ไข
- Functions ที่แก้ไข: `loadTeamTargets`, `updateTeamTarget`, `fetchData`, `fetchAdserData`

## วันที่แก้ไข
$(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

## สถานะ
✅ **แก้ไขสำเร็จ** - ข้อมูลไม่หายแล้วและ auto-refresh ทำงานปกติ