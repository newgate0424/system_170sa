'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCircle, Monitor, LogOut, RefreshCw } from 'lucide-react'
import { LoadingScreen } from '@/components/loading-screen'

interface Session {
  id: string
  userId: string
  user: {
    username: string
    role: string
  }
  userAgent: string | null
  ipAddress: string | null
  expiresAt: string
  createdAt: string
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setIsRefreshing(true)
      const res = await fetch('/api/admin/sessions')
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการบังคับออกจากระบบ?')) return

    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId }),
      })

      if (res.ok) {
        // ส่งสัญญาณผ่าน BroadcastChannel (ใช้งานได้ทุก tab รวมถึง tab เดียวกัน)
        const revokedSession = sessions.find(s => s.id === sessionId)
        if (revokedSession) {
          try {
            const channel = new BroadcastChannel('session_channel')
            channel.postMessage({
              type: 'SESSION_REVOKED',
              sessionId,
              userId: revokedSession.userId,
              timestamp: Date.now()
            })
            channel.close()
          } catch (err) {
            console.error('BroadcastChannel error:', err)
          }
          
          // ส่งผ่าน localStorage เป็น fallback (สำหรับ cross-tab)
          localStorage.setItem('session_revoked', JSON.stringify({
            sessionId,
            userId: revokedSession.userId,
            timestamp: Date.now()
          }))
          setTimeout(() => {
            localStorage.removeItem('session_revoked')
          }, 1000)
        }
        
        fetchSessions()
      } else {
        alert('ไม่สามารถออกจากระบบได้')
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด')
    }
  }

  const getBrowser = (userAgent: string | null) => {
    if (!userAgent) return 'ไม่ทราบ'
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'อื่นๆ'
  }

  const getDevice = (userAgent: string | null) => {
    if (!userAgent) return 'ไม่ทราบ'
    if (userAgent.includes('Mobile')) return 'มือถือ'
    if (userAgent.includes('Tablet')) return 'แท็บเล็ต'
    return 'คอมพิวเตอร์'
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    
    if (diff <= 0) return 'หมดอายุ'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days} วัน ${hours} ชั่วโมง`
    return `${hours} ชั่วโมง`
  }

  if (isLoading) {
    return <LoadingScreen message="กำลังโหลดข้อมูล..." />
  }

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium">ผู้ใช้ออนไลน์</CardTitle>
            <CardDescription className="mt-1">
              จำนวนเซสชันที่ active ในขณะนี้
            </CardDescription>
          </div>
          <UserCircle className="h-8 w-8 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{sessions.length}</div>
          <p className="text-xs text-muted-foreground mt-2">
            {sessions.filter(s => s.user.role === 'ADMIN').length} ผู้ดูแลระบบ,{' '}
            {sessions.filter(s => s.user.role === 'EMPLOYEE').length} พนักงาน
          </p>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>เซสชันที่ active</CardTitle>
              <CardDescription>รายการผู้ใช้ที่เข้าสู่ระบบอยู่</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSessions}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <UserCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">ไม่มีผู้ใช้ออนไลน์</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                ไม่มีเซสชันที่ active ในขณะนี้
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ผู้ใช้</TableHead>
                  <TableHead>บทบาท</TableHead>
                  <TableHead>อุปกรณ์</TableHead>
                  <TableHead>เบราว์เซอร์</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>เวลาเข้าสู่ระบบ</TableHead>
                  <TableHead>หมดอายุใน</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {session.user.username}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          session.user.role === 'ADMIN'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {session.user.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <span>{getDevice(session.userAgent)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getBrowser(session.userAgent)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {session.ipAddress || 'ไม่ทราบ'}
                    </TableCell>
                    <TableCell>
                      {new Date(session.createdAt).toLocaleString('th-TH')}
                    </TableCell>
                    <TableCell>
                      {getTimeRemaining(session.expiresAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        บังคับออก
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
