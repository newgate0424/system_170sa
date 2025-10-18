import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  verifyPassword,
  createSession,
  checkLoginAttempts,
  recordLoginAttempt,
  logActivity,
  getClientIP,
} from '@/lib/auth'

const loginSchema = z.object({
  username: z.string().min(3, 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร').max(50),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = loginSchema.parse(body)

    const ipAddress = getClientIP(request.headers)
    const userAgent = request.headers.get('user-agent') || undefined

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user) {
      // Record failed attempt
      await recordLoginAttempt(username, false, undefined, ipAddress, userAgent)
      
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // Check if user is locked
    if (user.isLocked) {
      return NextResponse.json(
        { error: 'บัญชีนี้ถูกล็อค กรุณาติดต่อผู้ดูแลระบบ' },
        { status: 403 }
      )
    }

    // Check login attempts
    const tooManyAttempts = await checkLoginAttempts(user.id)
    if (tooManyAttempts) {
      return NextResponse.json(
        { error: 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณาลองใหม่ในอีก 10 นาที' },
        { status: 429 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    
    if (!isValidPassword) {
      // Record failed attempt
      await recordLoginAttempt(username, false, user.id, ipAddress, userAgent)
      
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // Record successful attempt
    await recordLoginAttempt(username, true, user.id, ipAddress, userAgent)

    // Create session (this will delete any existing sessions)
    await createSession(user.id, userAgent, ipAddress)

    // Log activity
    await logActivity(
      user.id,
      'LOGIN',
      'เข้าสู่ระบบสำเร็จ',
      { username: user.username },
      ipAddress,
      userAgent
    )

    // Return user data (without password)
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        teams: user.teams,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    )
  }
}
