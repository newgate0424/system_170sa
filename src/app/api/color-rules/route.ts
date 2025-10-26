import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET - ดึงกฎทั้งหมด (หรือกรองตาม team/column)
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ authentication
    await requireAuth();
    
    const searchParams = request.nextUrl.searchParams
    const team = searchParams.get('team')
    const column = searchParams.get('column')

    const where: any = {
      isActive: true
    }

    if (team) where.team = team
    if (column) where.columnName = column

    const rules = await prisma.colorRule.findMany({
      where,
      orderBy: [
        { team: 'asc' },
        { columnName: 'asc' },
        { priority: 'asc' }
      ]
    })

    return NextResponse.json(rules)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
    }
    console.error('Error fetching color rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch color rules', message: error.message },
      { status: 500 }
    )
  }
}

// POST - สร้างกฎใหม่
export async function POST(request: NextRequest) {
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
      priority
    } = body

    // Validation
    if (!team || !columnName || !conditionType || !unitType || value1 === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (conditionType === 'BETWEEN' && value2 === undefined) {
      return NextResponse.json(
        { error: 'value2 is required for BETWEEN condition' },
        { status: 400 }
      )
    }

    const rule = await prisma.colorRule.create({
      data: {
        team,
        columnName,
        conditionType,
        unitType,
        value1: parseFloat(value1),
        value2: value2 !== undefined ? parseFloat(value2) : null,
        color: color || '#ef4444',
        textColor: textColor || '#ffffff',
        isBold: isBold || false,
        priority: priority || 0,
        isActive: true
      }
    })

    return NextResponse.json(rule, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
    }
    console.error('Error creating color rule:', error)
    return NextResponse.json(
      { error: 'Failed to create color rule', message: error.message },
      { status: 500 }
    )
  }
}
