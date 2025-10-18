'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LoadingScreen } from '@/components/loading-screen'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Users, Activity, Settings, UserCircle, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'

interface User {
  username: string
  role: string
  teams: string[]
}

export default function DashboardPage() {
  const router = useRouter()
  const { t } = useLanguage()
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
    return <LoadingScreen message={t('common.loading')} />
  }

  if (!user) {
    return null
  }

  const menuItems = [
    {
      title: t('nav.users'),
      description: 'จัดการผู้ใช้งานและสิทธิ์การเข้าถึง',
      href: '/admin/users',
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      hoverColor: 'hover:bg-blue-100 dark:hover:bg-blue-900',
      adminOnly: true,
    },
    {
      title: t('nav.sessions'),
      description: 'ดูและจัดการเซสชันผู้ใช้ที่ออนไลน์',
      href: '/admin/sessions',
      icon: UserCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
      hoverColor: 'hover:bg-green-100 dark:hover:bg-green-900',
      adminOnly: true,
    },
    {
      title: t('nav.activity'),
      description: 'ตรวจสอบบันทึกกิจกรรมของผู้ใช้',
      href: '/admin/activity-logs',
      icon: Activity,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      hoverColor: 'hover:bg-purple-100 dark:hover:bg-purple-900',
      adminOnly: true,
    },
    {
      title: t('nav.settings'),
      description: 'ปรับแต่งธีม สี และการตั้งค่าส่วนตัว',
      href: '/settings',
      icon: Settings,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      hoverColor: 'hover:bg-orange-100 dark:hover:bg-orange-900',
      adminOnly: false,
    },
  ]

  const filteredMenuItems = menuItems.filter(
    (item) => !item.adminOnly || user.role === 'ADMIN'
  )

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-light tracking-tight text-foreground">
          {t('nav.dashboard')}
        </h1>
        <p className="text-lg font-light text-foreground/60">
          ยินดีต้อนรับสู่หน้า Dashboard หลักของระบบ คุณสามารถเข้าถึงข้อมูลและฟีเจอร์ต่าง ๆ ได้จากเมนูด้านข้าง
        </p>
      </div>

      {/* Menu Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <Card 
                className={cn(
                  "transition-all duration-200 border-0 shadow-sm",
                  item.hoverColor,
                  item.bgColor
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-3 rounded-lg bg-background/50",
                        item.color
                      )}>
                        <Icon className="h-6 w-6" strokeWidth={1.5} />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-light">
                          {item.title}
                        </CardTitle>
                      </div>
                    </div>
                    <ArrowRight className={cn("h-5 w-5", item.color)} strokeWidth={1.5} />
                  </div>
                  <CardDescription className="text-foreground/60 font-light mt-3">
                    {item.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Admin Info */}
      {user.role === 'ADMIN' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-light">
              <Shield className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <span>เครื่องมือผู้ดูแลระบบ</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/60 font-light mb-4">
              คุณมีสิทธิ์เข้าถึงเครื่องมือผู้ดูแลระบบทั้งหมด สามารถจัดการผู้ใช้ ตรวจสอบเซสชัน และดูบันทึกกิจกรรมได้
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
