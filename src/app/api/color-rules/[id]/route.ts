import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// PATCH - อัพเดทกฎบางส่วน (partial update)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบ authentication
    await requireAuth();
    
    const body = await request.json()
    const updates: any = {}

    // Only update fields that are provided
    if (body.team !== undefined) updates.team = body.team
    if (body.columnName !== undefined) updates.columnName = body.columnName
    if (body.conditionType !== undefined) updates.conditionType = body.conditionType
    if (body.unitType !== undefined) updates.unitType = body.unitType
    if (body.value1 !== undefined) updates.value1 = parseFloat(body.value1)
    if (body.value2 !== undefined) updates.value2 = body.value2 !== null ? parseFloat(body.value2) : null
    if (body.color !== undefined) updates.color = body.color
    if (body.textColor !== undefined) updates.textColor = body.textColor
    if (body.isBold !== undefined) updates.isBold = body.isBold
    if (body.priority !== undefined) updates.priority = body.priority
    if (body.isActive !== undefined) updates.isActive = body.isActive

    const rule = await prisma.colorRule.update({
      where: { id: params.id },
      data: updates
    })

    return NextResponse.json(rule)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
    }
    console.error('Error patching color rule:', error)
    return NextResponse.json(
      { error: 'Failed to patch color rule', message: error.message },
      { status: 500 }
    )
  }
}

// PUT - อัพเดทกฎ
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบ authentication
    await requireAuth();
    
    const body = await request.json()
    const {
      team,
      columnName,
      conditionType,
      unitType,
      value1,
      value2,
      color,
      textColor,
      isBold,
      priority,
      isActive
    } = body

    const rule = await prisma.colorRule.update({
      where: { id: params.id },
      data: {
        ...(team !== undefined && { team }),
        ...(columnName !== undefined && { columnName }),
        ...(conditionType !== undefined && { conditionType }),
        ...(unitType !== undefined && { unitType }),
        ...(value1 !== undefined && { value1: parseFloat(value1) }),
        ...(value2 !== undefined && { value2: value2 !== null ? parseFloat(value2) : null }),
        ...(color !== undefined && { color }),
        ...(textColor !== undefined && { textColor }),
        ...(isBold !== undefined && { isBold }),
        ...(priority !== undefined && { priority }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(rule)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
    }
    console.error('Error updating color rule:', error)
    return NextResponse.json(
      { error: 'Failed to update color rule', message: error.message },
      { status: 500 }
    )
  }
}

// DELETE - ลบกฎ (soft delete - ตั้ง isActive = false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบ authentication
    await requireAuth();
    
    // Soft delete - แค่ปิดการใช้งาน
    const rule = await prisma.colorRule.update({
      where: { id: params.id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Rule deleted successfully', rule })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
    }
    console.error('Error deleting color rule:', error)
    return NextResponse.json(
      { error: 'Failed to delete color rule', message: error.message },
      { status: 500 }
    )
  }
}
