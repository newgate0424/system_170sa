'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Sun, Moon, LogOut, Settings, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useTheme } from 'next-themes'
import { useSidebar } from '@/contexts/sidebar-context'
import { useEffect, useState } from 'react'

interface HeaderProps {
  user: {
    username: string
    role: string
  }
  sidebarCollapsed: boolean
}

const pageNames: Record<string, string> = {
  '/dashboard': 'แดชบอร์ด',
  '/admin/users': 'จัดการผู้ใช้',
  '/admin/sessions': 'ผู้ใช้ออนไลน์',
  '/admin/activity-logs': 'บันทึกกิจกรรม',
  '/settings': 'ตั้งค่า',
}

export function Header({ user, sidebarCollapsed }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const pageName = pageNames[pathname] || 'หน้าหลัก'

  // Get breadcrumbs from pathname
  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/')
    return {
      name: pageNames[path] || segment,
      path,
    }
  })

  // Get user initials for avatar
  const userInitials = user.username.substring(0, 2).toUpperCase()

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-background">
      <div className="flex h-16 items-center px-8 gap-6">
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'เปิด Sidebar' : 'ปิด Sidebar'}
          className="hidden lg:flex items-center justify-center w-8 h-8 text-foreground/40 hover:text-primary transition-colors"
        >
          <Menu className="h-4 w-4" strokeWidth={1.5} />
        </button>

        {/* Page Title */}
        <div className="flex-1">
          <h1 className="text-base font-light text-foreground/80 tracking-wide">{pageName}</h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6">
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}
              className="text-foreground/40 hover:text-primary transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>
          )}

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 text-foreground/60 hover:text-primary transition-colors">
                <span className="hidden sm:block text-sm font-light">{user.username}</span>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-light">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-0 shadow-lg">
              <DropdownMenuLabel className="font-light text-foreground/60">บัญชีของฉัน</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-foreground/5" />
              <DropdownMenuItem onClick={() => router.push('/settings')} className="font-light hover:bg-primary/10 hover:text-primary">
                <Settings className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
                <span>ตั้งค่า</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-foreground/5" />
              <DropdownMenuItem onClick={handleLogout} className="font-light text-destructive focus:text-destructive hover:bg-destructive/10">
                <LogOut className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
                <span>ออกจากระบบ</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
