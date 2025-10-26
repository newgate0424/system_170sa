"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "./ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { DateRangePicker } from "./ui/date-range-picker"
import { CalendarDays, Filter, RefreshCw, Users, BarChart3, Eye, Search, Database, ArrowUpDown } from "lucide-react"
import { DateRange } from "react-day-picker"
import { FilterSettings, useUserPreferences } from "@/lib/preferences"

// เพิ่ม user context
interface User {
  id?: number;
  username: string;
  role: string;
  teams?: string[];
}

export interface ColumnVisibility {
  [key: string]: boolean
}

interface ColorRule {
  id: string;
  column: string;
  condition: 'greater' | 'less' | 'between' | 'contains' | 'equals' | 'not_contains';
  value1: number | string;
  value2?: number | string;
  isPercentage: boolean;
  isTextCondition: boolean;
  color: string;
  backgroundColor: string;
  isBold: boolean;
  enabled: boolean;
}

interface ColorConfig {
  [columnKey: string]: ColorRule[];
}

interface FilterSidebarProps {
  dateRange: DateRange | undefined
  setDateRange: (range: DateRange | undefined) => void
  selectedAdvertiser: string
  setSelectedAdvertiser: (advertiser: string) => void
  selectedStatus: string
  setSelectedStatus: (status: string) => void
  selectedTeam: string
  setSelectedTeam: (team: string) => void
  searchText: string
  setSearchText: (text: string) => void
  pageDisplayMode: string
  setPageDisplayMode: (mode: string) => void
  visibleColumns: ColumnVisibility
  setVisibleColumns: (columns: ColumnVisibility | ((prev: ColumnVisibility) => ColumnVisibility)) => void
  colorConfig: ColorConfig
  setColorConfig: (config: ColorConfig | ((prev: ColorConfig) => ColorConfig)) => void
  advertisers: string[]
  statuses: string[]
  teams: string[]
  teamAdvertiserMapping?: Record<string, string[]> // เพิ่ม mapping จาก API
  onRefresh: () => void
  isLoading: boolean
  itemsPerPage: number
  setItemsPerPage: (items: number) => void
  setCurrentPage: (page: number) => void
  user?: User // เพิ่ม user prop
  sortConfig: { key: string; direction: 'asc' | 'desc' | null } // เพิ่ม sortConfig prop
}

// Memoized checkbox item component
const CheckboxItem = React.memo(({ 
  column, 
  isVisible, 
  displayName, 
  onToggle 
}: { 
  column: string; 
  isVisible: boolean; 
  displayName: string; 
  onToggle: (column: string) => void;
}) => (
  <div
    className="flex items-center space-x-2 px-2 py-2 hover:bg-slate-200/60 dark:hover:bg-slate-700/50 cursor-pointer"
    onClick={() => onToggle(column)}
  >
    <input
      type="checkbox"
      checked={isVisible}
      readOnly
      className="flex-shrink-0 w-4 h-4"
    />
    <label className="text-sm cursor-pointer flex-1 text-slate-800 dark:text-slate-200">
      {displayName}
    </label>
  </div>
));

// Set display name for the memoized component
CheckboxItem.displayName = 'CheckboxItem';

