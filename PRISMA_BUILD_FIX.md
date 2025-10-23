# การแก้ไข TypeScript Build Error

## ปัญหาที่พบ
```
Type error: Object literal may only specify known properties, and 'lostMessagesTarget' does not exist in type '(Without<TeamTargetsCreateInput, TeamTargetsUncheckedCreateInput> & TeamTargetsUncheckedCreateInput) | (Without<...> & TeamTargetsCreateInput)'.

./src/app/api/team-targets/route.ts:28:11
```

## สาเหตุของปัญหา
- **Prisma Client ไม่ได้อัปเดต**: หลังจากเพิ่ม field `lostMessagesTarget` ใน Prisma schema แต่ไม่ได้ generate client ใหม่
- **TypeScript types ล้าสมัย**: TypeScript compiler ยังใช้ types เก่าที่ไม่มี field ใหม่

## สถานะใน Schema
```prisma
model TeamTargets {
  id                  String   @id @default(cuid())
  team                String   @unique // ชื่อทีม
  coverTarget         Float    @default(1.0) // เป้ายอด Cover ($)
  cpmTarget           Float    @default(15) // เป้ายอด CPM
  costPerTopupTarget  Float    @default(100) // เป้าต้นทุนเติม
  lostMessagesTarget  Float    @default(0) // เป้ายอดเสีย ✅ มีอยู่แล้ว
  duplicateTarget     Float    @default(0) // เป้าทักซ้ำ
  under18Target       Float    @default(0) // เป้าเด็ก
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

## การแก้ไข
```bash
# รัน command นี้เพื่ออัปเดต Prisma Client และ TypeScript types
npx prisma generate
```

## ผลลัพธ์หลังการแก้ไข
- ✅ **Prisma Client อัปเดตสำเร็จ**: Generated Prisma Client (v5.22.0)
- ✅ **TypeScript types อัปเดต**: รู้จัก field `lostMessagesTarget` แล้ว
- ✅ **Build สำเร็จ**: ✓ Compiled successfully
- ✅ **Type checking ผ่าน**: ✓ Linting and checking validity of types

## Build Statistics
```
Route (app)                              Size     First Load JS
├ ƒ /overview                            16.8 kB         138 kB
├ ƒ /api/team-targets                    0 B                0 B
└ ... (27 routes total)
```

## คำแนะนำสำหรับอนาคต
1. **หลังแก้ไข Prisma Schema**: ควรรัน `npx prisma generate` ทันที
2. **ก่อน Build**: ตรวจสอบว่า Prisma Client อัปเดตแล้ว
3. **หลัง Migration**: รัน generate เสมอเพื่อซิงค์ types

## วันที่แก้ไข
$(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

## สถานะ
✅ **แก้ไขสำเร็จ** - Build ผ่านและระบบพร้อมใช้งาน