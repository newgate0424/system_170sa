'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/loading-screen'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Users, Wifi, Clock } from 'lucide-react'

interface User {
  username: string
  role: string
  teams: string[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      
      if (!data.user) {
        router.push('/login')
        return
      }
      
      setUser(data.user)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingScreen message="กำลังหลดข้อมล..." />
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">แดชบอรด</h1>
        <p className="text-muted-foreground mt-2">
          ยินดีต้อนรับ, {user.username}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">บทบาท</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.role === 'ADMIN' ? 'ผ้ดแลระบบ' : 'พนักงาน'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {user.role === 'ADMIN' ? 'สิทิเตม' : 'สิทิทั่วไป'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ทีม</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.teams.length || 'ไม่มี'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ทีมที่สังกัด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สถานะ</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">ออนไลน</div>
            <p className="text-xs text-muted-foreground mt-1">
              เชื่อมต่อแล้ว
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เสชัน</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ใช้งานอย่</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active session
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมลผ้ใช้</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">ชื่อผ้ใช้:</span>
              <span className="font-medium">{user.username}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">บทบาท:</span>
              <span className="font-medium">
                {user.role === 'ADMIN' ? 'ผ้ดแลระบบ' : 'พนักงาน'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">ทีม:</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {user.teams.length > 0 ? (
                  user.teams.map((team) => (
                    <span
                      key={team}
                      className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
                    >
                      {team}
                    </span>
                  ))
                ) : (
                  <span className="text-sm">ไม่ได้กำหนด</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {user.role === 'ADMIN' && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>เครื่องมือผ้ดแลระบบ</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              คุมีสิทิเข้าถึงเครื่องมือผ้ดแลระบบทั้งหมด:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <div>
                  <span className="font-medium">จัดการผ้ใช้</span>
                  <span className="text-sm text-muted-foreground"> - สร้าง แก้ไข ลบผ้ใช้</span>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <div>
                  <span className="font-medium">ผ้ใช้ออนไลน</span>
                  <span className="text-sm text-muted-foreground"> - ดและจัดการเสชันที่ใช้งานอย่</span>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <div>
                  <span className="font-medium">บันทึกกิจกรรม</span>
                  <span className="text-sm text-muted-foreground"> - ตรวจสอบการกระทำของผ้ใช้ทั้งหมด</span>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