export function FilterSidebar({
  dateRange,
  setDateRange,
  selectedAdvertiser,
  setSelectedAdvertiser,
  selectedStatus,
  setSelectedStatus,
  selectedTeam,
  setSelectedTeam,
  searchText,
  setSearchText,
  pageDisplayMode,
  setPageDisplayMode,
  visibleColumns,
  setVisibleColumns,
  colorConfig,
  setColorConfig,
  advertisers,
  statuses,
  teams,
  teamAdvertiserMapping = {}, // รับ mapping จาก API
  onRefresh,
  isLoading,
  itemsPerPage,
  setItemsPerPage,
  setCurrentPage,
  user, // รับ user prop
  sortConfig // รับ sortConfig prop
}: FilterSidebarProps) {
  
  // Function to get Thai column names
  const getThaiColumnName = (key: string): string => {
    const thaiNames: Record<string, string> = {
      'number': 'ลำดับ',
      'ad_id': 'ID โฆษณา',
      'campaign': 'แคมเปญ',
      'message': 'ข้อความ',
      'page': 'เพจ',
      'date_start': 'วันที่เริ่ม',
      'date_end': 'วันที่สิ้นสุด',
      'status': 'สถานะ',
      'cpm': 'CPM',
      'cost': 'ค่าใช้จ่าย',
      'costPerMessage': 'ค่าใช้จ่ายต่อข้อความ',
      'metaMessage': 'ข้อความ Meta',
      'register': 'สมัครสมาชิก',
      'deposit': 'ฝากเงิน',
      'costPerDeposit': 'ค่าใช้จ่ายต่อฝาก',
      'turnover': 'ยอดเทิร์น',
      'totalUser': 'ผู้ใช้ทั้งหมด',
      'totalLoss': 'ขาดทุนรวม',
      'qualityContact': 'ติดต่อคุณภาพ',
      'silent': 'เงียบ',
      'duplicate': 'ซ้ำซ้อน',
      'hasAccount': 'มีบัญชี',
      'spammer': 'สแปม',
      'blocked': 'ถูกบล็อก',
      'under18': 'ต่ำกว่า 18',
      'over50': 'เกิน 50',
      'foreigner': 'ชาวต่างชาติ'
    };
    return thaiNames[key] || key;
  };
  
  // User Preferences Hook
  const {
    preferences,
    loading: preferencesLoading,
    error: preferencesError,
    updateFilterSettings,
    updateColumnVisibility,
    updateColorConfiguration
  } = useUserPreferences();
  
  // State for color config management
  const [hasColorChanges, setHasColorChanges] = useState(false);
  const [originalColorConfig, setOriginalColorConfig] = useState<ColorConfig>({});
  const [isColorConfigVisible, setIsColorConfigVisible] = React.useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load preferences from database or localStorage when component mounts
  useEffect(() => {
    // เพิ่มเงื่อนไขเพื่อให้โหลดครั้งเดียวหลังจาก preferences มาครบแล้ว
    if (!isInitialized && !preferencesLoading && preferences) {
      console.log('🔄 FilterSidebar loading preferences from database...');
      
      // Load filter settings
      if (preferences.filterSettings) {
        const filters = preferences.filterSettings as FilterSettings;
        console.log('📥 Restoring filter settings:', filters);
        
        // Restore date range
        if (filters.dateRange?.from && filters.dateRange?.to) {
          const restoredRange = {
            from: new Date(filters.dateRange.from),
            to: new Date(filters.dateRange.to)
          };
          console.log('📅 Restoring date range:', restoredRange);
          setDateRange(restoredRange);
        }
        
        // Restore other filters
        if (filters.searchText !== undefined) {
          console.log('🔍 Restoring search text:', filters.searchText);
          setSearchText(filters.searchText);
        }
        if (filters.selectedTeam !== undefined) {
          console.log('👥 Restoring selected team:', filters.selectedTeam);
          setSelectedTeam(filters.selectedTeam);
        }
        if (filters.selectedAdser !== undefined) {
          console.log('👤 Restoring selected adser:', filters.selectedAdser);
          setSelectedAdvertiser(filters.selectedAdser);
        }
        if (filters.pageDisplayMode !== undefined) {
          console.log('📄 Restoring page display mode:', filters.pageDisplayMode);
          setPageDisplayMode(filters.pageDisplayMode);
        }
        if (filters.selectedStatus !== undefined) {
          console.log('📊 Restoring selected status:', filters.selectedStatus);
          setSelectedStatus(filters.selectedStatus);
        }
      }
      
      // Load column visibility
      if (preferences.columnVisibility) {
        console.log('👁️ Restoring column visibility:', preferences.columnVisibility);
        setVisibleColumns(preferences.columnVisibility as ColumnVisibility);
      }
      
      // Load color configuration
      if (preferences.colorConfiguration) {
        console.log('🎨 Restoring color configuration:', preferences.colorConfiguration);
        const loadedColorConfig = preferences.colorConfiguration as ColorConfig;
        setColorConfig(loadedColorConfig);
        setOriginalColorConfig(loadedColorConfig);
      } else {
        // ถ้าไม่มี color configuration ให้ set เป็น empty object
        setColorConfig({});
        setOriginalColorConfig({});
      }
      
      // Mark as initialized after preferences are loaded
      setIsInitialized(true);
    } else if (!preferencesLoading && !preferences) {
      // Mark as initialized even if no preferences found
      setIsInitialized(true);
    }
  }, [preferences, preferencesLoading, isInitialized]);

  // Listen for user login events to reset component state
  useEffect(() => {
    const handleUserLogin = () => {
      console.log('🔄 FilterSidebar detected user login, resetting state...');
      
      // Reset initialization to allow preferences to reload
      setIsInitialized(false);
      
      // Reset filter states to defaults
      setSearchText('');
      setSelectedTeam('');
      setSelectedAdvertiser('all');
      setPageDisplayMode('pageid');
      setSelectedStatus('all');
      
      console.log('✅ FilterSidebar state reset for new user');
    };

    // Add event listener
    window.addEventListener('userLoggedIn', handleUserLogin);

    // Cleanup
    return () => {
      window.removeEventListener('userLoggedIn', handleUserLogin);
    };
  }, []);

  // Save filter settings to preferences when they change (debounced in hook)
  useEffect(() => {
    if (isInitialized && sortConfig.direction) {
      console.log('💾 Saving filter settings to preferences...');
      updateFilterSettings({
        dateRange: dateRange ? {
          from: dateRange.from?.toISOString(),
          to: dateRange.to?.toISOString()
        } : undefined,
        searchText,
        selectedTeam,
        selectedAdser: selectedAdvertiser,
        selectedAdvertiser,
        pageDisplayMode,
        selectedStatus,
        statusFilter: selectedStatus,
        showInactiveContent: false,
        sortSettings: {
          column: sortConfig.key,
          direction: sortConfig.direction
        }
      });
    }
  }, [dateRange, searchText, selectedTeam, selectedAdvertiser, pageDisplayMode, selectedStatus, sortConfig, isInitialized, updateFilterSettings]);

  // Save column visibility when it changes (debounced in hook)
  useEffect(() => {
    if (isInitialized && visibleColumns && Object.keys(visibleColumns).length > 0) {
      console.log('💾 Saving column visibility to preferences...');
      updateColumnVisibility(visibleColumns);
    }
  }, [visibleColumns, isInitialized, updateColumnVisibility]);

  // Save color configuration when it changes (debounced in hook)
  useEffect(() => {
    if (isInitialized && colorConfig) {
      console.log('💾 Saving color configuration to preferences...');
      updateColorConfiguration(colorConfig);
    }
  }, [colorConfig, isInitialized, updateColorConfiguration]);

  // Track color config changes
  useEffect(() => {
    if (isInitialized) {
      const hasChanges = JSON.stringify(colorConfig) !== JSON.stringify(originalColorConfig);
      setHasColorChanges(hasChanges);
    }
  }, [colorConfig, originalColorConfig, isInitialized]);

  // Handler สำหรับบันทึกการตั้งค่าสี
  const handleSaveColorConfig = () => {
    console.log('💾 Saving color configuration manually...');
    // Normalize both configs for comparison by removing undefined/null/empty values
    const normalizeConfig = (config: ColorConfig) => {
      const normalized: any = {};
      Object.keys(config).forEach(key => {
        const value = config[key as keyof ColorConfig];
        // Handle different types of values
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            // For arrays (like ColorRule[]), only include if not empty
            if (value.length > 0) {
              normalized[key] = value;
            }
          } else if (typeof value === 'string' && value !== '') {
            // For strings, only include if not empty
            normalized[key] = value;
          } else if (typeof value !== 'string') {
            // For other types (numbers, booleans, objects), include as is
            normalized[key] = value;
          }
        }
      });
      return normalized;
    };

    const normalizedOriginal = normalizeConfig(originalColorConfig);
    const normalizedCurrent = normalizeConfig(colorConfig);

    // Sort keys for consistent comparison
    const sortedOriginal = JSON.stringify(normalizedOriginal, Object.keys(normalizedOriginal).sort());
    const sortedCurrent = JSON.stringify(normalizedCurrent, Object.keys(normalizedCurrent).sort());

    console.log('Normalized Original:', normalizedOriginal);
    console.log('Normalized Current:', normalizedCurrent);

    if (sortedOriginal !== sortedCurrent) {
      updateColorConfiguration(colorConfig);
      setOriginalColorConfig(colorConfig);
      setHasColorChanges(false);
      console.log('✅ Color configuration saved');
    } else {
      console.log('ℹ️ No changes to save');
    }
  };

  // Handler สำหรับรีเซ็ตการตั้งค่าสี
  const handleResetColorConfig = () => {
    console.log('🔄 Resetting color configuration...');
    // Default color rules for specific columns
    const defaultColorRules: ColorConfig = {
      cpm: [
        { id: 'cpm-high', column: 'cpm', condition: 'greater' as const, value1: 50, isPercentage: false, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true },
        { id: 'cpm-low', column: 'cpm', condition: 'less' as const, value1: 20, isPercentage: false, isTextCondition: false, color: '#16a34a', backgroundColor: '#f0fdf4', isBold: false, enabled: true }
      ],
      totalLoss: [
        { id: 'loss-high', column: 'totalLoss', condition: 'greater' as const, value1: 30, isPercentage: true, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true },
        { id: 'loss-low', column: 'totalLoss', condition: 'less' as const, value1: 10, isPercentage: true, isTextCondition: false, color: '#16a34a', backgroundColor: '#f0fdf4', isBold: false, enabled: true }
      ],
      qualityContact: [
        { id: 'quality-high', column: 'qualityContact', condition: 'greater' as const, value1: 100, isPercentage: false, isTextCondition: false, color: '#16a34a', backgroundColor: '#f0fdf4', isBold: false, enabled: true },
        { id: 'quality-low', column: 'qualityContact', condition: 'less' as const, value1: 50, isPercentage: false, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true }
      ]
    };
    
    // Create new config keeping all columns but resetting rules to defaults where available
    const newConfig: ColorConfig = {};
    Object.keys(colorConfig).forEach(columnKey => {
      if (defaultColorRules[columnKey]) {
        // Use default rules for this column
        newConfig[columnKey] = defaultColorRules[columnKey];
      } else {
        // Keep existing rules but reset their values
        newConfig[columnKey] = colorConfig[columnKey].map(rule => ({
          ...rule,
          enabled: false // Disable custom rules
        }));
      }
    });
    
    setColorConfig(newConfig);
    setOriginalColorConfig(newConfig);
    updateColorConfiguration(newConfig);
    setHasColorChanges(false);
    console.log('✅ Color configuration reset to defaults');
  };

  // Add color rule to a column
  const addColorRule = (columnKey: string) => {
    console.log('➕ Adding new color rule to column:', columnKey);
    const currentRules = Array.isArray(colorConfig?.[columnKey]) ? colorConfig[columnKey] : [];
    const newRule: ColorRule = {
      id: `rule-${Date.now()}`,
      column: columnKey,
      condition: 'greater',
      value1: 0,
      value2: undefined,
      isPercentage: false,
      isTextCondition: false,
      color: '#000000',
      backgroundColor: '#ffffff',
      isBold: false,
      enabled: true
    };
    
    handleColorConfigChange({
      ...colorConfig,
      [columnKey]: [...currentRules, newRule]
    });
  };

  // Remove color rule from a column
  const removeColorRule = (columnKey: string, ruleIndex: number) => {
    console.log('➖ Removing color rule from column:', columnKey, 'at index:', ruleIndex);
    const currentRules = Array.isArray(colorConfig?.[columnKey]) ? colorConfig[columnKey] : [];
    handleColorConfigChange({
      ...colorConfig,
      [columnKey]: currentRules.filter((_, index) => index !== ruleIndex)
    });
  };

  // Update a specific rule in a column
  const updateColorRule = (columnKey: string, ruleIndex: number, updates: Partial<ColorRule>) => {
    const currentRules = Array.isArray(colorConfig?.[columnKey]) ? colorConfig[columnKey] : [];
    handleColorConfigChange({
      ...colorConfig,
      [columnKey]: currentRules.map((rule, index) => 
        index === ruleIndex ? { ...rule, ...updates } : rule
      )
    });
  };

  // Predefined color options
  const colorOptions = [
    { bg: '#ef4444', text: '#ffffff', name: 'แดง' },      // red-500
    { bg: '#f97316', text: '#ffffff', name: 'ส้ม' },      // orange-500
    { bg: '#eab308', text: '#000000', name: 'เหลือง' },   // yellow-500
    { bg: '#22c55e', text: '#ffffff', name: 'เขียว' },    // green-500
    { bg: '#3b82f6', text: '#ffffff', name: 'น้ำเงิน' },  // blue-500
    { bg: '#8b5cf6', text: '#ffffff', name: 'ม่วง' },     // violet-500
    { bg: '#ec4899', text: '#ffffff', name: 'ชมพู' },     // pink-500
    { bg: '#06b6d4', text: '#ffffff', name: 'ฟ้า' },      // cyan-500
    { bg: '#84cc16', text: '#000000', name: 'เขียวอ่อน' }, // lime-500
    { bg: '#f59e0b', text: '#000000', name: 'ส้มทอง' },   // amber-500
    { bg: '#fef2f2', text: '#dc2626', name: 'แดงอ่อน' },  // red-50 bg with red-600 text
    { bg: '#f0fdf4', text: '#16a34a', name: 'เขียวอ่อน' }, // green-50 bg with green-600 text
  ];
  const [isHydrated, setIsHydrated] = React.useState(false);
  
  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Create stable callback to prevent infinite re-renders
  const handleTeamChange = React.useCallback((team: string) => {
    console.log('🔄 Team changed to:', team);
    setSelectedTeam(team);
    // Reset advertiser to 'all' when team changes
    setSelectedAdvertiser('all');
    console.log('✅ Advertiser reset to "all" due to team change');
  }, [setSelectedTeam, setSelectedAdvertiser]);

  const handleAdvertiserChange = React.useCallback((advertiser: string) => {
    setSelectedAdvertiser(advertiser);
  }, [setSelectedAdvertiser]);

  const handleStatusChange = React.useCallback((status: string) => {
    setSelectedStatus(status);
  }, [setSelectedStatus]);

  const handlePageDisplayModeChange = React.useCallback((mode: string) => {
    setPageDisplayMode(mode);
  }, [setPageDisplayMode]);
  
  // Filter teams based on user role and assigned teams
  const filteredTeams = React.useMemo(() => {
    console.log('🔍 FilterSidebar - teams prop:', teams);
    console.log('🔍 FilterSidebar - user:', user);
    let availableTeams = teams.filter(team => team !== 'Unknown');
    console.log('🔍 FilterSidebar - availableTeams (after Unknown filter):', availableTeams);
    
    // ถ้าเป็น staff ให้แสดงเฉพาะทีมที่ได้รับมอบหมาย
    if (user?.role === 'staff' && user?.teams && Array.isArray(user.teams)) {
      availableTeams = availableTeams.filter(team => user.teams!.includes(team));
      console.log('🔍 FilterSidebar - availableTeams (after staff filter):', availableTeams);
    }
    
    return availableTeams;
  }, [teams, user]);

  // Filter advertisers based on selected team - ใช้ mapping จาก API
  const filteredAdvertisers = React.useMemo(() => {
    if (!selectedTeam || selectedTeam === 'all') {
      return advertisers;
    }
    return teamAdvertiserMapping[selectedTeam] || [];
  }, [selectedTeam, advertisers, teamAdvertiserMapping]);

  // Reset advertiser when team changes and current advertiser is not in the filtered list
  useEffect(() => {
    if (selectedTeam && selectedTeam !== 'all' && selectedAdvertiser !== 'all') {
      if (filteredAdvertisers.length > 0 && !filteredAdvertisers.includes(selectedAdvertiser)) {
        console.log(`🔄 Advertiser "${selectedAdvertiser}" not in team "${selectedTeam}", resetting to "all"`);
        setSelectedAdvertiser('all');
      }
    }
  }, [selectedTeam, selectedAdvertiser, filteredAdvertisers, setSelectedAdvertiser]);

  // Handler for color config changes
  const handleColorConfigChange = React.useCallback((newConfig: ColorConfig) => {
    setColorConfig(newConfig);
  }, [setColorConfig]);

  // Memoize column display name getter
  const getColumnDisplayName = React.useCallback((column: string): string => {
    const columnNames: { [key: string]: string } = {
      no: 'No.',
      adser: 'Adser',
      adId: 'ID โฆษณา',
      pageId: 'ID เพจ',
      page: '@ เพจ',
      content: 'คอนเทนต์',
      cookie: 'บัญชีเฟสบุค',
      target: 'กลุ่มเป้าหมาย',
      notTarget: 'ไม่รวมกลุ่มเป้าหมาย',
      budget: 'งบรัน',
      note: 'Note',
      status: 'สถานะ',
      start: 'วันเริ่ม',
      off: 'วันสิ้นสุด',
      captions: 'แคปชั่น',
      card: 'บัตร',
      cardNum: 'บัตร 4 ตัวท้าย',
      timezone: 'ไทม์โซน',
      typeTime: 'ประเภทเวลา',
      team: 'ทีม',
      total_card: 'การ์ดทั้งหมด',
      card_num: 'จำนวนการ์ด',
      cpm: 'CPM',
      totalMessage: 'ยอดทัก',
      costPerMessage: 'ต้นทุนทักจากเฟส',
      metaMessage: 'ยอดทัก Meta',
      register: 'สมัคร',
      deposit: 'เติม',
      costPerDeposit: 'ต้นทุนต่อเติม',
      cost: 'ใช้จ่าย',
      turnover: 'ยอดเล่นใหม่',
      totalUser: 'จำนวนยูส',
      totalLoss: 'ยอดเสีย',
      qualityContact: 'ทักคุณภาพ',
      silent: 'ทักเงียบ',
      duplicate: 'ทักซ้ำ',
      hasAccount: 'มียูส',
      spammer: 'ก่อกวน',
      blocked: 'บล็อก',
      under18: 'เด็ก',
      over50: 'อายุเกิน50',
      foreigner: 'ต่างชาติ'
    };
    return columnNames[column] || column;
  }, []);

  // Memoize column count calculations - แยกคอลัมน์หลักเท่านั้น (ไม่มี daily columns แล้ว)
  const { visibleCount, totalCount, mainVisibleCount, mainTotalCount } = React.useMemo(() => {
    const entries = Object.entries(visibleColumns);
    
    // ไม่ต้อง filter daily columns เพราะไม่มีแล้ว
    
    console.log('🔍 FilterSidebar Column summary:');
    console.log('  - Main columns:', entries.length);
    console.log('  - Total columns:', entries.length);
    
    return {
      visibleCount: entries.filter(([, visible]) => visible).length,
      totalCount: entries.length,
      mainVisibleCount: entries.filter(([, visible]) => visible).length,
      mainTotalCount: entries.length
    };
  }, [visibleColumns]);
  
  // Memoize column entries to prevent re-creation
  const columnEntries = React.useMemo(() => {
    const entries = Object.entries(visibleColumns);
    return entries;
  }, [visibleColumns]);

  // State for dropdown open/close
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = React.useState(false);

  // Optimized handlers with stable references
  const handleSelectAll = React.useCallback(() => {
    setVisibleColumns((prev: ColumnVisibility) => {
      const allVisible = Object.keys(prev).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as ColumnVisibility);
      return allVisible;
    });
  }, [setVisibleColumns]);

  const handleSelectNone = React.useCallback(() => {
    setVisibleColumns((prev: ColumnVisibility) => {
      const noneVisible = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {} as ColumnVisibility);
      return noneVisible;
    });
  }, [setVisibleColumns]);

  const handleBulkColumnToggle = React.useCallback((updates: Record<string, boolean>) => {
    setVisibleColumns((prev: ColumnVisibility) => ({
      ...prev,
      ...updates
    }));
  }, [setVisibleColumns]);

  const handleSelectDefault = React.useCallback(() => {
    setVisibleColumns(() => ({
      no: true,
      adser: true,
      adId: true,
      pageId: true,
      page: true,
      content: true,
      cookie: true,
      target: true,
      notTarget: false,
      budget: true,
      note: true,
      status: true,
      start: false,
      off: false,
      captions: false,
      card: false,
      cardNum: false,
      timezone: false,
      typeTime: false,
      team: true,
      total_card: false,
      card_num: false,
      cpm: true,
      totalMessage: true,
      costPerMessage: true,
      metaMessage: false,
      register: true,
      deposit: true,
      costPerDeposit: true,
      cost: true,
      turnover: true,
      totalUser: true,
      totalLoss: true,
      qualityContact: true,
      silent: true,
      duplicate: true,
      hasAccount: true,
      spammer: true,
      blocked: true,
      under18: true,
      over50: true,
      foreigner: true
    }));
  }, [setVisibleColumns]);

  const handleColumnToggle = React.useCallback((column: string) => {
    setVisibleColumns((prev: ColumnVisibility) => ({
      ...prev,
      [column]: !prev[column]
    }));
  }, [setVisibleColumns]); // Use functional update to avoid dependency

  return (
    <div className="h-full pl-2 pr-4 pb-4 overflow-y-auto">
      <div className="space-y-4">
        {/* Main Filter Card */}
        <Card className="shadow-md bg-slate-50/40 dark:bg-slate-900/40 border-slate-200/30 dark:border-slate-700/30 backdrop-blur-sm">
          <CardContent className="pt-6 space-y-6">
            {/* Date Range Filter */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="h-4 w-4 text-green-600 dark:text-green-400" />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">ช่วงวันที่</label>
              </div>
              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
                className="w-full"
              />
            </div>

            {/* Search Filter */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">ค้นหา</label>
              </div>
              <Input
                placeholder="ค้นหา IDโฆษณา เพจ หรือข้อมูลอื่นๆ..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full"
              />
              {searchText && (
                <div className="mt-2 p-2 bg-blue-50/80 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-600/30">
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    ค้นหา: &quot;{searchText}&quot;
                  </p>
                </div>
              )}
            </div>

            {/* Row 1: Team and Advertiser Filters */}
            <div className="grid grid-cols-2 gap-4">
              {/* Team Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    ทีม {filteredTeams.length > 0 && `(${filteredTeams.length})`}
                  </label>
                </div>
                <Select value={selectedTeam || undefined} onValueChange={handleTeamChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="เลือกทีม" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* แสดง "ทั้งหมด" สำหรับทุกคน */}
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {filteredTeams.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-slate-500">ไม่มีทีมอื่น</div>
                    ) : (
                      filteredTeams.map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Advertiser Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Adser</label>
                </div>
                <Select value={selectedAdvertiser} onValueChange={handleAdvertiserChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="เลือกผู้ลงโฆษณา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {filteredAdvertisers.map((advertiser) => (
                      <SelectItem key={advertiser} value={advertiser}>
                        {advertiser}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Page Display Mode and Status Filters */}
            <div className="grid grid-cols-2 gap-4">
              {/* Page Display Mode Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Page</label>
                </div>
                <Select value={pageDisplayMode} onValueChange={handlePageDisplayModeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="เลือกรูปแบบการแสดง" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pageid">ID เพจ</SelectItem>
                    <SelectItem value="page">@ เพจ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">สถานะ</label>
                </div>
                <Select value={selectedStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Column Visibility and Color Configuration - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Column Visibility Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">แสดงคอลัมน์</label>
                </div>
                <Select
                  open={isColumnDropdownOpen}
                  onOpenChange={setIsColumnDropdownOpen}
                  value=""
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={
                      isHydrated && Object.keys(visibleColumns).length > 0
                        ? `เลือกคอลัมน์ (${visibleCount}/${totalCount} แสดง)`
                        : isHydrated
                          ? "กำลังโหลดคอลัมน์..."
                          : "เลือกคอลัมน์..."
                    } />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <div className="p-2 border-b">
                      <div className="flex gap-1">
                        <button
                          onClick={handleSelectAll}
                          className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded"
                        >
                          เลือกทั้งหมด
                        </button>
                        <button
                          onClick={handleSelectDefault}
                          className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                        >
                          ค่าเริ่มต้น
                        </button>
                        <button
                          onClick={handleSelectNone}
                          className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded"
                        >
                          ยกเลิกทั้งหมด
                        </button>
                      </div>
                    </div>
                    
                    {/* คอลัมน์หลักเท่านั้น - ไม่รวม daily deposits */}
                    {columnEntries.map(([column, isVisible]) => (
                      <CheckboxItem
                        key={column}
                        column={column}
                        isVisible={isVisible}
                        displayName={getColumnDisplayName(column)}
                        onToggle={handleColumnToggle}
                      />
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {isHydrated && Object.keys(visibleColumns).length > 0
                    ? `แสดง: ${visibleCount}/${totalCount} คอลัมน์`
                    : isHydrated
                      ? "กำลังโหลดคอลัมน์..."
                      : "กำลังโหลด..."
                  }
                </div>
              </div>

              {/* Color Configuration Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-4 bg-gradient-to-r from-red-500 to-green-500 rounded-full"></div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">ตั้งค่าสี</label>
                </div>
                <Select
                  open={isColorConfigVisible}
                  onOpenChange={setIsColorConfigVisible}
                  value=""
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={
                      isHydrated && colorConfig && Object.keys(colorConfig).length > 0
                        ? `ตั้งค่าสี (${Object.values(colorConfig).flat().filter(r => r?.enabled).length} กฎ)`
                        : isHydrated
                          ? "เลือกการตั้งค่าสี..."
                          : "กำลังโหลด..."
                    } />
                  </SelectTrigger>
                  <SelectContent className="max-h-96 w-[400px]">
                    <div className="p-2 border-b">
                      <div className="flex gap-1 justify-between">
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              handleSaveColorConfig();
                              setIsColorConfigVisible(false);
                            }}
                            disabled={!hasColorChanges}
                            className={`px-2 py-1 text-xs rounded ${
                              hasColorChanges
                                ? 'bg-green-100 hover:bg-green-200 text-green-700'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            บันทึก
                          </button>
                          <button
                            onClick={() => {
                              handleResetColorConfig();
                              setIsColorConfigVisible(false);
                            }}
                            className="px-2 py-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded"
                          >
                            รีเซ็ต
                          </button>
                        </div>
                        {hasColorChanges && (
                          <span className="text-xs text-orange-600 flex items-center">
                            มีการเปลี่ยนแปลง
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                      {Object.entries(colorConfig).map(([columnKey, rules]) => {
                        if (!Array.isArray(rules) || rules.length === 0) return null;
                        
                        return (
                          <details key={columnKey} className="bg-slate-50 dark:bg-slate-800 rounded p-1 border border-slate-200 dark:border-slate-600">
                            <summary className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded flex items-center justify-between text-xs">
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                {getColumnDisplayName(columnKey)}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                  {rules.filter(r => r.enabled).length}/{rules.length}
                                </span>
                                <div className="flex gap-0.5">
                                  {rules.slice(0, 3).map((rule, i) => (
                                    <div 
                                      key={i}
                                      className={`w-2 h-2 rounded-full border ${rule.enabled ? 'opacity-100' : 'opacity-30'}`}
                                      style={{ backgroundColor: rule.backgroundColor }}
                                      title={`${rule.condition} ${rule.value1}${rule.isPercentage ? '%' : ''}`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </summary>
                            
                            <div className="px-3 pb-2 space-y-1">
                              {rules.map((rule, ruleIndex) => (
                                <div key={rule.id} className="flex flex-col gap-2 p-2 bg-slate-100/40 dark:bg-slate-700/30 rounded text-xs border border-slate-300/50 dark:border-slate-600/50 backdrop-blur-sm">
                                  {/* Top Row: Enable/Disable and Remove Button */}
                                  <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={rule.enabled}
                                        onChange={(e) => updateColorRule(columnKey, ruleIndex, { enabled: e.target.checked })}
                                        className="w-3 h-3 flex-shrink-0"
                                      />
                                      <span className="text-slate-700 dark:text-slate-300">เปิดใช้งาน</span>
                                    </label>
                                    
                                    {/* Preview and Remove */}
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-4 h-4 rounded border flex items-center justify-center text-xs"
                                        style={{ 
                                          backgroundColor: rule.backgroundColor, 
                                          color: rule.color,
                                          fontWeight: rule.isBold ? 'bold' : 'normal'
                                        }}
                                      >
                                        A
                                      </div>
                                      <button
                                        onClick={() => removeColorRule(columnKey, ruleIndex)}
                                        className="px-1 py-0.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded"
                                      >
                                        ลบ
                                      </button>
                                    </div>
                                  </div>

                                  {/* Type Toggle Row */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-700 dark:text-slate-300 text-xs flex-shrink-0">ประเภท:</span>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => updateColorRule(columnKey, ruleIndex, { 
                                          isTextCondition: false, 
                                          condition: 'greater',
                                          value1: 0,
                                          value2: undefined,
                                          isPercentage: false
                                        })}
                                        className={`px-2 py-1 text-xs rounded transition-colors ${
                                          !rule.isTextCondition 
                                            ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-800/60 dark:text-blue-200 dark:border-blue-600' 
                                            : 'bg-slate-200 text-slate-700 border border-slate-400 dark:bg-slate-600 dark:text-slate-200 dark:border-slate-500'
                                        }`}
                                      >
                                        ตัวเลข
                                      </button>
                                      <button
                                        onClick={() => updateColorRule(columnKey, ruleIndex, { 
                                          isTextCondition: true, 
                                          condition: 'contains',
                                          value1: '',
                                          value2: undefined,
                                          isPercentage: false
                                        })}
                                        className={`px-2 py-1 text-xs rounded transition-colors ${
                                          rule.isTextCondition 
                                            ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-800/60 dark:text-blue-200 dark:border-blue-600' 
                                            : 'bg-slate-200 text-slate-700 border border-slate-400 dark:bg-slate-600 dark:text-slate-200 dark:border-slate-500'
                                        }`}
                                      >
                                        ข้อความ
                                      </button>
                                    </div>
                                  </div>

                                  {/* Condition Row */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-slate-700 text-xs flex-shrink-0">เงื่อนไข:</span>
                                    
                                    <select
                                      value={rule.condition}
                                      onChange={(e) => updateColorRule(columnKey, ruleIndex, { condition: e.target.value as ColorRule['condition'] })}
                                      className="px-1 py-0.5 text-xs border border-slate-400 rounded bg-white text-slate-800"
                                    >
                                      {rule.isTextCondition ? (
                                        <>
                                          <option value="contains">มีคำนี้</option>
                                          <option value="equals">เท่ากับ</option>
                                          <option value="not_contains">ไม่มีคำนี้</option>
                                        </>
                                      ) : (
                                        <>
                                          <option value="greater">มากกว่า</option>
                                          <option value="less">น้อยกว่า</option>
                                          <option value="between">ระหว่าง</option>
                                        </>
                                      )}
                                    </select>
                                    
                                    <input
                                      type={rule.isTextCondition ? "text" : "number"}
                                      value={rule.value1}
                                      onChange={(e) => {
                                        const newValue = rule.isTextCondition ? e.target.value : Number(e.target.value);
                                        updateColorRule(columnKey, ruleIndex, { value1: newValue });
                                      }}
                                      className="w-16 px-1 py-0.5 text-xs border border-slate-400 rounded bg-white text-slate-800"
                                      step={rule.isTextCondition ? undefined : (rule.isPercentage ? "0.1" : "1")}
                                      placeholder={rule.isTextCondition ? "ข้อความ" : "ค่า"}
                                    />
                                    
                                    {rule.condition === 'between' && !rule.isTextCondition && (
                                      <>
                                        <span className="text-slate-600 text-xs">ถึง</span>
                                        <input
                                          type="number"
                                          value={rule.value2 || 0}
                                          onChange={(e) => updateColorRule(columnKey, ruleIndex, { value2: Number(e.target.value) })}
                                          className="w-12 px-1 py-0.5 text-xs border border-slate-400 rounded bg-white text-slate-800"
                                          step={rule.isPercentage ? "0.1" : "1"}
                                          placeholder="ค่าสิ้นสุด"
                                        />
                                      </>
                                    )}
                                    
                                    {!rule.isTextCondition && (
                                      <label className="flex items-center gap-1 flex-shrink-0">
                                        <input
                                          type="checkbox"
                                          checked={rule.isPercentage}
                                          onChange={(e) => updateColorRule(columnKey, ruleIndex, { isPercentage: e.target.checked })}
                                          className="w-3 h-3"
                                        />
                                        <span className="text-slate-700 text-xs">%</span>
                                      </label>
                                    )}
                                  </div>

                                  {/* Color Selection Row */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-700 text-xs flex-shrink-0">สี:</span>
                                    <input
                                      type="color"
                                      value={rule.color}
                                      onChange={(e) => updateColorRule(columnKey, ruleIndex, { color: e.target.value })}
                                      className="w-8 h-6 rounded border border-slate-400 cursor-pointer"
                                      title="สีตัวอักษร"
                                    />
                                    <input
                                      type="color"
                                      value={rule.backgroundColor}
                                      onChange={(e) => updateColorRule(columnKey, ruleIndex, { backgroundColor: e.target.value })}
                                      className="w-8 h-6 rounded border border-slate-400 cursor-pointer"
                                      title="สีพื้นหลัง"
                                    />
                                    <label className="flex items-center gap-1">
                                      <input
                                        type="checkbox"
                                        checked={rule.isBold}
                                        onChange={(e) => updateColorRule(columnKey, ruleIndex, { isBold: e.target.checked })}
                                        className="w-3 h-3"
                                      />
                                      <span className="text-slate-700 text-xs font-bold">B</span>
                                    </label>
                                  </div>
                                </div>
                              ))}
                              
                              <button
                                onClick={() => addColorRule(columnKey)}
                                className="w-full px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded mt-1"
                              >
                                + เพิ่มกฎ
                              </button>
                            </div>
                          </details>
                        );
                      })}
                      {!isHydrated && (
                        <div className="p-4 text-center text-slate-600 text-sm">
                          กำลังโหลดการตั้งค่าสี...
                        </div>
                      )}
                    </div>
                  </SelectContent>
                </Select>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {isHydrated && colorConfig && Object.keys(colorConfig).length > 0
                    ? `กฎสี: ${Object.values(colorConfig).flat().filter(r => r?.enabled).length} / ${Object.values(colorConfig).flat().length} กฎ`
                    : isHydrated
                      ? "กำลังโหลดการตั้งค่าสี..."
                      : "กำลังโหลด..."
                  }
                </div>
              </div>
            </div>



            {/* Items per page control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">จำนวนรายการ</label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-700 dark:text-slate-200">แสดง:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-slate-200 dark:border-slate-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300 bg-white/80 dark:bg-slate-600/80 backdrop-blur-sm text-slate-700 dark:text-slate-200"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                </select>
                <span className="text-sm text-slate-700 dark:text-slate-200">รายการ</span>
              </div>
            </div>

            {/* Sort Status Display */}
            {sortConfig.key && sortConfig.direction && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">สถานะการเรียง</label>
                </div>
                <div className="p-2 bg-emerald-50/80 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-600/30 rounded-lg backdrop-blur-sm">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    🔄 เรียงตาม {getThaiColumnName(sortConfig.key)}: {sortConfig.direction === 'asc' ? 'น้อยไปมาก' : 'มากไปน้อย'}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-slate-300 dark:border-slate-600">
              <Button 
                onClick={onRefresh} 
                disabled={isLoading}
                className="w-full"
                variant="default"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default FilterSidebar
