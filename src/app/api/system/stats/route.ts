import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()

    // นับจำนวน users ทั้งหมด
    const totalUsers = await prisma.user.count()

    // นับจำนวน active sessions (ยังไม่หมดอายุ)
    const activeSessions = await prisma.session.count({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    // นับจำนวน users แบ่งตาม role
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    })

    const employeeCount = await prisma.user.count({
      where: { role: 'EMPLOYEE' },
    })

    // นับจำนวน locked users
    const lockedUsers = await prisma.user.count({
      where: { isLocked: true },
    })

    // ดึง users ที่กำลังออนไลน์
    const onlineUsers = await prisma.session.findMany({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      stats: {
        totalUsers,
        activeSessions,
        adminCount,
        employeeCount,
        lockedUsers,
        onlineUsers: onlineUsers.map((session: any) => ({
          username: session.user.username,
          role: session.user.role,
          ipAddress: session.ipAddress,
          loginAt: session.createdAt,
          expiresAt: session.expiresAt,
        })),
      },
    })
  } catch (error) {
    console.error('Failed to get system stats:', error)
    return NextResponse.json(
      { error: 'Failed to get system stats' },
      { status: 500 }
    )
  }
}
