'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, FileSpreadsheet, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { LoadingScreen } from '@/components/loading-screen'

interface SheetData {
  [key: string]: string
}

const COLUMN_ORDER = [
  'Date',
  'KPI_Budget_Used',
  'Planned_Messages',
  'Total_Messages',
  'Messages(Meta)',
  'Lost_Messages',
  'Net_Messages',
  'Planned_Spend/Day',
  'Spend',
  'CPM',
  'Cost_per_Message_(Meta)',
  'Top-up',
  'Messages_per_Top_up',
  'Quality_Messages_per_Top_up',
  'Cost_per_Top_up_Pure',
  'New Player Revenue (THB)',
  'USD_Cover',
  'Page_Blocks_7Days',
  'Page_Blocks_30Days',
  'Silent',
  'Duplicate',
  'Has_User',
  'Spam',
  'Blocked',
  'Under_18',
  'Over_50',
  'Foreign',
]

const COLUMN_TRANSLATIONS: { [key: string]: { th: string; en: string } } = {
  'Date': { th: 'วันที่', en: 'Date' },
  'วันที่': { th: 'วันที่', en: 'Date' },
  'KPI_Budget_Used': { th: '%KPI/Budget', en: 'KPI_Budget_Used' },
  'Planned_Messages': { th: 'แผนทัก', en: 'Planned_Messages' },
  'Total_Messages': { th: 'ยอดทัก', en: 'Total_Messages' },
  'Messages(Meta)': { th: 'ยอดทัก(Meta)', en: 'Messages(Meta)' },
  'Lost_Messages': { th: 'ยอดเสีย', en: 'Lost_Messages' },
  'Net_Messages': { th: 'ทักบริสุทธิ์', en: 'Net_Messages' },
  'Planned_Spend/Day': { th: 'แผนงบ', en: 'Planned_Spend/Day' },
  'Spend': { th: 'ค่าใช้จ่าย', en: 'Spend' },
  'CPM': { th: 'CPM', en: 'CPM' },
  'Cost_per_Message_(Meta)': { th: 'ทุนทัก(Meta)', en: 'Cost_per_Message_(Meta)' },
  'Top-up': { th: 'เติม', en: 'Top-up' },
  'Messages_per_Top_up': { th: 'ทัก/เติม', en: 'Messages_per_Top_up' },
  'Quality_Messages_per_Top_up': { th: 'ทักบริสุทธิ์ /เติม', en: 'Quality_Messages_per_Top_up' },
  'Cost_per_Top-up': { th: 'ต้นทุน/เติม', en: 'Cost_per_Top-up' },
  'Cost_per_Top_up_Pure': { th: 'ทุน/เติม', en: 'Cost_per_Top_up_Pure' },
  'New Player Revenue (THB)': { th: 'ยอดเล่นใหม่(฿)', en: 'New Player Revenue (THB)' },
  'USD_Cover': { th: '1$/Cover', en: 'USD_Cover' },
  'Page_Blocks_7Days': { th: 'เพจบล็อก 7วัน', en: 'Page_Blocks_7Days' },
  'Page_Blocks_30Days': { th: 'เพจบล็อก 30วัน', en: 'Page_Blocks_30Days' },
  'Silent': { th: 'ทักเงียบ', en: 'Silent' },
  'Duplicate': { th: 'ทักซ้ำ', en: 'Duplicate' },
  'Has_User': { th: 'มียูส', en: 'Has_User' },
  'Under_18': { th: 'เด็ก', en: 'Under_18' },
  'Spam': { th: 'ก่อกวน', en: 'Spam' },
  'Blocked': { th: 'บล็อก', en: 'Blocked' },
  'Over_50': { th: 'อายุเกิน50', en: 'Over_50' },
  'Foreign': { th: 'ต่างชาติ', en: 'Foreign' },
}

const TEAMS = [
  'สาวอ้อย',
  'อลิน',
  'อัญญาC',
  'อัญญาD',
  'สเปชบาร์',
  'บาล้าน',
  'ฟุตบอลแอร์เรีย',
  'ฟุตบอลแอร์เรีย(ฮารุ)',
]

