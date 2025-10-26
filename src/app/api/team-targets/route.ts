import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - ดึงเป้าหมายของทีม
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ authentication
    await requireAuth();
    
    const searchParams = request.nextUrl.searchParams
    const team = searchParams.get('team')

    if (!team) {
      return NextResponse.json({ error: 'Team is required' }, { status: 400 })
    }

    let teamTargets = await prisma.teamTargets.findUnique({
      where: { team }
    })

    // ถ้าไม่มีข้อมูล ให้สร้างค่า default
    if (!teamTargets) {
      teamTargets = await prisma.teamTargets.create({
        data: {
          team,
          coverTarget: 1.0,
          cpmTarget: 15,
          costPerTopupTarget: 100,
          lostMessagesTarget: 0,
          duplicateTarget: 0,
          under18Target: 0,
        }
      })
    }

    return NextResponse.json(teamTargets)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
    }
    console.error('Error fetching team targets:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch team targets' },
      { status: 500 }
    )
  }
}

// POST - บันทึกเป้าหมายของทีม
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ authentication
    await requireAuth();
    
    const body = await request.json()
    const { 
      team, 
      coverTarget, 
      cpmTarget, 
      costPerTopupTarget, 
      lostMessagesTarget,
      duplicateTarget,
      under18Target,
    } = body

    if (!team) {
      return NextResponse.json({ error: 'Team is required' }, { status: 400 })
    }

    // ใช้ upsert เพื่ออัปเดตหรือสร้างใหม่
    const teamTargets = await prisma.teamTargets.upsert({
      where: { team },
      update: {
        coverTarget: coverTarget ?? 1.0,
        cpmTarget: cpmTarget ?? 15,
        costPerTopupTarget: costPerTopupTarget ?? 100,
        lostMessagesTarget: lostMessagesTarget ?? 0,
        duplicateTarget: duplicateTarget ?? 0,
        under18Target: under18Target ?? 0,
      },
      create: {
        team,
        coverTarget: coverTarget ?? 1.0,
        cpmTarget: cpmTarget ?? 15,
        costPerTopupTarget: costPerTopupTarget ?? 100,
        lostMessagesTarget: lostMessagesTarget ?? 0,
        duplicateTarget: duplicateTarget ?? 0,
        under18Target: under18Target ?? 0,
      }
    })

    return NextResponse.json(teamTargets)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
    }
    console.error('Error saving team targets:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save team targets' },
      { status: 500 }
    )
  }
}
