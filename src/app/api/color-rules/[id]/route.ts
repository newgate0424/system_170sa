import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - อัพเดทกฎ
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    // Soft delete - แค่ปิดการใช้งาน
    const rule = await prisma.colorRule.update({
      where: { id: params.id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Rule deleted successfully', rule })
  } catch (error: any) {
    console.error('Error deleting color rule:', error)
    return NextResponse.json(
      { error: 'Failed to delete color rule', message: error.message },
      { status: 500 }
    )
  }
}
