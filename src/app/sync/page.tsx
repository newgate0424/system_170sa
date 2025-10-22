'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Database, CheckCircle, XCircle, Clock } from 'lucide-react'

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
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncSummary | null>(null)
  const [error, setError] = useState('')

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

  return (
    <div className="container mx-auto p-6 space-y-6">
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

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            วิธีใช้งาน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>1. กดปุ่ม "Sync ข้อมูล" เพื่อดึงข้อมูลจาก Google Sheets</p>
          <p>2. ระบบจะดึงข้อมูลจากทุก sheet (ทุกทีม) มาเก็บใน Database</p>
          <p>3. ข้อมูลที่มีอยู่แล้วจะถูก update, ข้อมูลใหม่จะถูกเพิ่มเข้ามา</p>
          <p>4. หลัง sync เสร็จ หน้า Overview จะดึงข้อมูลจาก Database (เร็วกว่ามาก)</p>
          <p className="text-sm text-muted-foreground mt-4">
            💡 แนะนำให้ sync ข้อมูลทุกวัน หรือเมื่อมีการอัพเดทข้อมูลใน Google Sheets
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