const TEAM_MEMBERS: { [key: string]: string[] } = {
  'สาวอ้อย': ['Boogey', 'Bubble'],
  'อลิน': ['Lucifer', 'Risa'],
  'อัญญาC': ['Shazam', 'Vivien'],
  'อัญญาD': ['Sim', 'Joanne'],
  'สเปชบาร์': ['Cookie', 'Piea'],
  'บาล้าน': ['Irene', 'Newgate'],
  'ฟุตบอลแอร์เรีย(ฮารุ)': ['Minho', 'Bailu'],
  'ฟุตบอลแอร์เรีย': ['Thomas', 'IU', 'Nolan'],
}

const MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - 3 + i))

const getCurrentMonth = () => {
  const monthIndex = new Date().getMonth()
  return MONTHS[monthIndex]
}

export default function ContentPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<SheetData[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState<'ADMIN' | 'EMPLOYEE'>('EMPLOYEE')
  
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
        
        setUserRole(data.user.role || 'EMPLOYEE')
        setIsCheckingAuth(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [router])

  const [teamFilter, setTeamFilter] = useState('สาวอ้อย')
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth())
  const [yearFilter, setYearFilter] = useState(String(currentYear))
  const [displayMode, setDisplayMode] = useState<'number' | 'percent'>('percent')
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date())
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  const headerScrollRef = useRef<HTMLDivElement>(null)
  const bodyScrollRef = useRef<HTMLDivElement>(null)
  const [scrollbarWidth, setScrollbarWidth] = useState(0)
  
  useEffect(() => {
    const calculateScrollbarWidth = () => {
      const outer = document.createElement('div')
      outer.style.visibility = 'hidden'
      outer.style.overflow = 'scroll'
      document.body.appendChild(outer)
      const inner = document.createElement('div')
      outer.appendChild(inner)
      const scrollbarWidth = outer.offsetWidth - inner.offsetWidth
      outer.parentNode?.removeChild(outer)
      setScrollbarWidth(scrollbarWidth)
    }
    calculateScrollbarWidth()
  }, [])

  const translateHeader = (header: string): string => {
    const translation = COLUMN_TRANSLATIONS[header]
    if (!translation) return header
    return language === 'th' ? translation.th : translation.en
  }

  // Placeholder data fetch
  const fetchData = async () => {
    setIsLoading(true)
    setError('')
    try {
      // TODO: เชื่อมต่อกับ API ที่เหมาะสม
      await new Promise(resolve => setTimeout(resolve, 500))
      setData([])
      setHeaders(COLUMN_ORDER)
      setLastRefreshTime(new Date())
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isCheckingAuth) {
      fetchData()
    }
  }, [teamFilter, monthFilter, yearFilter, isCheckingAuth])

  const displayHeaders = COLUMN_ORDER.filter(col => {
    if (['Team', 'team', 'Adser', 'adser'].includes(col)) {
      return false
    }
    if (headers.length === 0) {
      return true
    }
    return headers.includes(col)
  })

  const columnWidths: { [key: string]: number } = {
    'Date': 90,
    'KPI_Budget_Used': 75,
    'Planned_Messages': 75,
    'Total_Messages': 75,
    'Messages(Meta)': 75,
    'Lost_Messages': 75,
    'Net_Messages': 85,
    'Planned_Spend/Day': 85,
    'Spend': 85,
    'CPM': 75,
    'Cost_per_Message_(Meta)': 75,
    'Top-up': 75,
    'Messages_per_Top_up': 80,
    'Quality_Messages_per_Top_up': 90,
    'Cost_per_Top_up_Pure': 80,
    'New Player Revenue (THB)': 120,
    'USD_Cover': 90,
    'Page_Blocks_7Days': 75,
    'Page_Blocks_30Days': 75,
    'Silent': 75,
    'Duplicate': 75,
    'Has_User': 75,
    'Spam': 75,
    'Blocked': 75,
    'Under_18': 75,
    'Over_50': 75,
    'Foreign': 75,
  }

  const getColumnWidth = (header: string): number => {
    return columnWidths[header] || 150
  }

  const isRightAlign = (header: string) => {
    const rightAlignColumns = ['Planned_Spend/Day', 'Spend', 'New Player Revenue (THB)']
    return rightAlignColumns.includes(header)
  }

  const isZoneStart = (header: string): boolean => {
    const zoneStarts = [
      'Date',
      'KPI_Budget_Used',
      'Planned_Spend/Day',
      'CPM',
      'New Player Revenue (THB)',
      'Page_Blocks_7Days'
    ]
    return zoneStarts.includes(header)
  }

  if (isCheckingAuth) {
    return <LoadingScreen message="กำลังตรวจสอบสิทธิ์..." />
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pl-1 pr-4 py-2">
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4" style={{ alignItems: 'start' }}>
        {/* Sidebar */}
        <div 
          className={`
            ${isSidebarCollapsed ? 'hidden' : 'lg:col-span-1'} 
            transition-all duration-500 ease-in-out
          `}
        >
          {!isSidebarCollapsed && (
            <Card className="animate-in fade-in slide-in-from-left-5 duration-300 relative">
              <CardHeader>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Year & Month */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="filter-year" className="text-sm font-medium">
                      ปี
                    </Label>
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                      <SelectTrigger id="filter-year" className="h-9">
                        <SelectValue placeholder="เลือกปี..." />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filter-month" className="text-sm font-medium">
                      เดือน
                    </Label>
                    <Select value={monthFilter} onValueChange={setMonthFilter}>
                      <SelectTrigger id="filter-month" className="h-9">
                        <SelectValue placeholder="เลือกเดือน..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((month) => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Display Mode & Team Filter */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="filter-display" className="text-sm font-medium">
                      รูปแบบ
                    </Label>
                    <Select value={displayMode} onValueChange={(v) => setDisplayMode(v as 'number' | 'percent')}>
                      <SelectTrigger id="filter-display" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">ตัวเลข</SelectItem>
                        <SelectItem value="percent">เปอร์เซ็นต์</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filter-team" className="text-sm font-medium">
                      ทีม
                    </Label>
                    <Select value={teamFilter} onValueChange={setTeamFilter}>
                      <SelectTrigger id="filter-team" className="h-9">
                        <SelectValue placeholder="เลือกทีม..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAMS.map((team) => (
                          <SelectItem key={team} value={team}>
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Refresh Button */}
                <Button 
                  onClick={() => fetchData()} 
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  รีเฟรช
                </Button>

                {/* Last Update */}
                <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                  อัพเดทล่าสุด: {lastRefreshTime.toLocaleTimeString('th-TH')}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className={`${isSidebarCollapsed ? 'lg:col-span-6' : 'lg:col-span-5'} transition-all duration-500`}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>คอนเทนต์</CardTitle>
                  <CardDescription>จัดการและวิเคราะห์ข้อมูลคอนเทนต์</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {isSidebarCollapsed ? 'แสดงตัวกรอง' : 'ซ่อนตัวกรอง'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center py-8 text-destructive">
                  <p>{error}</p>
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-16">
                  <FileSpreadsheet className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-lg mb-2">ยังไม่มีข้อมูล</p>
                  <p className="text-sm text-muted-foreground">
                    หน้านี้อยู่ระหว่างการพัฒนา กรุณารอการอัพเดท
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Table Header */}
                  <div 
                    ref={headerScrollRef}
                    className="overflow-x-auto border-b"
                    style={{ 
                      overflowY: 'hidden',
                      paddingRight: `${scrollbarWidth}px`
                    }}
                  >
                    <div className="flex min-w-max bg-muted/50">
                      {displayHeaders.map((header, index) => (
                        <div
                          key={header}
                          className={`
                            px-3 py-2 text-sm font-medium text-muted-foreground
                            ${isZoneStart(header) ? 'border-l-2 border-primary/20' : ''}
                          `}
                          style={{
                            minWidth: `${getColumnWidth(header)}px`,
                            maxWidth: `${getColumnWidth(header)}px`,
                            textAlign: isRightAlign(header) ? 'right' : 'center'
                          }}
                        >
                          {translateHeader(header)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Table Body */}
                  <div 
                    ref={bodyScrollRef}
                    className="overflow-auto max-h-[calc(100vh-350px)]"
                  >
                    <div className="min-w-max">
                      {data.map((row, rowIndex) => (
                        <div 
                          key={rowIndex}
                          className="flex border-b hover:bg-muted/30 transition-colors"
                        >
                          {displayHeaders.map((header) => (
                            <div
                              key={header}
                              className={`
                                px-3 py-2 text-sm
                                ${isZoneStart(header) ? 'border-l-2 border-primary/10' : ''}
                              `}
                              style={{
                                minWidth: `${getColumnWidth(header)}px`,
                                maxWidth: `${getColumnWidth(header)}px`,
                                textAlign: isRightAlign(header) ? 'right' : 'center'
                              }}
                            >
                              {row[header] || '-'}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
