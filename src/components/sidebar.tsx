'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Activity,
  Settings,
  Shield,
  UserCircle,
  Clock,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/contexts/sidebar-context'

interface SidebarProps {
  user: {
    username: string
    role: string
    teams: string[]
  }
}

interface NavItem {
  title: string
  href: string
  icon: any
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  {
    title: 'แดชบอร์ด',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'จัดการผู้ใช้',
    href: '/admin/users',
    icon: Users,
    adminOnly: true,
  },
  {
    title: 'ผู้ใช้ออนไลน์',
    href: '/admin/sessions',
    icon: UserCircle,
    adminOnly: true,
  },
  {
    title: 'บันทึกกิจกรรม',
    href: '/admin/activity-logs',
    icon: Activity,
    adminOnly: true,
  },
  {
    title: 'ตั้งค่า',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar()

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || user.role === 'ADMIN'
  )

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r">
      {/* Header */}
      <div className="flex items-center justify-center p-4">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">170sa System</span>
              <span className="text-xs text-muted-foreground">v1.0.0</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className={cn("p-4", isCollapsed && "flex justify-center")}>
        <div className={cn("flex items-center", isCollapsed ? "flex-col space-y-2" : "space-x-3")}>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <UserCircle className="w-6 h-6 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <div className="flex items-center space-x-1">
                {user.role === 'ADMIN' ? (
                  <Shield className="w-3 h-3 text-primary" />
                ) : (
                  <Clock className="w-3 h-3 text-muted-foreground" />
                )}
                <p className="text-xs text-muted-foreground">
                  {user.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}
                </p>
              </div>
            </div>
          )}
        </div>
        {!isCollapsed && user.teams.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {user.teams.slice(0, 3).map((team) => (
              <span
                key={team}
                className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
              >
                {team}
              </span>
            ))}
            {user.teams.length > 3 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                +{user.teams.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-1 overflow-y-auto border-t", isCollapsed ? "p-2" : "p-4")}>
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full',
                  isCollapsed ? 'justify-center px-0' : 'justify-start px-3',
                  isActive && 'shadow-sm'
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon className={cn('h-4 w-4', !isCollapsed && 'mr-3')} />
                {!isCollapsed && <span>{item.title}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="fixed top-0 left-0 h-screen w-64 z-50 lg:hidden">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:block fixed top-0 left-0 h-screen transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
