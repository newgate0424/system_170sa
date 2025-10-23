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
  'KPI_Budget Used': { th: '%KPI/Budget', en: 'KPI_Budget Used' },
  'Planned_Messages': { th: 'แผนทัก', en: 'Planned_Messages' },
  'Total_Messages': { th: 'ยอดทัก', en: 'Total_Messages' },
  'Messages(Meta)': { th: 'ยอดทัก(Meta)', en: 'Messages(Meta)' },
  'Lost_Messages': { th: 'ยอดเสีย', en: 'Lost_Messages' },
  'Net_Messages': { th: 'ทักบริสุทธิ์', en: 'Net_Messages' },
  'Net_Messages_Pure': { th: 'ยอดทักบริสุทธิ', en: 'Net_Messages_Pure' },
  'Planned_Spend/Day': { th: 'แผนงบ', en: 'Planned_Spend/Day' },
  'Spend': { th: 'ค่าใช้จ่าย', en: 'Spend' },
  'CPM': { th: 'CPM', en: 'CPM' },
  'Cost_per_Message_(Meta)': { th: 'ทุนทัก(Meta)', en: 'Cost_per_Message_(Meta)' },
  'Top-up': { th: 'เติม', en: 'Top-up' },
  'Messages_per_Top_up': { th: 'ทัก/เติม', en: 'Messages_per_Top_up' },
  'Messages_per_Top-up': { th: 'ทัก/เติม', en: 'Messages_per_Top-up' },
  'Quality_Messages_per_Top_up': { th: 'ทักบริสุทธิ์ /เติม', en: 'Quality_Messages_per_Top_up' },
  'Quality_Messages_per_Top-up': { th: 'ทักคุณภาพ/เติม', en: 'Quality_Messages_per_Top-up' },
  'Cost_per_Top-up': { th: 'ต้นทุน/เติม', en: 'Cost_per_Top-up' },
  'Cost_per_Top_up_Pure': { th: 'ทุน/เติม', en: 'Cost_per_Top_up_Pure' },
  'New Player Revenue (THB)': { th: 'ยอดเล่นใหม่(฿)', en: 'New Player Revenue (THB)' },
  'USD_Cover': { th: '1$/Cover', en: 'USD_Cover' },
  'Page_Blocks_7Days': { th: 'เพจบล็อก 7วัน', en: 'Page_Blocks_7Days' },
  'Page_Blocks_30Days': { th: 'เพจบล็อก 30วัน', en: 'Page_Blocks_30Days' },
  'Silent': { th: 'ทักเงียบ', en: 'Silent' },
  'Duplicate': { th: 'ทักซ้ำ', en: 'Duplicate' },
  'Has_User': { th: 'มียูส', en: 'Has_User' },
  'Quality_Messages': { th: 'ข้อความคุณภาพ', en: 'Quality_Messages' },
  'Cost_per_Quality_Message': { th: 'ต้นทุน/ข้อความคุณภาพ', en: 'Cost_per_Quality_Message' },
  'Click(Meta)': { th: 'คลิก(Meta)', en: 'Click(Meta)' },
  'Link_Click(Meta)': { th: 'คลิกลิงก์(Meta)', en: 'Link_Click(Meta)' },
  'Landing_Click(Meta)': { th: 'คลิกหน้า Landing(Meta)', en: 'Landing_Click(Meta)' },
  'Spam': { th: 'ก่อกวน', en: 'Spam' },
  'Blocked': { th: 'บล็อก', en: 'Blocked' },
  'Under_18': { th: 'เด็ก', en: 'Under_18' },
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
  
  // เป้าหมายของแต่ละทีม
  interface TeamTargets {
    coverTarget: number
    cpmTarget: number
    costPerTopupTarget: number
    exchangeRate: number
  }
  
  const [currentTargets, setCurrentTargets] = useState<TeamTargets>({
    coverTarget: 1.0,
    cpmTarget: 15,
    costPerTopupTarget: 100,
    exchangeRate: 35
  })
  
  // โหลดเป้าหมายจากฐานข้อมูล
  const loadTeamTargets = async (team: string) => {
    if (!team) return
    
    try {
      console.log('📥 Loading team targets for:', team)
      const res = await fetch(`/api/team-targets?team=${encodeURIComponent(team)}`)
      const data = await res.json()
      
      console.log('📦 Received team targets:', data)
      
      if (data && !data.error) {
        const newTargets = {
          coverTarget: data.coverTarget || 1.0,
          cpmTarget: data.cpmTarget || 15,
          costPerTopupTarget: data.costPerTopupTarget || 100,
          exchangeRate: data.exchangeRate || 35
        }
        console.log('✅ Setting team targets:', newTargets)
        setCurrentTargets(newTargets)
      }
    } catch (error) {
      console.error('❌ Failed to load team targets:', error)
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
      
      // อัพเดต state ด้วยค่าที่บันทึกสำเร็จแล้ว
      setCurrentTargets(result)
    } catch (error) {
      console.error('❌ Failed to save team targets:', error)
    }
  }
  
  // โหลดเป้าหมายเมื่อเปลี่ยนทีม
  useEffect(() => {
    console.log('🔄 useEffect triggered:', { teamFilter, isCheckingAuth })
    if (teamFilter && !isCheckingAuth) {
      console.log('✅ Calling loadTeamTargets for:', teamFilter)
      loadTeamTargets(teamFilter)
    } else {
      console.log('⏸️ Skip loading:', teamFilter ? 'Still checking auth' : 'No team selected')
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
          
          // แค่อัปเดต state อย่างเดียว ไม่บันทึกลงฐานข้อมูล
          setCurrentTargets(prev => ({
            ...prev,
            exchangeRate: newRate
          }))
          
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
  const colorableColumns = headers.filter(header => 
    header !== 'Date' && 
    header !== 'วันที่' && 
    header !== 'Team' && 
    header !== 'ทีม'
  )
  const percentageColumns = [
    'Lost_Messages',
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
    if (!silent) {
      setIsLoading(true)
    }
    setError('')
    try {
      const params = new URLSearchParams()
      if (teamFilter) params.append('team', teamFilter)
      if (monthFilter) params.append('month', monthFilter)
      if (yearFilter) params.append('year', yearFilter)
      params.append('exchangeRate', currentTargets.exchangeRate.toString())
      params.append('cpmTarget', currentTargets.cpmTarget.toString())
      const url = `/api/gateway-data?${params.toString()}`
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
      if (result.data && result.data.length > 0) {
        console.log('✅ Setting data to state:', result.data.length, 'rows')
        setHeaders(result.headers || [])
        setData(result.data)
        setTeamDataCache(result.data) // Cache ข้อมูล
        setLastRefreshTime(new Date())
        console.log('✅ Data set complete!')
        if (!silent) {
          console.log('📋 Data from Database:', result.data.length, 'rows')
          console.log('📊 Headers:', result.headers)
        }
      } else {
        console.log('⚠️ No data returned from API', { silent })
        // ไม่ clear ข้อมูลเดิม ให้คงไว้
        if (!silent) {
          // แสดง error เฉพาะเมื่อไม่ใช่ silent refresh
          console.warn('No data available, keeping existing data')
        }
      }
    } catch (err: any) {
      console.error('Error fetching data:', err)
      // ถ้า error แล้วเป็น silent refresh ให้ใช้ cache เดิม
      if (silent && teamDataCache.length > 0) {
        console.log('✅ Error during silent refresh, keeping cache')
      } else if (!silent) {
        setError(err.message)
      }
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }
  const fetchAdserData = async (silent = false) => {
    if (!silent) {
      setIsLoading(true)
    }
    setError('')
    try {
      const params = new URLSearchParams()
      if (teamFilter) params.append('team', teamFilter)
      if (selectedAdser) params.append('adser', selectedAdser)
      if (monthFilter) params.append('month', monthFilter)
      if (yearFilter) params.append('year', yearFilter)
      params.append('exchangeRate', currentTargets.exchangeRate.toString())
      params.append('cpmTarget', currentTargets.cpmTarget.toString())
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
        firstRow: result.data?.[0]
      })
      if (result.data && result.data.length > 0) {
        setAdserHeaders(result.headers || [])
        setAdserData(result.data)
        // Cache ข้อมูล adser
        if (selectedAdser) {
          setAdserDataCache(prev => ({ ...prev, [selectedAdser]: result.data }))
        }
        setLastRefreshTime(new Date())
        if (!silent) {
          console.log('📋 Adser headers:', result.headers)
          console.log('👥 Adser list:', adserList)
        }
      } else {
        console.log('⚠️ No adser data returned from API', { silent })
        // ไม่ clear ข้อมูลเดิม ให้คงไว้
        if (!silent) {
          // แสดง error เฉพาะเมื่อไม่ใช่ silent refresh
          console.warn('No adser data available, keeping existing data')
        }
      }
      if (adserList.length > 0 && !selectedAdser) {
        setSelectedAdser(adserList[0])
      }
    } catch (err: any) {
      console.error('Error fetching adser data:', err)
      // ถ้า error แล้วเป็น silent refresh ให้ใช้ cache เดิม
      if (silent && selectedAdser && adserDataCache[selectedAdser]?.length > 0) {
        console.log('✅ Error during silent refresh, keeping adser cache')
      } else if (!silent) {
        setError(err.message)
      }
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }
  useEffect(() => {
    fetchData(false)
  }, []) // โหลดครั้งแรกเท่านั้น
  
  // Fetch ข้อมูลเมื่อสลับแท็บ และแสดง cache ก่อน
  useEffect(() => {
    console.log('🔄 Tab/Adser changed:', activeTab, 'selectedAdser:', selectedAdser)

    if (activeTab === 'team') {
      console.log('📦 Team cache:', teamDataCache.length, 'rows')
      // แสดง cache ก่อนถ้ามี
      if (teamDataCache.length > 0) {
        console.log('✅ Using team cache')
        setData(teamDataCache)
        if (headers.length === 0) {
          setHeaders(COLUMN_ORDER)
        }
        // คืน scroll ทันทีเมื่อแสดง cache (ทั้งแนวตั้งและแนวนอน)
        requestAnimationFrame(() => {
          if (bodyScrollRef.current) {
            bodyScrollRef.current.scrollTop = savedScrollPosition
            bodyScrollRef.current.scrollLeft = savedScrollLeft
          }
        })
      } else {
        // ถ้าไม่มี cache ให้ fetch ข้อมูลใหม่
        fetchData(false)
      }
    } else if (activeTab === 'adser' && selectedAdser) {
      const cacheKey = selectedAdser
      console.log('📦 Adser cache for', cacheKey, ':', adserDataCache[cacheKey]?.length || 0, 'rows')
      // แสดง cache ของ adser ถ้ามี
      if (adserDataCache[cacheKey]?.length > 0) {
        console.log('✅ Using adser cache for', cacheKey)
        setAdserData(adserDataCache[cacheKey])
        if (adserHeaders.length === 0) {
          setAdserHeaders(COLUMN_ORDER)
        }
        // คืน scroll ทันทีเมื่อแสดง cache (ทั้งแนวตั้งและแนวนอน)
        requestAnimationFrame(() => {
          if (bodyScrollRef.current) {
            bodyScrollRef.current.scrollTop = savedScrollPosition
            bodyScrollRef.current.scrollLeft = savedScrollLeft
          }
        })
      } else {
        // ถ้าไม่มี cache ให้ fetch ข้อมูลใหม่
        fetchAdserData(false)
      }
    }
  }, [activeTab, selectedAdser])
  
  // คืนค่า scroll หลังจากข้อมูลเปลี่ยน (ทั้งแนวตั้งและแนวนอน)
  useEffect(() => {
    if (activeTab === 'team' && data.length > 0) {
      requestAnimationFrame(() => {
        if (bodyScrollRef.current) {
          bodyScrollRef.current.scrollTop = savedScrollPosition
          bodyScrollRef.current.scrollLeft = savedScrollLeft
          console.log('📜 Restored team scroll:', savedScrollPosition, savedScrollLeft)
        }
      })
    }
  }, [data])
  
  useEffect(() => {
    if (activeTab === 'adser' && adserData.length > 0) {
      requestAnimationFrame(() => {
        if (bodyScrollRef.current) {
          bodyScrollRef.current.scrollTop = savedScrollPosition
          bodyScrollRef.current.scrollLeft = savedScrollLeft
          console.log('📜 Restored adser scroll:', savedScrollPosition, savedScrollLeft)
        }
      })
    }
  }, [adserData])
  
  useEffect(() => {
    if (activeTab === 'team' && !isCheckingAuth && currentTargets.cpmTarget > 0) {
      fetchData(false) // fetch ข้อมูลใหม่เมื่อ filter เปลี่ยน (รอให้โหลด targets เสร็จก่อน)
    }
  }, [teamFilter, monthFilter, yearFilter, isCheckingAuth, currentTargets.cpmTarget])
  useEffect(() => {
    if (activeTab === 'adser' && selectedAdser) {
      fetchAdserData(false) // fetch ข้อมูลใหม่เมื่อ filter เปลี่ยน
    }
  }, [selectedAdser, teamFilter, monthFilter, yearFilter])
  useEffect(() => {
    if (activeTab === 'adser' && adserList.length > 0 && !selectedAdser) {
      setSelectedAdser(adserList[0])
    }
  }, [activeTab, adserList, teamFilter])
  
  // Auto-refresh ทุก 30 วินาที แบบ silent (ไม่แสดง loading)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing data silently...')
      
      // บันทึก scroll position ก่อน refresh
      if (bodyScrollRef.current) {
        const currentScrollTop = bodyScrollRef.current.scrollTop
        const currentScrollLeft = bodyScrollRef.current.scrollLeft
        setSavedScrollPosition(currentScrollTop)
        setSavedScrollLeft(currentScrollLeft)
        console.log('📍 Saved scroll position:', { top: currentScrollTop, left: currentScrollLeft })
      }
      
      if (activeTab === 'team') {
        fetchData(true) // silent mode
      } else if (activeTab === 'adser' && selectedAdser) {
        fetchAdserData(true) // silent mode
      }
    }, 30000) // 30 วินาที
    return () => clearInterval(interval)
  }, [activeTab, selectedAdser])
  
  useEffect(() => {
    const bodyScroll = bodyScrollRef.current
    const headerScroll = headerScrollRef.current
    if (!bodyScroll || !headerScroll) {
      console.log('⚠️ Refs not ready:', { bodyScroll, headerScroll })
      return
    }
    console.log('✅ Sync scroll initialized')
    
    // กู้คืน scroll position ถ้ามีค่าที่บันทึกไว้
    if (savedScrollPosition > 0 || savedScrollLeft > 0) {
      console.log('🔄 Restoring scroll position:', { top: savedScrollPosition, left: savedScrollLeft })
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
    if (!monthFilter || !yearFilter) {
      return filteredData
    }
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ]
    const monthIndex = thaiMonths.indexOf(monthFilter)
    if (monthIndex === -1) return filteredData
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
    console.log('📊 Data available for days:', Array.from(dataMap.keys()).sort((a, b) => a - b))
    console.log('📅 Creating full month for:', monthFilter, yearFilter, '- Days:', daysInMonth)
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
  const displayHeaders = COLUMN_ORDER.filter(orderedColumn => {
    const exists = currentHeaders.length === 0 || currentHeaders.includes(orderedColumn)
    const isHidden = ['Team', 'team', 'Adser', 'adser'].includes(orderedColumn)
    return exists && !isHidden
  })
  const rightAlignColumns = ['Planned_Spend/Day', 'Spend', 'New Player Revenue (THB)']
  const columnWidths: { [key: string]: number } = {
    'Date': 90,
    'KPI_Budget_Used': 75,
    'KPI_Budget Used': 90,
    'Planned_Messages': 75,
    'Total_Messages': 75,
    'Messages(Meta)': 75,
    'Lost_Messages': 75,
    'Net_Messages': 85,
    'Net_Messages_Pure': 85,
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
      'KPI_Budget Used',
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
  const getCellStyle = (row: SheetData, header: string): React.CSSProperties => {
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
      if (header === 'KPI_Budget_Used') {
        const totalMessages = displayData
          .map(row => parseFloat(String(row['Total_Messages'] || '0').replace(/,/g, '')))
          .filter(v => !isNaN(v))
          .reduce((sum, v) => sum + v, 0)
        const totalSpend = displayData
          .map(row => parseFloat(String(row['Spend'] || '0').replace(/[$,]/g, '')))
          .filter(v => !isNaN(v))
          .reduce((sum, v) => sum + v, 0)
        const cpmTarget = currentTargets.cpmTarget || 15 // ใช้เป้า CPM จากการตั้งค่า
        
        console.log('📊 KPI_Budget_Used calculation:', {
          totalMessages,
          totalSpend,
          cpmTarget,
          budget: totalSpend / cpmTarget,
          percentage: totalMessages / (totalSpend / cpmTarget) * 100,
          displayDataLength: displayData.length
        })
        
        if (totalSpend > 0 && cpmTarget > 0) {
          summary[header] = ((totalMessages / (totalSpend / cpmTarget)) * 100).toFixed(2) + '%'
        } else {
          summary[header] = '0.00%'
        }
        return
      }
      const sampleValue = displayData.find(row => row[header])
      const hasPercentSign = sampleValue ? String(sampleValue[header] || '').includes('%') : false
      const isPercentageColumn = percentageColumns.includes(header)
      const isAverageCol = hasPercentSign || 
                           header.includes('KPI') ||
                           header === 'Cost_per_Message_(Meta)' ||
                           (displayMode === 'percent' && isPercentageColumn)
      
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
        if (displayMode === 'percent' && isPercentageColumn) {
          const totalMessagesSum = displayData
            .map(row => parseFloat(row['Total_Messages'] || '0'))
            .filter(v => !isNaN(v))
            .reduce((sum, v) => sum + v, 0)
          if (totalMessagesSum > 0) {
            const percentValue = (sum / totalMessagesSum) * 100
            summary[header] = percentValue.toFixed(2) + '%'
          } else {
            summary[header] = sum.toLocaleString('en-US', { maximumFractionDigits: 2 })
          }
        }
        else if (displayData[0] && String(displayData[0][header] || '').includes('$')) {
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
  }, [displayData, displayHeaders, displayMode, currentTargets.cpmTarget, exchangeRate])
  
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
                    <Label htmlFor="target-rate" className="text-xs text-muted-foreground">
                      Rate $ / ฿
                    </Label>
                    <div className="text-xs font-medium text-primary">
                      1$ = ฿{currentTargets.exchangeRate.toFixed(2)}
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
                              ? 'bg-orange-300 dark:bg-orange-800/60 hover:bg-orange-400 dark:hover:bg-orange-800/80 font-semibold' 
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
