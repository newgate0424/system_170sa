import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: ดูสถานะการ sync ล่าสุด
export async function GET() {
  try {
    // นับจำนวนข้อมูลแต่ละทีม
    const stats = await prisma.gatewayData.groupBy({
      by: ['sheetName'],
      _count: true,
      _max: {
        syncedAt: true,
      },
    })

    const totalRecords = stats.reduce((sum: number, s: any) => sum + s._count, 0)

    return NextResponse.json({
      success: true,
      stats,
      totalRecords,
      lastSync: stats.length > 0 ? stats[0]._max.syncedAt : null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
