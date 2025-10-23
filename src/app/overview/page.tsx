'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
  'Quality_Messages': { th: 'ข้อความคุณภาพ', en: 'Quality_Messages' },
  'Cost_per_Quality_Message': { th: 'ต้นทุน/ข้อความคุณภาพ', en: 'Cost_per_Quality_Message' },
  'Click(Meta)': { th: 'คลิก(Meta)', en: 'Click(Meta)' },
  'Link_Click(Meta)': { th: 'คลิกลิงก์(Meta)', en: 'Link_Click(Meta)' },
  'Landing_Click(Meta)': { th: 'คลิกหน้า Landing(Meta)', en: 'Landing_Click(Meta)' },
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
export default function OverviewPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [data, setData] = useState<SheetData[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [error, setError] = useState('')
  const [, forceUpdate] = useState({})
  const [userRole, setUserRole] = useState<'ADMIN' | 'EMPLOYEE'>('EMPLOYEE')
  
  // ตรวจสอบ authentication ก่อนแสดงหน้า
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        
        if (!data.user) {
          // ไม่มี session ให้ redirect ไป login
          router.push('/login')
          return
        }
        
        // เก็บ role ของ user
        const role = data.user.role || 'EMPLOYEE'
        console.log('🔐 User role:', role)
        setUserRole(role)
        setIsCheckingAuth(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [router])
  
  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate({})
    }
    window.addEventListener('languageChanged', handleLanguageChange)
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange)
    }
  }, [])
  const translateHeader = (header: string): string => {
    const translation = COLUMN_TRANSLATIONS[header]
    if (!translation) return header
    return language === 'th' ? translation.th : translation.en
  }
  const [teamFilter, setTeamFilter] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('overview_teamFilter') || 'สาวอ้อย'
    }
    return 'สาวอ้อย'
  })
  
  // Custom setter ที่บันทึก scroll ก่อนเปลี่ยนทีม
  const handleTeamFilterChange = (newTeam: string) => {
    if (bodyScrollRef.current) {
      setSavedScrollPosition(bodyScrollRef.current.scrollTop)
      setSavedScrollLeft(bodyScrollRef.current.scrollLeft)
      console.log('💾 Team change: Saving scroll', bodyScrollRef.current.scrollTop, bodyScrollRef.current.scrollLeft)
    }
    setTeamFilter(newTeam)
  }
  const [monthFilter, setMonthFilter] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('overview_monthFilter') || getCurrentMonth()
    }
    return getCurrentMonth()
  })
  const [yearFilter, setYearFilter] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('overview_yearFilter') || String(currentYear)
    }
    return String(currentYear)
  })
  const [displayMode, setDisplayMode] = useState<'number' | 'percent'>(() => {
    if (typeof window !== 'undefined') {
      return (sessionStorage.getItem('overview_displayMode') as 'number' | 'percent') || 'percent'
    }
    return 'percent'
  })
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date())
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const headerScrollRef = useRef<HTMLDivElement>(null)
  const bodyScrollRef = useRef<HTMLDivElement>(null)
  const [scrollbarWidth, setScrollbarWidth] = useState(0)
  const [exchangeRate, setExchangeRate] = useState<number>(35)
  const [teamDataCache, setTeamDataCache] = useState<any[]>([])
  const [adserDataCache, setAdserDataCache] = useState<{ [key: string]: any[] }>({})
  const [savedScrollPosition, setSavedScrollPosition] = useState<number>(0)
  const [savedScrollLeft, setSavedScrollLeft] = useState<number>(0)
  
  // Ref เพื่อป้องกันการโหลดข้อมูลซ้ำซ้อน
  const isLoadingDataRef = useRef(false)
  const isLoadingAdserDataRef = useRef(false)
  
  // เป้าหมายของแต่ละทีม
  interface TeamTargets {
    coverTarget: number
    cpmTarget: number
    costPerTopupTarget: number
    lostMessagesTarget: number // ยอดเสีย
    duplicateTarget: number // ทักซ้ำ
    under18Target: number // เด็ก
  }
  
  const [currentTargets, setCurrentTargets] = useState<TeamTargets>({
    coverTarget: 0,
    cpmTarget: 0,
    costPerTopupTarget: 0,
    lostMessagesTarget: 0,
    duplicateTarget: 0,
    under18Target: 0,
  })
  
  const [isLoadingTargets, setIsLoadingTargets] = useState(false) // เพิ่ม flag สำหรับโหลด targets
  
  // โหลดเป้าหมายจากฐานข้อมูล
  const loadTeamTargets = async (team: string) => {
    if (!team) return
    
    setIsLoadingTargets(true) // เริ่มโหลด
    try {
      console.log('📥 Loading team targets for:', team)
      const res = await fetch(`/api/team-targets?team=${encodeURIComponent(team)}`)
      const data = await res.json()
      
      console.log('📦 Received team targets:', data)
      
      if (data && !data.error) {
        const newTargets = {
          coverTarget: data.coverTarget || 0,
          cpmTarget: data.cpmTarget || 0,
          costPerTopupTarget: data.costPerTopupTarget || 0,
          lostMessagesTarget: data.lostMessagesTarget || 0,
          duplicateTarget: data.duplicateTarget || 0,
          under18Target: data.under18Target || 0,
        }
        
        console.log('📊 Setting new targets:', newTargets)
        setCurrentTargets(newTargets)
        
        // อัปเดต ref ทันที
        currentTargetsRef.current = newTargets
        console.log('✅ Team targets updated. New cpmTarget:', newTargets.cpmTarget, 'Ref cpmTarget:', currentTargetsRef.current.cpmTarget)
      }
    } catch (error) {
      console.error('❌ Failed to load team targets:', error)
    } finally {
      setIsLoadingTargets(false) // เสร็จสิ้นการโหลด
    }
  }
  
  // ฟังก์ชันบันทึกเป้า
  const updateTeamTarget = async (field: keyof TeamTargets, value: number) => {
    const newTargets = {
      ...currentTargets,
      [field]: value
    }
    
    console.log('💾 Saving team targets:', { team: teamFilter, field, value, newTargets })
    
    // บันทึกลงฐานข้อมูล
    try {
      const response = await fetch('/api/team-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: teamFilter,
          ...newTargets
        })
      })
      const result = await response.json()
      console.log('✅ Team targets saved to database:', result)
      
      // อัพเดต state และ ref ด้วยค่าที่บันทึกสำเร็จแล้ว
      setCurrentTargets(result)
      currentTargetsRef.current = result
      console.log('📊 Updated targets. New cpmTarget:', result.cpmTarget, 'Ref cpmTarget:', currentTargetsRef.current.cpmTarget)
    } catch (error) {
      console.error('❌ Failed to save team targets:', error)
    }
  }
  
  // โหลดเป้าหมายเมื่อเปลี่ยนทีม
  useEffect(() => {
    if (teamFilter && !isCheckingAuth) {
      loadTeamTargets(teamFilter)
    }
  }, [teamFilter, isCheckingAuth])
  
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
  
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
        const data = await response.json()
        if (data.rates && data.rates.THB) {
          const newRate = data.rates.THB
          setExchangeRate(newRate)
          console.log('💱 Exchange rate updated:', newRate, 'THB per 1 USD')
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error)
      }
    }
    fetchExchangeRate()
    const interval = setInterval(fetchExchangeRate, 3600000) // ทุก 1 ชั่วโมง
    return () => clearInterval(interval)
  }, [])
  
  const [activeTab, setActiveTab] = useState<'team' | 'adser'>('team')
  const [adserData, setAdserData] = useState<SheetData[]>([])
  const [adserHeaders, setAdserHeaders] = useState<string[]>([])
  const [selectedAdser, setSelectedAdser] = useState<string>('')
  const adserList = teamFilter ? (TEAM_MEMBERS[teamFilter] || []) : []
  
  // Wrapper function สำหรับป้องกันการล้างข้อมูลในโหมด silent
  const safeSetAdserData = (newData: SheetData[], isSilentMode = false) => {
    if (isSilentMode && (!newData || newData.length === 0)) {
      console.log('🛡️ Protected: Not clearing adser data in silent mode')
      return // ไม่ล้างข้อมูลในโหมด silent
    }
    console.log('📝 Setting adser data:', newData.length, 'rows, silent:', isSilentMode)
    setAdserData(newData)
  }
  
  // Refs สำหรับ auto-refresh ใช้ค่าล่าสุดโดยไม่ต้องพึ่ง dependencies
  const activeTabRef = useRef(activeTab)
  const selectedAdserRef = useRef(selectedAdser)
  const teamFilterRef = useRef(teamFilter)
  const currentTargetsRef = useRef(currentTargets)
  
  // อัปเดต refs เมื่อ state เปลี่ยน
  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])
  
  useEffect(() => {
    selectedAdserRef.current = selectedAdser
  }, [selectedAdser])
  
  useEffect(() => {
    teamFilterRef.current = teamFilter
  }, [teamFilter])
  
  useEffect(() => {
    currentTargetsRef.current = currentTargets
  }, [currentTargets])
  
  interface ColorRule {
    id?: string
    team: string
    columnName: string
    conditionType: 'GREATER' | 'LESS' | 'BETWEEN'
    unitType: 'NUMBER' | 'PERCENT'
    value1: number
    value2?: number | null
    color: string
    textColor: string
    isBold: boolean
    priority: number
    isActive: boolean
  }
  const [colorRules, setColorRules] = useState<ColorRule[]>([])
  const [showColorSettings, setShowColorSettings] = useState(false)
  const [editingRules, setEditingRules] = useState<{ [ruleId: string]: Partial<ColorRule> }>({})
  const presetColors = [
    { name: 'แดง', bg: '#ef4444', text: '#ffffff' },
    { name: 'ส้ม', bg: '#f97316', text: '#ffffff' },
    { name: 'เหลือง', bg: '#eab308', text: '#000000' },
    { name: 'เขียว', bg: '#22c55e', text: '#ffffff' },
    { name: 'ฟ้า', bg: '#3b82f6', text: '#ffffff' },
  ]
  // กรองคอลัมน์ที่สามารถตั้งค่าสีได้ (ยกเว้นคอลัมน์ที่มีสี hard-coded หรือไม่ควรตั้งค่าสี)
  const colorableColumns = headers.filter(header => 
    header !== 'Date' && 
    header !== 'วันที่' && 
    header !== 'Team' && 
    header !== 'ทีม' &&
    header !== 'KPI_Budget_Used' && // มีสีแบบ hard-coded ตาม %
    header !== 'Total_Messages' && // มีสีตาม % เทียบกับแผนทัก
    header !== 'CPM' && // มีสีตาม % เทียบกับเป้า cpmTarget
    header !== 'Cost_per_Top_up_Pure' && // มีสีตาม % เทียบกับเป้า costPerTopupTarget
    header !== 'Lost_Messages' && // มีสีตามเป้า % (ยิ่งน้อยยิ่งดี)
    header !== 'Duplicate' && // มีสีตามเป้า % (ยิ่งน้อยยิ่งดี)
    header !== 'Under_18' && // มีสีตามเป้า % (ยิ่งน้อยยิ่งดี)
    header !== 'Planned_Messages' && // แผนทัก - ไม่ต้องตั้งค่าสี
    header !== 'Messages(Meta)' && // ยอดทัก(Meta) - ไม่ต้องตั้งค่าสี
    header !== 'Planned_Spend/Day' && // แผนงบ - ไม่ต้องตั้งค่าสี
    header !== 'Spend' && // ค่าใช้จ่าย - ไม่ต้องตั้งค่าสี
    header !== 'Top-up' && // เติม - ไม่ต้องตั้งค่าสี
    header !== 'Messages_per_Top_up' && // ทัก/เติม - ไม่ต้องตั้งค่าสี
    header !== 'Quality_Messages_per_Top_up' // ทักบริสุทธิ์/เติม - ไม่ต้องตั้งค่าสี
  )
  const percentageColumns = [
    'Lost_Messages',
    'Net_Messages_Pure',
    'Net_Messages',
    'Page_Blocks_7Days',
    'Page_Blocks_30Days',
    'Silent',
    'Duplicate',
    'Has_User',
    'Spam',
    'Blocked',
    'Under_18',
    'Over_50',
    'Foreign'
  ]
  useEffect(() => {
    sessionStorage.setItem('overview_teamFilter', teamFilter)
  }, [teamFilter])
  useEffect(() => {
    sessionStorage.setItem('overview_monthFilter', monthFilter)
  }, [monthFilter])
  useEffect(() => {
    sessionStorage.setItem('overview_yearFilter', yearFilter)
  }, [yearFilter])
  useEffect(() => {
    sessionStorage.setItem('overview_displayMode', displayMode)
  }, [displayMode])
  const fetchColorRules = async () => {
    try {
      const res = await fetch('/api/color-rules')
      const rules = await res.json()
      setColorRules(rules)
    } catch (err: any) {
      console.error('Error fetching color rules:', err)
    }
  }
  const saveRuleChanges = async (ruleId: string) => {
    const changes = editingRules[ruleId]
    if (!changes) return
    try {
      const res = await fetch(`/api/color-rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes)
      })
      if (res.ok) {
        const newEditingRules = { ...editingRules }
        delete newEditingRules[ruleId]
        setEditingRules(newEditingRules)
        await fetchColorRules()
      }
    } catch (err) {
      console.error('Error saving rule:', err)
    }
  }
  const updateRuleField = (ruleId: string, field: string, value: any) => {
    setEditingRules(prev => ({
      ...prev,
      [ruleId]: {
        ...prev[ruleId],
        [field]: value
      }
    }))
  }
  const hasChanges = (ruleId: string) => {
    return editingRules[ruleId] && Object.keys(editingRules[ruleId]).length > 0
  }
  useEffect(() => {
    fetchColorRules()
  }, [])
  const fetchData = async (silent = false) => {
    // ป้องกันการโหลดซ้ำ
    if (isLoadingDataRef.current && !silent) {
      console.log('⏸️ fetchData skipped: already loading')
      return
    }
    
    if (!silent) {
      setIsLoading(true)
      isLoadingDataRef.current = true
    }
    setError('')
    try {
      // Debug: แสดงค่า currentTargets ก่อนเรียก API
      const cpmTarget = currentTargetsRef.current.cpmTarget
      const debugInfo = {
        cpmTarget: cpmTarget,
        exchangeRate: exchangeRate,
        teamFilter,
        silent,
        timestamp: new Date().toISOString(),
        currentTargetsState: currentTargets.cpmTarget,
        refTargets: currentTargetsRef.current
      }
      console.log('🚀 fetchData called:', debugInfo)
      
      // ถ้า cpmTarget เป็น 0 แสดงว่ายังไม่ได้ตั้งค่า ให้ข้าม
      if (cpmTarget === 0) {
        console.warn('⚠️ cpmTarget is 0, skipping API call. Debug:', {
          refValue: currentTargetsRef.current.cpmTarget,
          stateValue: currentTargets.cpmTarget,
          isLoadingTargets,
          teamFilter
        })
        if (!silent) {
          setIsLoading(false)
          isLoadingDataRef.current = false
        }
        return
      }
      
      const params = new URLSearchParams()
      if (teamFilter) params.append('team', teamFilter)
      if (monthFilter) params.append('month', monthFilter)
      if (yearFilter) params.append('year', yearFilter)
      params.append('cpmTarget', cpmTarget.toString())
      const url = `/api/gateway-data?${params.toString()}`
      
      console.log('📡 API URL:', url)
      
      const res = await fetch(url)
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Failed to fetch data')
      }
      console.log('🔍 API Response:', {
        dataLength: result.data?.length || 0,
        headersLength: result.headers?.length || 0,
        silent,
        firstRow: result.data?.[0]
      })
      
      if (result.data && Array.isArray(result.data)) {
        console.log('✅ Setting team data:', result.data.length, 'rows')
        setHeaders(result.headers || COLUMN_ORDER)
        setData(result.data)
        setTeamDataCache(result.data)
        setLastRefreshTime(new Date())
        
        if (!silent) {
          console.log('📋 Team data loaded:', result.data.length, 'rows')
        }
      } else {
        console.warn('⚠️ No data returned from API')
        if (!silent && teamDataCache.length === 0) {
          setError('ไม่พบข้อมูล')
        }
      }
    } catch (err: any) {
      console.error('❌ Error fetching team data:', err)
      if (!silent) {
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล')
      }
    } finally {
      if (!silent) {
        setIsLoading(false)
        isLoadingDataRef.current = false
      }
    }
  }
  const fetchAdserData = async (silent = false) => {
    // ป้องกันการโหลดซ้ำซ้อน
    if (isLoadingAdserDataRef.current && !silent) {
      console.log('⏸️ Adser fetch already in progress, skipping...')
      return
    }
    
    try {
      isLoadingAdserDataRef.current = true
      if (!silent) {
        setIsLoading(true)
      }
      setError('')
      
      const cpmTarget = currentTargetsRef.current.cpmTarget
      
      console.log('🎯 fetchAdserData Debug:', {
        cpmTarget,
        currentTargetsState: currentTargets.cpmTarget,
        refTargets: currentTargetsRef.current,
        teamFilter,
        selectedAdser,
        silent,
        userRole
      })
      
      // ถ้า cpmTarget เป็น 0 แสดงว่ายังไม่ได้ตั้งค่า ให้ข้าม
      if (cpmTarget === 0) {
        console.warn('⚠️ Adser: cpmTarget is 0, skipping API call. Debug:', {
          refValue: currentTargetsRef.current.cpmTarget,
          stateValue: currentTargets.cpmTarget,
          isLoadingTargets,
          teamFilter
        })
        isLoadingAdserDataRef.current = false
        if (!silent) {
          setIsLoading(false)
        }
        return
      }
      
      // เพิ่มการป้องกันสำหรับ ADMIN users ในโหมด silent
      if (silent && userRole === 'ADMIN' && adserData.length > 0) {
        console.log('👨‍💼 ADMIN silent refresh: Preserving existing data, current rows:', adserData.length)
        // อัปเดตเวลาแต่ไม่เรียก API เพื่อป้องกันการล้างข้อมูล
        setLastRefreshTime(new Date())
        isLoadingAdserDataRef.current = false
        return
      }
      
      const params = new URLSearchParams()
      if (teamFilter) params.append('team', teamFilter)
      if (selectedAdser) params.append('adser', selectedAdser)
      if (monthFilter) params.append('month', monthFilter)
      if (yearFilter) params.append('year', yearFilter)
      params.append('cpmTarget', cpmTarget.toString())
      const url = `/api/gateway-data?${params.toString()}`
      const res = await fetch(url)
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Failed to fetch adser data')
      }
      console.log('🔍 Adser API Response:', {
        dataLength: result.data?.length || 0,
        headersLength: result.headers?.length || 0,
        silent,
        selectedAdser,
        userRole,
        firstRow: result.data?.[0]
      })
      
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        console.log('✅ Setting adser data:', result.data.length, 'rows')
        setAdserHeaders(result.headers || COLUMN_ORDER)
        safeSetAdserData(result.data, silent)
        
        if (selectedAdser) {
          setAdserDataCache(prev => ({ ...prev, [selectedAdser]: result.data }))
        }
        setLastRefreshTime(new Date())
        
        if (!silent) {
          console.log('📋 Adser data loaded:', result.data.length, 'rows')
        }
      } else {
        console.warn('⚠️ No adser data returned from API or empty array', {
          silent,
          selectedAdser,
          hasCache: selectedAdser ? !!adserDataCache[selectedAdser] : false,
          currentDataLength: adserData.length
        })
        
        // ในโหมด silent (auto-refresh) ต้องปกป้องข้อมูลเดิมไว้เสมо
        if (silent) {
          console.log('🔄 Silent refresh: No new data, PRESERVING existing data. Current data rows:', adserData.length)
          setLastRefreshTime(new Date()) // อัปเดตเวลา refresh แต่คงข้อมูลเดิมไว้เสมอ
          // ไม่ทำอะไรกับ adserData เลย เพื่อคงข้อมูลเดิมไว้
        } else {
          // ในโหมดปกติ ถ้าไม่มีข้อมูลและไม่มีข้อมูลใน cache ให้แสดง error
          if (!selectedAdser || !adserDataCache[selectedAdser]) {
            setError('ไม่พบข้อมูล Adser')
            safeSetAdserData([], false) // ล้างข้อมูลเฉพาะในโหมดปกติ
          } else {
            // ถ้ามีข้อมูลใน cache ให้ใช้ข้อมูลจาก cache
            console.log('📦 Using cached data for:', selectedAdser)
            safeSetAdserData(adserDataCache[selectedAdser], false)
          }
        }
      }
      
      if (adserList.length > 0 && !selectedAdser) {
        setSelectedAdser(adserList[0])
      }
    } catch (err: any) {
      console.error('❌ Error fetching adser data:', err, {
        silent,
        selectedAdser,
        currentDataLength: adserData.length,
        hasCache: selectedAdser ? !!adserDataCache[selectedAdser] : false
      })
      
      if (silent) {
        // ในโหมด silent (auto-refresh) ถ้าเกิด error ให้ log แต่ไม่แสดง error message
        // และคงข้อมูลเดิมไว้โดยไม่ทำอะไร
        console.log('🔄 Silent refresh error: PRESERVING existing data. Current data rows:', adserData.length)
        setLastRefreshTime(new Date()) // อัปเดตเวลาแต่คงข้อมูลเดิมไว้เสมอ
        // ไม่ทำอะไรกับ adserData และ error state เลย
      } else {
        // ในโหมดปกติ ให้แสดง error message
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล Adser')
      }
    } finally {
      isLoadingAdserDataRef.current = false
      if (!silent) {
        setIsLoading(false)
      }
    }
  }
  // Fetch ข้อมูล Team เมื่อ filter เปลี่ยนหรือ targets พร้อม
  useEffect(() => {
    console.log('🔄 Team fetch useEffect triggered:', {
      activeTab,
      teamFilter,
      monthFilter,
      yearFilter,
      isCheckingAuth,
      isLoadingTargets,
      cpmTarget: currentTargets.cpmTarget
    })
    
    // ให้โหลดข้อมูลได้เสมอถ้าไม่ได้กำลังตรวจสอบ auth และไม่ได้โหลด targets และมี cpmTarget แล้ว
    if (activeTab === 'team' && teamFilter && !isCheckingAuth && !isLoadingTargets && currentTargets.cpmTarget > 0) {
      fetchData(false)
    }
  }, [activeTab, teamFilter, monthFilter, yearFilter, isCheckingAuth, isLoadingTargets, currentTargets.cpmTarget])
  
  // Fetch ข้อมูล Adser เมื่อเลือก Adser หรือ filter เปลี่ยน
  useEffect(() => {
    if (activeTab === 'adser' && selectedAdser && teamFilter) {
      fetchAdserData(false)
    }
  }, [activeTab, selectedAdser, teamFilter, monthFilter, yearFilter])
  
  // Set default Adser เมื่อมี list
  useEffect(() => {
    if (activeTab === 'adser' && adserList.length > 0 && !selectedAdser) {
      setSelectedAdser(adserList[0])
    }
  }, [activeTab, adserList])

  // ใช้ข้อมูลจาก cache เมื่อ selectedAdser เปลี่ยน (ถ้ามี)
  useEffect(() => {
    if (activeTab === 'adser' && selectedAdser && adserDataCache[selectedAdser]) {
      console.log('📦 Loading cached data for:', selectedAdser)
      safeSetAdserData(adserDataCache[selectedAdser], false)
      setError('') // ล้าง error เมื่อมีข้อมูลจาก cache
    }
  }, [selectedAdser, activeTab])
  
  // คืนค่า scroll หลังจากข้อมูลเปลี่ยน
  useEffect(() => {
    if ((activeTab === 'team' && data.length > 0) || (activeTab === 'adser' && adserData.length > 0)) {
      requestAnimationFrame(() => {
        if (bodyScrollRef.current && headerScrollRef.current) {
          bodyScrollRef.current.scrollTop = savedScrollPosition
          bodyScrollRef.current.scrollLeft = savedScrollLeft
          headerScrollRef.current.scrollLeft = savedScrollLeft
        }
      })
    }
  }, [data, adserData])
  
  // Auto-refresh ทุก 30 วินาที แบบ silent (ไม่แสดง loading)
  useEffect(() => {
    const interval = setInterval(() => {
      // ใช้ ref เพื่อเข้าถึงค่าล่าสุด
      const currentTab = activeTabRef.current
      const currentAdser = selectedAdserRef.current
      const currentTeam = teamFilterRef.current
      const targets = currentTargetsRef.current
      
      // ตรวจสอบว่ามีข้อมูลพื้นฐานครบ (ไม่บล็อกถ้า cpmTarget เป็น 0)
      if (!currentTeam) {
        console.warn('⏸️ Auto-refresh skipped: missing team')
        return
      }
      
      // เพิ่มการตรวจสอบสำหรับ ADMIN users
      if (userRole === 'ADMIN') {
        console.log('👨‍💼 ADMIN user auto-refresh - extra checks')
        // สำหรับ ADMIN ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
        if (currentTab === 'adser' && (!currentAdser || adserData.length === 0)) {
          console.log('⏸️ ADMIN: Skipping auto-refresh - no adser data to preserve')
          return
        }
      }
      
      // บันทึก scroll position ก่อน refresh
      if (bodyScrollRef.current) {
        setSavedScrollPosition(bodyScrollRef.current.scrollTop)
        setSavedScrollLeft(bodyScrollRef.current.scrollLeft)
      }
      
      console.log('🔄 Auto-refresh triggered', { 
        tab: currentTab, 
        adser: currentAdser, 
        team: currentTeam,
        userRole: userRole,
        hasAdserData: adserData.length > 0,
        cacheKeys: Object.keys(adserDataCache),
        cachedDataForCurrentAdser: currentAdser ? adserDataCache[currentAdser]?.length || 0 : 0
      })
      
      if (currentTab === 'team') {
        fetchData(true) // silent mode
      } else if (currentTab === 'adser') {
        if (currentAdser) {
          console.log('🔄 Calling fetchAdserData for:', currentAdser)
          fetchAdserData(true) // silent mode
        } else {
          console.warn('⚠️ Auto-refresh adser: No selected adser, checking cache and setting default')
          // ถ้าไม่มี selectedAdser แต่มี adserList ให้เลือกค่าแรก
          const currentAdserList = teamFilter ? (TEAM_MEMBERS[teamFilter] || []) : []
          if (currentAdserList.length > 0) {
            console.log('🔄 Setting default adser:', currentAdserList[0])
            setSelectedAdser(currentAdserList[0])
          }
        }
      }
    }, 30000) // 30 วินาที
    
    return () => clearInterval(interval)
  }, [userRole]) // เพิ่ม userRole เป็น dependency
  
  useEffect(() => {
    const bodyScroll = bodyScrollRef.current
    const headerScroll = headerScrollRef.current
    if (!bodyScroll || !headerScroll) return
    
    // กู้คืน scroll position ถ้ามีค่าที่บันทึกไว้
    if (savedScrollPosition > 0 || savedScrollLeft > 0) {
      bodyScroll.scrollTop = savedScrollPosition
      bodyScroll.scrollLeft = savedScrollLeft
      headerScroll.scrollLeft = savedScrollLeft
    }
    
    const handleBodyScroll = () => {
      headerScroll.scrollLeft = bodyScroll.scrollLeft
    }
    const handleHeaderScroll = () => {
      bodyScroll.scrollLeft = headerScroll.scrollLeft
    }
    bodyScroll.addEventListener('scroll', handleBodyScroll, { passive: true })
    headerScroll.addEventListener('scroll', handleHeaderScroll, { passive: true })
    return () => {
      bodyScroll.removeEventListener('scroll', handleBodyScroll)
      headerScroll.removeEventListener('scroll', handleHeaderScroll)
    }
  }, [data, adserData])
  
  const getThaiMonthFromDate = (dateStr: string): string => {
    if (!dateStr) return ''
    const parts = String(dateStr).split('/')
    if (parts.length === 3) {
      const monthNum = parseInt(parts[1], 10)
      if (monthNum >= 1 && monthNum <= 12) {
        return MONTHS[monthNum - 1]
      }
    }
    return ''
  }
  const getYearFromDate = (dateStr: string): string => {
    if (!dateStr) return ''
    const parts = String(dateStr).split('/')
    if (parts.length === 3) {
      return parts[2]
    }
    return ''
  }
  const isToday = (dateStr: string): boolean => {
    if (!dateStr) return false
    const today = new Date()
    // ใช้ฟอร์แมตเดียวกับฐานข้อมูล (ไม่มี 0 นำหน้า)
    const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`
    const cleanDateStr = String(dateStr).trim()
    if (cleanDateStr === todayStr) {
      console.log('🎯 Found today:', cleanDateStr, '===', todayStr)
    }
    return cleanDateStr === todayStr
  }
  const generateFullMonthData = (filteredData: SheetData[]) => {
    // ถ้าไม่ได้เลือกเดือนและปี ให้แสดงข้อมูลที่มีทั้งหมด
    if (!monthFilter || !yearFilter || monthFilter === 'ทั้งหมด' || yearFilter === 'ทั้งหมด') {
      console.log('📊 No month/year filter, showing all data:', filteredData.length, 'rows')
      return filteredData
    }
    
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ]
    const monthIndex = thaiMonths.indexOf(monthFilter)
    if (monthIndex === -1) {
      console.log('⚠️ Invalid month filter:', monthFilter)
      return filteredData
    }
    
    const year = parseInt(yearFilter)
    const month = monthIndex + 1 // 1-12
    const daysInMonth = new Date(year, month, 0).getDate()
    
    const dataMap = new Map<number, SheetData>()
    filteredData.forEach(row => {
      const dateValue = row['วันที่'] || row['Date'] || row['date'] || row['วัน'] || ''
      if (dateValue) {
        const parts = String(dateValue).trim().split('/')
        if (parts.length === 3) {
          const dayNum = parseInt(parts[0]) // แปลงเป็นตัวเลข (1-31)
          dataMap.set(dayNum, row)
        }
      }
    })
    
    console.log('� Creating full month for:', monthFilter, yearFilter, '- Days:', daysInMonth)
    console.log('�📊 Data available for days:', Array.from(dataMap.keys()).sort((a, b) => a - b))
    
    const fullMonthData: SheetData[] = []
    for (let day = 1; day <= daysInMonth; day++) {
      if (dataMap.has(day)) {
        fullMonthData.push(dataMap.get(day)!)
      } else {
        // ใช้ฟอร์แมตเดียวกับฐานข้อมูล (ไม่มี 0 นำหน้า)
        const dateStr = `${day}/${month}/${year}`
        const emptyRow: SheetData = {}
        emptyRow['วันที่'] = dateStr
        emptyRow['Date'] = dateStr
        emptyRow['date'] = dateStr
        if (teamFilter) {
          emptyRow['ทีม'] = teamFilter
          emptyRow['Team'] = teamFilter
          emptyRow['team'] = teamFilter
        }
        COLUMN_ORDER.forEach(header => {
          if (!emptyRow[header]) {
            emptyRow[header] = ''
          }
        })
        fullMonthData.push(emptyRow)
      }
    }
    console.log('✅ Full month data created:', fullMonthData.length, 'rows')
    return fullMonthData
  }
  const filteredData = data.filter((row) => {
    const dateValue = row['Date'] || row['date'] || ''
    if (teamFilter) {
      const teamValue = row['Team'] || row['team'] || ''
      if (String(teamValue) !== teamFilter) {
        return false
      }
    }
    if (monthFilter) {
      let monthValue = row['เดือน'] || row['Month'] || row['month'] || ''
      if (!monthValue && dateValue) {
        monthValue = getThaiMonthFromDate(String(dateValue))
      }
      if (String(monthValue) !== monthFilter) {
        return false
      }
    }
    if (yearFilter) {
      let yearValue = row['ปี'] || row['Year'] || row['year'] || ''
      if (!yearValue && dateValue) {
        yearValue = getYearFromDate(String(dateValue))
      }
      if (String(yearValue) !== yearFilter) {
        return false
      }
    }
    return true
  })
  const fullMonthData = generateFullMonthData(filteredData)
  const filteredAdserData = adserData.filter((row) => {
    const dateValue = row['Date'] || row['date'] || ''
    const adserValue = row['Adser'] || row['adser'] || ''
    if (selectedAdser && String(adserValue) !== selectedAdser) {
      return false
    }
    if (teamFilter) {
      const teamValue = row['Team'] || row['team'] || ''
      if (String(teamValue) !== teamFilter) {
        return false
      }
    }
    if (monthFilter) {
      let monthValue = row['เดือน'] || row['Month'] || row['month'] || ''
      if (!monthValue && dateValue) {
        monthValue = getThaiMonthFromDate(String(dateValue))
      }
      if (String(monthValue) !== monthFilter) {
        return false
      }
    }
    if (yearFilter) {
      let yearValue = row['ปี'] || row['Year'] || row['year'] || ''
      if (!yearValue && dateValue) {
        yearValue = getYearFromDate(String(dateValue))
      }
      if (String(yearValue) !== yearFilter) {
        return false
      }
    }
    return true
  })
  const displayData = activeTab === 'team' ? fullMonthData : filteredAdserData
  const currentHeaders = activeTab === 'team' ? headers : adserHeaders
  
  console.log('📊 Display Data:', {
    activeTab,
    dataLength: displayData.length,
    headersLength: currentHeaders.length,
    firstRow: displayData[0]
  })
  
  // กรองเฉพาะคอลัมน์ที่ต้องการแสดงตาม COLUMN_ORDER และซ่อน Team/Adser
  const displayHeaders = COLUMN_ORDER.filter(col => {
    // ซ่อนคอลัมน์ Team และ Adser
    if (['Team', 'team', 'Adser', 'adser'].includes(col)) {
      return false
    }
    // ถ้าไม่มี headers จาก API ให้แสดงทุกคอลัมน์ใน COLUMN_ORDER
    if (currentHeaders.length === 0) {
      return true
    }
    // ถ้ามี headers จาก API ให้แสดงเฉพาะที่มีในข้อมูล
    return currentHeaders.includes(col)
  })
  
  console.log('📋 Display Headers:', displayHeaders.length, 'columns')
  
  const rightAlignColumns = ['Planned_Spend/Day', 'Spend', 'New Player Revenue (THB)']
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
    'Messages_per_Top-up': 80,
    'Quality_Messages_per_Top_up': 90,
    'Quality_Messages_per_Top-up': 90,
    'Cost_per_Top-up': 80,
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
    return columnWidths[header] || 150 // ค่า default = 120px
  }
  const minColumnWidth = 75 // ปรับค่านี้เพื่อกำหนดขนาดแคบที่สุดที่อนุญาต
  const isRightAlign = (header: string) => rightAlignColumns.includes(header)
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
  const getDisplayValue = (row: SheetData, header: string): string => {
    const value = row[header] || ''
    
    // คอลัมน์ที่ต้องจัดรูปแบบตัวเลข
    const numberColumns = [
      'Planned_Messages',
      'Total_Messages',
      'Messages(Meta)',
      'Lost_Messages',
      'Net_Messages_Pure',
      'Page_Blocks_7Days',
      'Page_Blocks_30Days',
      'Silent',
      'Duplicate',
      'Has_User',
      'Spam',
      'Blocked',
      'Under_18',
      'Over_50',
      'Foreign'
    ]
    
    // ยอดเล่นใหม่(฿) - แสดงทศนิยม 2 ตำแหน่ง
    if (header === 'New Player Revenue (THB)') {
      const numValue = parseFloat(String(value).replace(/[฿,]/g, ''))
      if (isNaN(numValue)) {
        return value
      }
      return '฿' + numValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }
    
    // โหมดเปอร์เซ็นต์สำหรับคอลัมน์พิเศษ (ตรวจสอบก่อน numberColumns)
    if (percentageColumns.includes(header) && displayMode === 'percent') {
      const numValue = parseFloat(String(value).replace(/,/g, ''))
      const totalMessages = parseFloat(row['Total_Messages'] || '0')
      if (isNaN(numValue) || isNaN(totalMessages) || totalMessages === 0) {
        return value
      }
      const percentage = (numValue / totalMessages) * 100
      return `${percentage.toFixed(2)}%`
    }
    
    // คอลัมน์ตัวเลขทั่วไป - แสดงแบบ ##,###
    if (numberColumns.includes(header)) {
      const numValue = parseFloat(String(value).replace(/,/g, ''))
      if (isNaN(numValue) || numValue === 0) {
        return value
      }
      return numValue.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })
    }
    
    return value
  }
  
  // ฟังก์ชันกำหนดสีแบบ hard-coded สำหรับ %KPI/Budget
  const getKPIBudgetStyle = (value: string, isSummaryRow: boolean = false): React.CSSProperties => {
    const baseStyle: React.CSSProperties = { 
      fontSize: '13px',
      fontWeight: isSummaryRow ? 'bold' : 'normal'
    }
    
    // แยกค่า % ออกมา
    const numValue = parseFloat(String(value).replace('%', ''))
    if (isNaN(numValue)) return baseStyle
    
    // กำหนดสีตามเกณฑ์
    if (numValue < 50) {
      // น้อยกว่า 50% → สีแดง
      baseStyle.backgroundColor = '#fee2e2' // red-100
      baseStyle.color = '#991b1b' // red-800
    } else if (numValue >= 50 && numValue < 80) {
      // 50-80% → สีส้ม
      baseStyle.backgroundColor = '#fed7aa' // orange-200
      baseStyle.color = '#9a3412' // orange-800
    } else if (numValue >= 80 && numValue < 100) {
      // 80-100% → สีฟ้า
      baseStyle.backgroundColor = '#bfdbfe' // blue-200
      baseStyle.color = '#1e40af' // blue-800
    } else {
      // 100% ขึ้นไป → สีเขียว
      baseStyle.backgroundColor = '#bbf7d0' // green-200
      baseStyle.color = '#166534' // green-800
    }
    
    return baseStyle
  }
  
  // ฟังก์ชันคำนวณสีสำหรับ CPM เทียบกับเป้า cpmTarget
  const getCPMStyle = (row: SheetData, isSummaryRow: boolean = false): React.CSSProperties => {
    const baseStyle: React.CSSProperties = { 
      fontSize: '13px',
      fontWeight: isSummaryRow ? 'bold' : 'normal'
    }
    
    // ดึงค่า CPM จริง
    const actualCPM = parseFloat(String(row['CPM'] || '0'))
    const targetCPM = currentTargetsRef.current.cpmTarget
    
    // ถ้าไม่มีเป้าหรือค่าไม่ถูกต้อง ไม่ใส่สี
    if (isNaN(actualCPM) || targetCPM === 0) {
      return baseStyle
    }
    
    // คำนวณ % = (Actual CPM / Target CPM) × 100
    const percentage = (actualCPM / targetCPM) * 100
    
    // กำหนดสีตามเกณฑ์ใหม่ (CPM ต่ำกว่าดีกว่า)
    if (percentage > 120) {
      // > 120% → สีแดงเข้ม (CPM สูงเกินไป)
      baseStyle.backgroundColor = '#fca5a5' // red-300
      baseStyle.color = '#7f1d1d' // red-900
    } else if (percentage > 100) {
      // > 100% → สีแดง (CPM สูงกว่าเป้า)
      baseStyle.backgroundColor = '#fecaca' // red-200
      baseStyle.color = '#991b1b' // red-800
    } else {
      // ≤ 100% → สีเขียว (CPM ต่ำกว่าหรือเท่ากับเป้า - ดี!)
      baseStyle.backgroundColor = '#bbf7d0' // green-200
      baseStyle.color = '#166534' // green-800
    }
    
    return baseStyle
  }
  
  // ฟังก์ชันคำนวณสีสำหรับ Cost_per_Top_up_Pure เทียบกับเป้า costPerTopupTarget
  const getCostPerTopupStyle = (row: SheetData, isSummaryRow: boolean = false): React.CSSProperties => {
    const baseStyle: React.CSSProperties = { 
      fontSize: '13px',
      fontWeight: isSummaryRow ? 'bold' : 'normal'
    }
    
    // ดึงค่า Cost_per_Top_up_Pure จริง
    const actualCost = parseFloat(String(row['Cost_per_Top_up_Pure'] || '0').replace(/[฿$,]/g, ''))
    const targetCost = currentTargetsRef.current.costPerTopupTarget
    
    // ถ้าไม่มีเป้าหรือค่าไม่ถูกต้อง ไม่ใส่สี
    if (isNaN(actualCost) || targetCost === 0) {
      return baseStyle
    }
    
    // คำนวณ % = (Actual Cost / Target Cost) × 100
    const percentage = (actualCost / targetCost) * 100
    
    // กำหนดสีตามเกณฑ์ (ต้นทุนต่ำกว่าดีกว่า)
    if (percentage > 120) {
      // > 120% → สีแดงเข้ม (ต้นทุนสูงเกินไป)
      baseStyle.backgroundColor = '#fca5a5' // red-300
      baseStyle.color = '#7f1d1d' // red-900
    } else if (percentage > 100) {
      // > 100% → สีแดง (ต้นทุนสูงกว่าเป้า)
      baseStyle.backgroundColor = '#fecaca' // red-200
      baseStyle.color = '#991b1b' // red-800
    } else {
      // ≤ 100% → สีเขียว (ต้นทุนต่ำกว่าหรือเท่ากับเป้า - ดี!)
      baseStyle.backgroundColor = '#bbf7d0' // green-200
      baseStyle.color = '#166534' // green-800
    }
    
    return baseStyle
  }
  
  // ฟังก์ชันคำนวณสีสำหรับ Lost_Messages, Duplicate, Under_18 (ยิ่งน้อยยิ่งดี - เปรียบเทียบกับเป้า %)
  const getQualityMetricsStyle = (row: SheetData, header: string, isSummaryRow: boolean = false): React.CSSProperties => {
    const baseStyle: React.CSSProperties = { 
      fontSize: '13px',
      fontWeight: isSummaryRow ? 'bold' : 'normal'
    }
    
    // ดึงค่าจริงจากข้อมูล (เป็น % แล้ว ถ้าอยู่ในโหมด percent)
    let actualValue = 0
    const totalMessages = parseFloat(String(row['Total_Messages'] || '0').replace(/,/g, ''))
    
    if (header === 'Lost_Messages') {
      const lostMessages = parseFloat(String(row['Lost_Messages'] || '0').replace(/,/g, ''))
      if (totalMessages > 0) {
        actualValue = (lostMessages / totalMessages) * 100
      }
    } else if (header === 'Duplicate') {
      const duplicate = parseFloat(String(row['Duplicate'] || '0').replace(/,/g, ''))
      if (totalMessages > 0) {
        actualValue = (duplicate / totalMessages) * 100
      }
    } else if (header === 'Under_18') {
      const under18 = parseFloat(String(row['Under_18'] || '0').replace(/,/g, ''))
      if (totalMessages > 0) {
        actualValue = (under18 / totalMessages) * 100
      }
    }
    
    // ดึงเป้าหมาย
    let targetValue = 0
    if (header === 'Lost_Messages') {
      targetValue = currentTargetsRef.current.lostMessagesTarget
    } else if (header === 'Duplicate') {
      targetValue = currentTargetsRef.current.duplicateTarget
    } else if (header === 'Under_18') {
      targetValue = currentTargetsRef.current.under18Target
    }
    
    // ถ้าไม่มีเป้า ไม่ใส่สี
    if (targetValue === 0) {
      return baseStyle
    }
    
    // กำหนดสี: ยิ่งน้อยยิ่งดี
    if (actualValue <= targetValue) {
      // ≤ เป้า → สีเขียว (ดี!)
      baseStyle.backgroundColor = '#bbf7d0' // green-200
      baseStyle.color = '#166534' // green-800
    } else if (actualValue <= targetValue * 1.2) {
      // เกินเป้าไม่เกิน 20% → สีแดง
      baseStyle.backgroundColor = '#fecaca' // red-200
      baseStyle.color = '#991b1b' // red-800
    } else {
      // เกินเป้ามากกว่า 20% → สีแดงเข้ม
      baseStyle.backgroundColor = '#fca5a5' // red-300
      baseStyle.color = '#7f1d1d' // red-900
    }
    
    return baseStyle
  }
  
  // ฟังก์ชันคำนวณสีสำหรับ Total_Messages และ Planned_Messages
  const getMessagesStyle = (row: SheetData, header: string, isSummaryRow: boolean = false): React.CSSProperties => {
    const baseStyle: React.CSSProperties = { 
      fontSize: '13px',
      fontWeight: isSummaryRow ? 'bold' : 'normal'
    }
    
    // Planned_Messages ไม่ใส่สี
    if (header === 'Planned_Messages') {
      return baseStyle
    }
    
    // เฉพาะ Total_Messages เท่านั้นที่มีสี
    if (header !== 'Total_Messages') {
      return baseStyle
    }
    
    // ดึงค่า Total_Messages และ Planned_Messages
    const actualMessages = parseFloat(String(row['Total_Messages'] || '0').replace(/,/g, ''))
    const plannedMessages = parseFloat(String(row['Planned_Messages'] || '0').replace(/,/g, ''))
    
    // ถ้าไม่มีแผนทัก หรือค่าไม่ถูกต้อง ไม่ใส่สี
    if (isNaN(actualMessages) || isNaN(plannedMessages) || plannedMessages === 0) {
      return baseStyle
    }
    
    // คำนวณ %
    const percentage = (actualMessages / plannedMessages) * 100
    
    // กำหนดสีตามเกณฑ์ใหม่
    if (percentage < 50) {
      // < 50% → สีแดงเข้ม
      baseStyle.backgroundColor = '#fca5a5' // red-300
      baseStyle.color = '#7f1d1d' // red-900
    } else if (percentage >= 50 && percentage < 80) {
      // 50-80% → สีแดง
      baseStyle.backgroundColor = '#fecaca' // red-200
      baseStyle.color = '#991b1b' // red-800
    } else if (percentage >= 80 && percentage < 100) {
      // 80-100% → สีส้ม
      baseStyle.backgroundColor = '#fed7aa' // orange-200
      baseStyle.color = '#9a3412' // orange-800
    } else {
      // ≥ 100% → สีเขียว
      baseStyle.backgroundColor = '#bbf7d0' // green-200
      baseStyle.color = '#166534' // green-800
    }
    
    return baseStyle
  }
  
  const getCellStyle = (row: SheetData, header: string): React.CSSProperties => {
    // ถ้าเป็นคอลัมน์ %KPI/Budget ให้ใช้สีพิเศษ
    if (header === 'KPI_Budget_Used') {
      const value = row[header] || ''
      return getKPIBudgetStyle(value)
    }
    
    // ถ้าเป็นคอลัมน์ CPM ให้ใช้สีตาม % เทียบกับเป้า
    if (header === 'CPM') {
      return getCPMStyle(row)
    }
    
    // ถ้าเป็นคอลัมน์ Cost_per_Top_up_Pure ให้ใช้สีตาม % เทียบกับเป้า
    if (header === 'Cost_per_Top_up_Pure') {
      return getCostPerTopupStyle(row)
    }
    
    // ถ้าเป็นคอลัมน์ Total_Messages ให้ใช้สีตาม %
    if (header === 'Total_Messages') {
      return getMessagesStyle(row, header)
    }
    
    // ถ้าเป็นคอลัมน์ Lost_Messages, Duplicate, Under_18 ให้ใช้สีตามเป้า %
    if (header === 'Lost_Messages' || header === 'Duplicate' || header === 'Under_18') {
      return getQualityMetricsStyle(row, header)
    }
    
    const style: React.CSSProperties = { fontSize: '13px' }
    let team = row['team'] || row['Team'] || row['ทีม'] || ''
    if (activeTab === 'adser' && teamFilter) {
      team = teamFilter
    }
    const relevantRules = colorRules
      .filter(rule => 
        rule.isActive && 
        rule.columnName === header && 
        (rule.team === team || rule.team === 'ทั้งหมด')
      )
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority
        if (a.team === team && b.team !== team) return -1
        if (b.team === team && a.team !== team) return 1
        return 0
      })
    if (relevantRules.length === 0) return style
    const value = row[header] || ''
    let numValue = parseFloat(String(value).replace(/[$,]/g, ''))
    if (isNaN(numValue)) return style
    for (const rule of relevantRules) {
      let testValue = numValue
      if (rule.unitType === 'PERCENT') {
        const totalMessages = parseFloat(row['Total_Messages'] || '0')
        if (!isNaN(totalMessages) && totalMessages > 0) {
          testValue = (numValue / totalMessages) * 100
        }
      }
      let matchCondition = false
      if (rule.conditionType === 'GREATER') {
        matchCondition = testValue >= rule.value1
      } else if (rule.conditionType === 'LESS') {
        matchCondition = testValue <= rule.value1
      } else if (rule.conditionType === 'BETWEEN' && rule.value2 !== null && rule.value2 !== undefined) {
        matchCondition = testValue >= rule.value1 && testValue <= rule.value2
      }
      if (matchCondition) {
        style.backgroundColor = rule.color
        style.color = rule.textColor
        if (rule.isBold) {
          style.fontWeight = 'bold'
        }
        break // ใช้กฎแรกที่ match
      }
    }
    return style
  }
  const getSummaryCellStyle = (header: string, value: string): React.CSSProperties => {
    // ถ้าเป็นคอลัมน์ %KPI/Budget ให้ใช้สีพิเศษ
    if (header === 'KPI_Budget_Used') {
      return getKPIBudgetStyle(value, true) // true = summary row
    }
    
    // ถ้าเป็นคอลัมน์ CPM ในแถวรวม
    if (header === 'CPM') {
      // สร้าง row object จาก summaryRow
      const summaryRowData: SheetData = {}
      displayHeaders.forEach(h => {
        summaryRowData[h] = summaryRow[h] || ''
      })
      return getCPMStyle(summaryRowData, true) // true = summary row
    }
    
    // ถ้าเป็นคอลัมน์ Cost_per_Top_up_Pure ในแถวรวม
    if (header === 'Cost_per_Top_up_Pure') {
      // สร้าง row object จาก summaryRow
      const summaryRowData: SheetData = {}
      displayHeaders.forEach(h => {
        summaryRowData[h] = summaryRow[h] || ''
      })
      return getCostPerTopupStyle(summaryRowData, true) // true = summary row
    }
    
    // ถ้าเป็นคอลัมน์ Total_Messages ในแถวรวม
    if (header === 'Total_Messages') {
      // สร้าง row object จาก summaryRow
      const summaryRowData: SheetData = {}
      displayHeaders.forEach(h => {
        summaryRowData[h] = summaryRow[h] || ''
      })
      return getMessagesStyle(summaryRowData, header, true) // true = summary row
    }
    
    // ถ้าเป็นคอลัมน์ Lost_Messages, Duplicate, Under_18 ในแถวรวม
    if (header === 'Lost_Messages' || header === 'Duplicate' || header === 'Under_18') {
      // สร้าง row object จาก summaryRow
      const summaryRowData: SheetData = {}
      displayHeaders.forEach(h => {
        summaryRowData[h] = summaryRow[h] || ''
      })
      return getQualityMetricsStyle(summaryRowData, header, true) // true = summary row
    }
    
    const style: React.CSSProperties = { 
      fontSize: '13px', 
      
      backgroundColor: 'hsl(var(--primary) / 0.1)', // สีของ theme หลักแบบโปร่งใส 10%
      color: 'hsl(var(--foreground))', // สีข้อความตาม theme
    }
    const team = teamFilter
    const relevantRules = colorRules
      .filter(rule => 
        rule.isActive && 
        rule.columnName === header && 
        (rule.team === team || rule.team === 'ทั้งหมด')
      )
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority
        if (a.team === team && b.team !== team) return -1
        if (b.team === team && a.team !== team) return 1
        return 0
      })
    if (relevantRules.length === 0) return style
    let numValue = parseFloat(String(value).replace(/[$,%]/g, ''))
    if (isNaN(numValue)) return style
    for (const rule of relevantRules) {
      let testValue = numValue
      let matchCondition = false
      if (rule.conditionType === 'GREATER') {
        matchCondition = testValue >= rule.value1
      } else if (rule.conditionType === 'LESS') {
        matchCondition = testValue <= rule.value1
      } else if (rule.conditionType === 'BETWEEN' && rule.value2 !== null && rule.value2 !== undefined) {
        matchCondition = testValue >= rule.value1 && testValue <= rule.value2
      }
      if (matchCondition) {
        style.backgroundColor = rule.color
        style.color = rule.textColor
        if (rule.isBold) {
          style.fontWeight = 'bold'
        }
        break
      }
    }
    return style
  }
  
  // ใช้ useMemo เพื่อคำนวณ summary row ใหม่เมื่อ displayData หรือ displayHeaders เปลี่ยน
  const summaryRow = useMemo(() => {
    const summary: { [key: string]: string } = {}
    displayHeaders.forEach(header => {
      if (header === 'Date' || header === 'วันที่' || header === 'date') {
        summary[header] = 'รวม'
        return
      }
      if (header === 'CPM') {
        const totalSpend = displayData
          .map(row => parseFloat(String(row['Spend'] || '0').replace(/[$,]/g, '')))
          .filter(v => !isNaN(v))
          .reduce((sum, v) => sum + v, 0)
        const totalMessages = displayData
          .map(row => parseFloat(String(row['Total_Messages'] || '0').replace(/,/g, '')))
          .filter(v => !isNaN(v))
          .reduce((sum, v) => sum + v, 0)
        if (totalMessages > 0) {
          summary[header] = (totalSpend / totalMessages).toFixed(2)
        } else {
          summary[header] = '0.00'
        }
        return
      }
      if (header === 'Cost_per_Message_(Meta)') {
        const totalSpend = displayData
          .map(row => parseFloat(String(row['Spend'] || '0').replace(/[$,]/g, '')))
          .filter(v => !isNaN(v))
          .reduce((sum, v) => sum + v, 0)
        const totalMessagesMeta = displayData
          .map(row => parseFloat(String(row['Messages(Meta)'] || '0').replace(/,/g, '')))
          .filter(v => !isNaN(v))
          .reduce((sum, v) => sum + v, 0)
        if (totalMessagesMeta > 0) {
          summary[header] = (totalSpend / totalMessagesMeta).toFixed(2)
        } else {
          summary[header] = '0.00'
        }
        return
      }
      if (header === 'Cost_per_Top_up_Pure') {
        const totalSpend = displayData
          .map(row => parseFloat(String(row['Spend'] || '0').replace(/[$,]/g, '')))
          .filter(v => !isNaN(v))
          .reduce((sum, v) => sum + v, 0)
        const totalTopUp = displayData
          .map(row => parseFloat(String(row['Top-up'] || '0').replace(/,/g, '')))
          .filter(v => !isNaN(v))
          .reduce((sum, v) => sum + v, 0)
        if (totalTopUp > 0) {
          summary[header] = (totalSpend / totalTopUp).toFixed(2)
        } else {
          summary[header] = '0.00'
        }
        return
      }
      if (header === 'USD_Cover') {
        const totalRevenue = displayData
          .map(row => parseFloat(String(row['New Player Revenue (THB)'] || '0').replace(/[฿$,]/g, '')))
          .filter(v => !isNaN(v))
          .reduce((sum, v) => sum + v, 0)
        const totalSpend = displayData
          .map(row => parseFloat(String(row['Spend'] || '0').replace(/[$,]/g, '')))
          .filter(v => !isNaN(v))
          .reduce((sum, v) => sum + v, 0)
        const totalSpendInTHB = totalSpend * exchangeRate
        if (totalSpendInTHB > 0) {
          summary[header] = '$' + (totalRevenue / totalSpendInTHB).toFixed(2)
        } else {
          summary[header] = '$0.00'
        }
        return
      }
      
      // คำนวณ %KPI/Budget สำหรับแถวรวม
      if (header === 'KPI_Budget_Used') {
        const totalMessages = displayData
          .map(row => parseFloat(row['Total_Messages'] || '0'))
          .filter(v => !isNaN(v))
          .reduce((sum, v) => sum + v, 0)
        
        const totalSpend = displayData
          .map(row => parseFloat((row['Spend'] || '0').toString().replace(/[฿$,]/g, '')))
          .filter(v => !isNaN(v))
          .reduce((sum, v) => sum + v, 0)
        
        if (currentTargetsRef.current.cpmTarget > 0 && totalSpend > 0) {
          const kpiValue = (totalMessages / (totalSpend / currentTargetsRef.current.cpmTarget)) * 100
          summary[header] = kpiValue.toFixed(2) + '%'
        } else {
          summary[header] = '0.00%'
        }
        return
      }
      
      const sampleValue = displayData.find(row => row[header])
      const hasPercentSign = sampleValue ? String(sampleValue[header] || '').includes('%') : false
      const isPercentageColumn = percentageColumns.includes(header)
      
      // แก้ไข: ไม่ให้ percentage columns ในโหมด percent ไปอยู่ใน isAverageCol
      const isAverageCol = hasPercentSign || 
                           header.includes('KPI') ||
                           header === 'Cost_per_Message_(Meta)' ||
                           (displayMode === 'percent' && isPercentageColumn && false) // ปิดเพื่อให้ไปใช้ logic ใหม่
      
      // คอลัมน์ที่ต้องจัดรูปแบบตัวเลข (แต่ต้องตรวจสอบโหมด percentage ก่อน)
      const numberColumns = [
        'Planned_Messages',
        'Total_Messages',
        'Messages(Meta)',
        'Lost_Messages',
        'Net_Messages_Pure',
        'Page_Blocks_7Days',
        'Page_Blocks_30Days',
        'Silent',
        'Duplicate',
        'Has_User',
        'Spam',
        'Blocked',
        'Under_18',
        'Over_50',
        'Foreign'
      ]
      
      const values = displayData
        .map(row => {
          const val = row[header] || ''
          return parseFloat(String(val).replace(/[฿$,%]/g, ''))
        })
        .filter(v => !isNaN(v))
      if (values.length === 0) {
        summary[header] = '-'
        return
      }
      
      // ยอดเล่นใหม่(฿) - แสดงทศนิยม 2 ตำแหน่ง
      if (header === 'New Player Revenue (THB)') {
        const sum = values.reduce((sum, v) => sum + v, 0)
        summary[header] = '฿' + sum.toLocaleString('en-US', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })
        return
      }
      
      // ตรวจสอบว่าเป็น percentage columns และอยู่ในโหมด percent หรือไม่
      if (displayMode === 'percent' && percentageColumns.includes(header)) {
        // คำนวณ percentage สำหรับ Total row
        const sum = values.reduce((sum, v) => sum + v, 0)
        const totalMessagesSum = displayData
          .map(row => parseFloat(String(row['Total_Messages'] || '0').replace(/,/g, '')))
          .filter(v => !isNaN(v))
          .reduce((sum, v) => sum + v, 0)
        
        if (totalMessagesSum > 0) {
          const percentValue = (sum / totalMessagesSum) * 100
          summary[header] = percentValue.toFixed(2) + '%'
        } else {
          summary[header] = '0.00%'
        }
        return
      }
      
      // คอลัมน์ตัวเลขทั่วไป - แสดงแบบ ##,###
      if (numberColumns.includes(header)) {
        const sum = values.reduce((sum, v) => sum + v, 0)
        summary[header] = sum.toLocaleString('en-US', { 
          minimumFractionDigits: 0, 
          maximumFractionDigits: 0 
        })
        return
      }
      
      if (isAverageCol) {
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length
        if (displayMode === 'percent' && isPercentageColumn) {
          const totalMessagesValues = displayData
            .map(row => parseFloat(row['Total_Messages'] || '0'))
            .filter(v => !isNaN(v) && v > 0)
          if (totalMessagesValues.length > 0) {
            const avgTotal = totalMessagesValues.reduce((sum, v) => sum + v, 0) / totalMessagesValues.length
            const percentValue = (avg / avgTotal) * 100
            summary[header] = percentValue.toFixed(2) + '%'
          } else {
            summary[header] = avg.toFixed(2) + '%'
          }
        }
        else if (hasPercentSign) {
          summary[header] = avg.toFixed(2) + '%'
        } 
        else if (displayData[0] && String(displayData[0][header] || '').includes('$')) {
          summary[header] = '$' + avg.toFixed(2)
        }
        else if (displayData[0] && String(displayData[0][header] || '').includes('฿')) {
          summary[header] = '฿' + avg.toFixed(2)
        }
        else {
          summary[header] = avg.toFixed(2)
        }
      } else {
        const sum = values.reduce((sum, v) => sum + v, 0)
        // สำหรับคอลัมน์อื่นๆ ที่ไม่ใช่ percentage columns ในโหมด percent
        if (displayData[0] && String(displayData[0][header] || '').includes('$')) {
          summary[header] = '$' + sum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        } 
        else if (displayData[0] && String(displayData[0][header] || '').includes('฿')) {
          summary[header] = '฿' + sum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        } 
        else {
          summary[header] = sum.toLocaleString('en-US', { maximumFractionDigits: 2 })
        }
      }
    })
    return summary
  }, [displayData, displayHeaders, displayMode, exchangeRate])
  
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
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {}
        <div 
          className={`
            ${isSidebarCollapsed ? 'lg:col-span-0 opacity-0 w-0' : 'lg:col-span-1 opacity-100'} 
            transition-all duration-500 ease-in-out overflow-hidden self-start
          `}
        >
          {!isSidebarCollapsed && (
            <Card className="animate-in fade-in slide-in-from-left-5 duration-300 relative">
              <CardHeader>
              </CardHeader>
              <CardContent className="space-y-4">
              {}
              <div className="grid grid-cols-2 gap-3">
                {}
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
                {}
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
              {}
              <div className="grid grid-cols-2 gap-3">
                {}
                <div className="space-y-2">
                  <Label htmlFor="filter-display" className="text-sm font-medium">
                    ตัวเลือกดู
                  </Label>
                  <Select value={displayMode} onValueChange={(value: 'number' | 'percent') => setDisplayMode(value)}>
                    <SelectTrigger id="filter-display" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">จำนวน</SelectItem>
                      <SelectItem value="percent">เปอร์เซ็นต์</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {}
                <div className="space-y-2">
                  <Label htmlFor="filter-team" className="text-sm font-medium">
                    ทีม
                  </Label>
                  <Select value={teamFilter} onValueChange={handleTeamFilterChange}>
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
              {/* เป้าหมายของทีม */}
              {teamFilter && (
                <div className="pt-3 border-t space-y-3">
                  <Label className="text-sm font-medium">
                    เป้าหมายของทีม: {teamFilter}
                  </Label>
                  
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <Label htmlFor="target-cover" className="text-xs text-muted-foreground">
                      เป้ายอด Cover ($)
                    </Label>
                    {userRole === 'ADMIN' ? (
                      <Input
                        id="target-cover"
                        type="number"
                        step="0.01"
                        value={currentTargets.coverTarget}
                        onChange={(e) => updateTeamTarget('coverTarget', parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs"
                      />
                    ) : (
                      <div className="text-xs">{currentTargets.coverTarget.toFixed(2)}</div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <Label htmlFor="target-cpm" className="text-xs text-muted-foreground">
                      เป้ายอด CPM
                    </Label>
                    {userRole === 'ADMIN' ? (
                      <Input
                        id="target-cpm"
                        type="number"
                        step="0.01"
                        value={currentTargets.cpmTarget}
                        onChange={(e) => updateTeamTarget('cpmTarget', parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs"
                      />
                    ) : (
                      <div className="text-xs">{currentTargets.cpmTarget.toFixed(2)}</div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <Label htmlFor="target-topup" className="text-xs text-muted-foreground">
                      เป้าต้นทุนเติม
                    </Label>
                    {userRole === 'ADMIN' ? (
                      <Input
                        id="target-topup"
                        type="number"
                        step="0.01"
                        value={currentTargets.costPerTopupTarget}
                        onChange={(e) => updateTeamTarget('costPerTopupTarget', parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs"
                      />
                    ) : (
                      <div className="text-xs">{currentTargets.costPerTopupTarget.toFixed(2)}</div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <Label htmlFor="target-lost" className="text-xs text-muted-foreground">
                      เป้ายอดเสีย (%)
                    </Label>
                    {userRole === 'ADMIN' ? (
                      <div className="relative">
                        <Input
                          id="target-lost"
                          type="number"
                          step="0.1"
                          value={currentTargets.lostMessagesTarget}
                          onChange={(e) => updateTeamTarget('lostMessagesTarget', parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs pr-6"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                      </div>
                    ) : (
                      <div className="text-xs">{currentTargets.lostMessagesTarget.toFixed(1)}%</div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <Label htmlFor="target-duplicate" className="text-xs text-muted-foreground">
                      เป้าทักซ้ำ (%)
                    </Label>
                    {userRole === 'ADMIN' ? (
                      <div className="relative">
                        <Input
                          id="target-duplicate"
                          type="number"
                          step="0.1"
                          value={currentTargets.duplicateTarget}
                          onChange={(e) => updateTeamTarget('duplicateTarget', parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs pr-6"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                      </div>
                    ) : (
                      <div className="text-xs">{currentTargets.duplicateTarget.toFixed(1)}%</div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <Label htmlFor="target-under18" className="text-xs text-muted-foreground">
                      เป้าเด็ก (%)
                    </Label>
                    {userRole === 'ADMIN' ? (
                      <div className="relative">
                        <Input
                          id="target-under18"
                          type="number"
                          step="0.1"
                          value={currentTargets.under18Target}
                          onChange={(e) => updateTeamTarget('under18Target', parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs pr-6"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                      </div>
                    ) : (
                      <div className="text-xs">{currentTargets.under18Target.toFixed(1)}%</div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <Label htmlFor="target-rate" className="text-xs text-muted-foreground">
                      Rate $ / ฿
                    </Label>
                    <div className="text-xs font-medium text-primary">
                      1$ = ฿{exchangeRate.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
              {}
              {userRole === 'ADMIN' && (
                <div className="pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowColorSettings(!showColorSettings)}
                    className="w-full"
                  >
                    {showColorSettings ? 'ซ่อน' : 'แสดง'}การตั้งค่าสี
                  </Button>
                </div>
              )}
              {}
              {showColorSettings && (
                <div className="pt-3 border-t space-y-3 max-h-[500px] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      กฎการใส่สีของ: <span className="font-bold text-foreground">{teamFilter}</span>
                    </p>
                  </div>
                  {}
                  {colorableColumns.map((column) => {
                    const rulesForColumn = colorRules.filter(
                      rule => rule.team === teamFilter && rule.columnName === column && rule.isActive
                    ).sort((a, b) => a.priority - b.priority)
                    return (
                      <div key={column} className="space-y-2 p-3 border rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold">{translateHeader(column)}</Label>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async (e) => {
                              e.preventDefault()
                              console.log('Adding rule for team:', teamFilter, 'column:', column)
                              const newRule = {
                                team: teamFilter,
                                columnName: column,
                                conditionType: 'GREATER',
                                unitType: 'NUMBER',
                                value1: 0,
                                value2: null,
                                color: '#ef4444',
                                textColor: '#ffffff',
                                isBold: false,
                                priority: rulesForColumn.length,
                                isActive: true
                              }
                              try {
                                const res = await fetch('/api/color-rules', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(newRule)
                                })
                                if (res.ok) {
                                  const result = await res.json()
                                  console.log('Rule created:', result)
                                  await fetchColorRules() // รีเฟรช
                                } else {
                                  const error = await res.json()
                                  console.error('Error response:', error)
                                }
                              } catch (err) {
                                console.error('Error adding rule:', err)
                              }
                            }}
                            className="h-6 text-xs hover:bg-primary hover:text-primary-foreground"
                          >
                            + เพิ่มกฎ
                          </Button>
                        </div>
                        {}
                        {rulesForColumn.length === 0 && (
                          <p className="text-xs text-muted-foreground italic">ยังไม่มีกฎ (คลิก + เพิ่มกฎ)</p>
                        )}
                        {rulesForColumn.map((rule, index) => {
                          const currentRule = editingRules[rule.id!] ? { ...rule, ...editingRules[rule.id!] } : rule
                          return (
                          <div key={rule.id} className="space-y-2 p-2 border rounded bg-background">
                            <div className="flex items-center justify-between">
                              <Label className="text-[10px] text-muted-foreground">กฎ #{index + 1}</Label>
                              <div className="flex gap-1">
                                {hasChanges(rule.id!) && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => saveRuleChanges(rule.id!)}
                                    className="h-5 px-2 text-xs"
                                  >
                                    💾 บันทึก
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={async () => {
                                    if (confirm('ลบกฎนี้?')) {
                                      try {
                                        const res = await fetch(`/api/color-rules/${rule.id}`, {
                                          method: 'DELETE'
                                        })
                                        if (res.ok) {
                                          fetchColorRules()
                                        }
                                      } catch (err) {
                                        console.error('Error deleting rule:', err)
                                      }
                                    }
                                  }}
                                  className="h-5 px-2 text-xs text-destructive"
                                >
                                  ลบ
                                </Button>
                              </div>
                            </div>
                            {}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-[9px] text-muted-foreground">เงื่อนไข</Label>
                                <Select
                                  value={currentRule.conditionType}
                                  onValueChange={(value: 'GREATER' | 'LESS' | 'BETWEEN') => {
                                    updateRuleField(rule.id!, 'conditionType', value)
                                  }}
                                >
                                  <SelectTrigger className="h-6 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="GREATER">มากกว่า ≥</SelectItem>
                                    <SelectItem value="LESS">น้อยกว่า ≤</SelectItem>
                                    <SelectItem value="BETWEEN">ระหว่าง</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] text-muted-foreground">หน่วย</Label>
                                <Select
                                  value={currentRule.unitType}
                                  onValueChange={(value: 'NUMBER' | 'PERCENT') => {
                                    updateRuleField(rule.id!, 'unitType', value)
                                  }}
                                >
                                  <SelectTrigger className="h-6 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="NUMBER">จำนวน</SelectItem>
                                    <SelectItem value="PERCENT">%</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {}
                            <div className={`grid ${currentRule.conditionType === 'BETWEEN' ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                              <div className="space-y-1">
                                <Label className="text-[9px] text-muted-foreground">
                                  {currentRule.conditionType === 'BETWEEN' ? 'ค่าต่ำสุด' : 'ค่า'}
                                </Label>
                                <Input
                                  type="number"
                                  value={currentRule.value1}
                                  onChange={(e) => {
                                    updateRuleField(rule.id!, 'value1', parseFloat(e.target.value) || 0)
                                  }}
                                  className="h-6 text-xs"
                                />
                              </div>
                              {currentRule.conditionType === 'BETWEEN' && (
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-muted-foreground">ค่าสูงสุด</Label>
                                  <Input
                                    type="number"
                                    value={currentRule.value2 || 0}
                                    onChange={(e) => {
                                      updateRuleField(rule.id!, 'value2', parseFloat(e.target.value) || 0)
                                    }}
                                    className="h-6 text-xs"
                                  />
                                </div>
                              )}
                            </div>
                            {}
                            <div className="space-y-2">
                              {}
                              <div className="space-y-1">
                                <Label className="text-[9px] text-muted-foreground">สีแนะนำ</Label>
                                <div className="flex gap-1">
                                  {presetColors.map((preset) => (
                                    <button
                                      key={preset.name}
                                      onClick={() => {
                                        updateRuleField(rule.id!, 'color', preset.bg)
                                        updateRuleField(rule.id!, 'textColor', preset.text)
                                      }}
                                      className="w-8 h-6 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
                                      style={{ backgroundColor: preset.bg, color: preset.text }}
                                      title={preset.name}
                                    >
                                      <span className="text-[10px] font-bold">A</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-muted-foreground">สีพื้น</Label>
                                  <Input
                                    type="color"
                                    value={currentRule.color}
                                    onChange={(e) => {
                                      updateRuleField(rule.id!, 'color', e.target.value)
                                    }}
                                    className="h-6"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-muted-foreground">สีตัวอักษร</Label>
                                  <Input
                                    type="color"
                                    value={currentRule.textColor}
                                    onChange={(e) => {
                                      updateRuleField(rule.id!, 'textColor', e.target.value)
                                    }}
                                    className="h-6"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-muted-foreground">ตัวหนา</Label>
                                  <Button
                                    variant={currentRule.isBold ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                      updateRuleField(rule.id!, 'isBold', !currentRule.isBold)
                                    }}
                                    className="h-6 w-full text-xs"
                                  >
                                    {currentRule.isBold ? 'เปิด' : 'ปิด'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                        })}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          )}
        </div>
        {}
        <div className={`
          ${isSidebarCollapsed ? 'lg:col-span-6' : 'lg:col-span-5'} 
          transition-all duration-500 ease-in-out space-y-4 self-start
        `}>
          {}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">เกิดข้อผิดพลาด</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  กรุณาตรวจสอบ:
                  <br />• Google Sheets ถูกตั้งค่าเป็น "Anyone with the link can view"
                  <br />• GOOGLE_API_KEY ถูกตั้งค่าใน .env.local
                  <br />• ชีต "gateway_team" มีอยู่ใน Spreadsheet
                  <br />• Spreadsheet ID: 1Hgcsr5vZXQZr0pcRBxsSC3eBxEzABkYBe6pn-RQQG8o
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {}
      <Card className="relative">
        {}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute left-3 top-4 z-10 h-8 w-8 rounded-full bg-background border shadow-md hover:bg-accent transition-all duration-200"
          title={isSidebarCollapsed ? "แสดงฟิลเตอร์" : "ซ่อนฟิลเตอร์"}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
        <CardHeader className="pl-14">
          {}
          {teamFilter && (
            <div className="flex items-center justify-between gap-4 mb-4 border-b pb-2">
              <div className="flex gap-2 overflow-x-auto flex-1">
                {}
                <button
                  onClick={() => {
                    // บันทึก scroll position ก่อนสลับ (ทั้งแนวตั้งและแนวนอน)
                    if (bodyScrollRef.current) {
                      setSavedScrollPosition(bodyScrollRef.current.scrollTop)
                      setSavedScrollLeft(bodyScrollRef.current.scrollLeft)
                      console.log('💾 Click: Saving scroll', bodyScrollRef.current.scrollTop, bodyScrollRef.current.scrollLeft)
                    }
                    setActiveTab('team')
                  }}
                  className={`px-4 py-2 font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === 'team'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ทีม ({teamFilter})
                </button>
                {}
                {adserList.map((adser) => (
                  <button
                    key={adser}
                    onClick={() => {
                      // บันทึก scroll position ก่อนสลับ (ทั้งแนวตั้งและแนวนอน)
                      if (bodyScrollRef.current) {
                        setSavedScrollPosition(bodyScrollRef.current.scrollTop)
                        setSavedScrollLeft(bodyScrollRef.current.scrollLeft)
                        console.log('💾 Click: Saving scroll', bodyScrollRef.current.scrollTop, bodyScrollRef.current.scrollLeft)
                      }
                      setActiveTab('adser')
                      setSelectedAdser(adser)
                    }}
                    className={`px-4 py-2 font-medium transition-colors relative whitespace-nowrap ${
                      activeTab === 'adser' && selectedAdser === adser
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {adser}
                  </button>
                ))}
              </div>
              {}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeTab === 'team') {
                    fetchData(false)
                  } else {
                    fetchAdserData(false)
                  }
                }}
                disabled={isLoading}
                className="flex-shrink-0"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                รีเฟรช
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {displayData.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">ไม่มีข้อมูล</p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm transition-opacity duration-200" style={{ opacity: isLoading ? 0.5 : 1 }}>
              {}
              <div 
                ref={headerScrollRef} 
                className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                style={{ paddingRight: `${scrollbarWidth}px` }}
              >
                <table className="w-full" style={{ tableLayout: 'fixed', width: '100%', borderSpacing: 0 }}>
                  <colgroup>
                    {displayHeaders.map((header, index) => (
                      <col key={index} style={{ width: `${getColumnWidth(header)}px` }} />
                    ))}
                  </colgroup>
                  <thead className="bg-white dark:bg-gray-950">
                    {}
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      {displayHeaders.map((header, index) => {
                        let zoneName = ''
                        let isFirstInZone = false
                        let colspan = 1
                        if (header === 'Date') {
                          zoneName = ''
                          isFirstInZone = true
                          colspan = 1
                        } else if (header === 'KPI_Budget_Used' || header === 'KPI_Budget Used') {
                          zoneName = 'ยอดทัก'
                          isFirstInZone = true
                          const zoneColumns = ['KPI_Budget_Used', 'KPI_Budget Used', 'Planned_Messages', 'Total_Messages', 'Messages(Meta)', 'Lost_Messages', 'Net_Messages']
                          colspan = zoneColumns.filter(col => displayHeaders.includes(col)).length
                        } else if (header === 'Planned_Spend/Day') {
                          zoneName = 'ค่าใช้จ่าย'
                          isFirstInZone = true
                          const zoneColumns = ['Planned_Spend/Day', 'Spend']
                          colspan = zoneColumns.filter(col => displayHeaders.includes(col)).length
                        } else if (header === 'CPM') {
                          zoneName = 'ประสิทธิภาพ'
                          isFirstInZone = true
                          const zoneColumns = ['CPM', 'Cost_per_Message_(Meta)', 'Top-up', 'Messages_per_Top_up', 'Messages_per_Top-up', 'Quality_Messages_per_Top_up', 'Quality_Messages_per_Top-up', 'Cost_per_Top_up_Pure']
                          colspan = zoneColumns.filter(col => displayHeaders.includes(col)).length
                        } else if (header === 'New Player Revenue (THB)') {
                          zoneName = 'ยอดเล่น'
                          isFirstInZone = true
                          const zoneColumns = ['New Player Revenue (THB)', 'USD_Cover']
                          colspan = zoneColumns.filter(col => displayHeaders.includes(col)).length
                        } else if (header === 'Page_Blocks_7Days') {
                          zoneName = 'ยอดเสีย'
                          isFirstInZone = true
                          const zoneColumns = ['Page_Blocks_7Days', 'Page_Blocks_30Days', 'Silent', 'Duplicate', 'Has_User', 'Spam', 'Blocked', 'Under_18', 'Over_50', 'Foreign']
                          colspan = zoneColumns.filter(col => displayHeaders.includes(col)).length
                        }
                        if (isFirstInZone) {
                          return (
                            <th
                              key={index}
                              colSpan={colspan}
                              className={`py-1.5 text-center text-gray-500 dark:text-gray-400 text-xs tracking-wider uppercase border-r border-r-gray-100 dark:border-r-gray-800 ${
                                isZoneStart(header) 
                                  ? 'border-l-2 border-l-gray-300 dark:border-l-gray-700 pl-3 pr-3' 
                                  : 'border-l border-l-gray-100 dark:border-l-gray-800 px-3'
                              }`}
                              style={{ fontWeight: 'normal' }}
                            >
                              {zoneName}
                            </th>
                          )
                        }
                        return null
                      })}
                    </tr>
                    {}
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      {displayHeaders.map((header, index) => (
                        <th
                          key={index}
                          className={`py-1.5 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 text-sm border-r border-r-gray-100 dark:border-r-gray-800 ${
                            isRightAlign(header) ? 'text-right' : 'text-center'
                          } ${
                            isZoneStart(header) 
                              ? 'border-l-2 border-l-gray-300 dark:border-l-gray-700 pl-3 pr-3' 
                              : 'border-l border-l-gray-100 dark:border-l-gray-800 px-3'
                          }`}
                          style={{ 
                            width: `${getColumnWidth(header)}px`,
                            minWidth: `${getColumnWidth(header)}px`,
                            fontWeight: 'normal',
                          }}
                        >
                          <span className="break-all text-wrap leading-tight">{translateHeader(header)}</span>
                        </th>
                      ))}
                    </tr>
                    {}
                    <tr className="border-b-2 border-gray-900 dark:border-gray-100 bg-gray-100 dark:bg-gray-900">
                      {displayHeaders.map((header, colIndex) => {
                        const summaryValue = summaryRow[header] || '-'
                        const cellStyle = getSummaryCellStyle(header, summaryValue)
                        return (
                          <th
                            key={colIndex}
                            className={`py-1.5 text-gray-900 dark:text-gray-100 text-sm border-r border-r-gray-100 dark:border-r-gray-800 ${
                              isRightAlign(header) ? 'text-right' : 'text-center'
                            } ${
                              isZoneStart(header) 
                                ? 'border-l-2 border-l-gray-300 dark:border-l-gray-700 pl-3 pr-3' 
                                : 'border-l border-l-gray-100 dark:border-l-gray-800 px-3'
                            }`}
                            style={{
                              ...cellStyle,
                              width: `${getColumnWidth(header)}px`,
                              minWidth: `${getColumnWidth(header)}px`,
                              fontWeight: 'normal',
                            }}
                          >
                            {summaryValue}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                </table>
              </div>
              {}
              <div 
                ref={bodyScrollRef} 
                className="overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-700"
                style={{ maxHeight: '500px' }}
              >
                <table className="w-full" style={{ tableLayout: 'fixed', width: '100%', borderSpacing: 0 }}>
                  <colgroup>
                    {displayHeaders.map((header, index) => (
                      <col key={index} style={{ width: `${getColumnWidth(header)}px` }} />
                    ))}
                  </colgroup>
                  <tbody>
                    {}
                    {displayData.map((row, rowIndex) => {
                      const dateValue = row['วันที่'] || row['Date'] || row['date'] || row['วัน'] || ''
                      const isTodayRow = isToday(String(dateValue))
                      return (
                        <tr
                          key={rowIndex}
                          className={`border-b border-gray-100 dark:border-gray-800 transition-all duration-150 ${
                            isTodayRow
                              ? 'bg-orange-400 dark:bg-orange-700/70 hover:bg-orange-500 dark:hover:bg-orange-700/90' 
                              : rowIndex % 2 === 0 
                                ? 'bg-gray-50 dark:bg-gray-900/20 hover:bg-gray-100 dark:hover:bg-gray-900/40'
                                : 'bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900/50'
                          }`}
                        >
                          {displayHeaders.map((header, colIndex) => {
                            const displayValue = getDisplayValue(row, header)
                            const cellStyle = getCellStyle(row, header)
                            return (
                              <td
                                key={colIndex}
                                className={`py-1.5 text-sm text-gray-700 dark:text-gray-300 border-r border-r-gray-100 dark:border-r-gray-800 ${
                                  isRightAlign(header) ? 'text-right' : 'text-center'
                                } ${
                                  isZoneStart(header) 
                                    ? 'border-l-2 border-l-gray-300 dark:border-l-gray-700 pl-3 pr-3' 
                                    : 'border-l border-l-gray-100 dark:border-l-gray-800 px-3'
                                }`}
                                style={{
                                  ...cellStyle,
                                  width: `${getColumnWidth(header)}px`,
                                  minWidth: `${minColumnWidth}px`,
                                  maxWidth: `${getColumnWidth(header)}px`,
                                }}
                              >
                                <div className="leading-tight" title={row[header] || ''}>
                                  {displayValue}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {}
          {displayData.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              อัพเดทล่าสุด: {lastRefreshTime.toLocaleTimeString('th-TH')} | รีเฟรชอัตโนมัติทุก 30 วินาที
            </p>
          )}
        </CardContent>
      </Card>
      </div>
      </div>
    </div>
  )
}
