'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Database, CheckCircle, XCircle, Clock } from 'lucide-react'
import { LoadingScreen } from '@/components/loading-screen'

interface SyncResult {
  success: boolean
  sheet?: string
  synced?: number
  errors?: number
  error?: string
}

interface SyncSummary {
  totalSheets: number
  successCount: number
  failedCount: number
  totalSynced: number
  totalErrors: number
  details: SyncResult[]
  syncedAt: string
}

export default function SyncPage() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncSummary | null>(null)
  const [error, setError] = useState('')
  
  // ตรวจสอบ authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        
        if (!data.user) {
          router.push('/login')
          return
        }
        
        setIsCheckingAuth(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [router])

  const handleSync = async () => {
    setIsSyncing(true)
    setError('')
    setSyncResult(null)

    try {
      const response = await fetch('/api/sync-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // sync ทั้งหมด
      })

      const result = await response.json()

      if (response.ok) {
        setSyncResult(result)
      } else {
        setError(result.error || 'Failed to sync')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSyncing(false)
    }
  }

  if (isCheckingAuth) {
    return <LoadingScreen message="กำลังตรวจสอบสิทธิ์..." />
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sync Gateway Data</h1>
          <p className="text-muted-foreground mt-2">
            ดึงข้อมูลจาก Google Sheets มาเก็บใน Database
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          size="lg"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'กำลัง Sync...' : 'Sync ข้อมูล'}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center text-destructive">
              <XCircle className="w-5 h-5 mr-2" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {syncResult && (
        <div className="space-y-4">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Sync สำเร็จ!
              </CardTitle>
              <CardDescription>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 mr-2" />
                  {new Date(syncResult.syncedAt).toLocaleString('th-TH')}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-3xl font-bold text-primary">
                    {syncResult.totalSheets}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Sheets ทั้งหมด
                  </div>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {syncResult.successCount}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    สำเร็จ
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {syncResult.totalSynced}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Records
                  </div>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">
                    {syncResult.failedCount}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    ล้มเหลว
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>รายละเอียด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {syncResult.details.map((detail, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center">
                      {detail.success ? (
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2 text-red-500" />
                      )}
                      <span className="font-medium">{detail.sheet}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {detail.success ? (
                        <>
                          <span className="text-green-600">
                            ✓ {detail.synced} records
                          </span>
                          {detail.errors! > 0 && (
                            <span className="text-red-600">
                              ✗ {detail.errors} errors
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-red-600">{detail.error}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
