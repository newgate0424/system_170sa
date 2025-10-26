"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { DateRange } from "react-day-picker";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import FilterSidebar, { ColumnVisibility } from "./FilterSidebar";
import { ResizableHeader } from "./ResizableHeader";
import { useUserPreferences } from "@/lib/preferences";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";

interface DataRow {
  adser?: string;
  adid?: string;
  pageid?: string;
  page?: string;
  content?: string;
  cookie?: string;
  target?: string;
  not_target?: string;
  budget?: string;
  note?: string;
  status?: string;
  start?: string;
  off?: string;
  captions?: string;
  card?: string;
  timezone?: string;
  type_time?: string;
  team?: string;
  total_card?: number;
  card_num?: number;
  total_message?: number;
  meta_message?: number;
  message?: number;
  register?: number;
  deposit?: number;
  cost?: number;
  turnover?: number;
  total_user?: number;
  silent?: number;
  duplicate?: number;
  has_account?: number;
  spammer?: number;
  blocked?: number;
  under_18?: number;
  over_50?: number;
  foreigner?: number;

  [key: string]: string | number | undefined;
}

interface ApiResponse {
  data: DataRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc' | null;
}

interface ExpandedCell {
  rowIndex: number;
  column: string;
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

export default function DataTable() {
  // Next.js Router hooks for URL parameters
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // User Preferences Hook
  const {
    preferences,
    loading: preferencesLoading,
    error: preferencesError,
    updateColorConfiguration,
    updateColumnVisibility,
    updateColumnWidths,
    updateFilterSettings
  } = useUserPreferences();

  // ตรวจสอบสิทธิ์ user ที่ล็อกอิน
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string; adserView?: string[]; teams?: string[] } | null>(null);
  
  // Add initialization flag to prevent auto-save during component initialization
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        console.log('DataTable - Loaded user from localStorage:', userData);
        setCurrentUser(userData);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    } else {
      console.log('DataTable - No user found in localStorage');
    }

    // Listen for login events to reset component state
    const handleUserLogin = () => {
      console.log('🔄 DataTable detected user login, reloading user data...');
      
      // Reset initialization state to allow preferences to reload
      setIsInitialized(false);
      
      // Reload user data
      const newUserStr = localStorage.getItem('user');
      if (newUserStr) {
        try {
          const newUserData = JSON.parse(newUserStr);
          console.log('DataTable - Reloaded user after login:', newUserData);
          setCurrentUser(newUserData);
        } catch (err) {
          console.error('Error parsing new user data:', err);
        }
      }
    };

    // Add event listener
    window.addEventListener('userLoggedIn', handleUserLogin);

    // Cleanup
    return () => {
      window.removeEventListener('userLoggedIn', handleUserLogin);
    };
  }, []);

  // Default visible columns - show only important ones initially (date is always shown)
  const getDefaultVisibleColumns = (): ColumnVisibility => ({
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
    foreigner: true,

    // Daily columns - only show first week by default
    day1: true, day2: true, day3: true, day4: true, day5: true,
    day6: true, day7: true, 
    // Hide the rest by default to reduce clutter
    day8: false, day9: false, day10: false,
    day11: false, day12: false, day13: false, day14: false, day15: false,
    day16: false, day17: false, day18: false, day19: false, day20: false,
    day21: false, day22: false, day23: false, day24: false, day25: false,
    day26: false, day27: false, day28: false, day29: false, day30: false,
    day31: false
  });

  // Get current month date range
  const getCurrentMonthRange = useMemo(() => {
    const now = new Date();
    
    // Get first day of current month using UTC to avoid timezone issues
    const firstDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    
    // Get last day of current month using UTC
    const lastDay = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));
    
    return { 
      from: firstDay,
      to: lastDay
    };
  }, []); // Empty dependency array - only calculate once on mount

  // Load saved filters from localStorage (แยก key ตาม mode)
  const getFilterKey = () => `bigquery-dashboard-filters`;
  const loadSavedFilters = () => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(getFilterKey());
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          dateRange: parsed.dateRange ? {
            from: parsed.dateRange.from ? new Date(parsed.dateRange.from) : undefined,
            to: parsed.dateRange.to ? new Date(parsed.dateRange.to) : undefined
          } : undefined,
          selectedAdser: parsed.selectedAdser || 'all',
          selectedStatus: parsed.selectedStatus || 'all',
          selectedTeam: parsed.selectedTeam || '',
          searchText: parsed.searchText || '',
          pageDisplayMode: parsed.pageDisplayMode || 'pageid',
          itemsPerPage: parsed.itemsPerPage || 100
        };
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
    return null;
  };

  // Helper function to update URL parameters
  const updateURLParams = useCallback((params: {
    team?: string;
    adser?: string;
    page?: number;
    status?: string;
  }) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    
    // Update or remove parameters
    if (params.team !== undefined) {
      if (params.team && params.team !== 'all') {
        current.set('team', params.team);
      } else {
        current.delete('team');
      }
    }
    
    if (params.adser !== undefined) {
      if (params.adser && params.adser !== 'all') {
        current.set('adser', params.adser);
      } else {
        current.delete('adser');
      }
    }
    
    if (params.page !== undefined) {
      if (params.page > 1) {
        current.set('page', params.page.toString());
      } else {
        current.delete('page');
      }
    }
    
    if (params.status !== undefined) {
      if (params.status && params.status !== 'all') {
        current.set('status', params.status);
      } else {
        current.delete('status');
      }
    }
    
    // Build the query string
    const search = current.toString();
    const query = search ? `?${search}` : '';
    
    // Update URL without page reload
    router.push(`${pathname}${query}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // Save filters to localStorage and database
  const saveFilters = useCallback((filters: Record<string, unknown>) => {
    if (typeof window === 'undefined') return;
    console.log('💾 saveFilters called with:', filters);
    try {
      const filterKey = getFilterKey();
      // Save to localStorage for immediate response
      localStorage.setItem(filterKey, JSON.stringify(filters));
      console.log('✅ Filters saved to localStorage with key:', filterKey);
      
      // Save to database via preferences system
      if (updateFilterSettings) {
        const filterSettings = {
          selectedTeam: filters.selectedTeam as string || '',
          selectedAdvertiser: filters.selectedAdser as string || '',
          selectedStatus: filters.selectedStatus as string || '',
          pageDisplayMode: filters.pageDisplayMode as string || '',
          searchText: filters.searchText as string || ''
        };
        
        updateFilterSettings(filterSettings);
        console.log('✅ Filter settings sent to database via preferences:', filterSettings);
      } else {
        console.warn('⚠️ updateFilterSettings function not available');
      }
      
      // Verify it was saved
      const verification = localStorage.getItem(filterKey);
      console.log('🔍 Verification read:', verification ? 'Data found' : 'No data found');
    } catch (error) {
      console.error('❌ Error saving filters:', error);
    }
  }, [updateFilterSettings]);

  // Save and load column visibility using preferences system
  const saveColumnVisibility = useCallback((columns: ColumnVisibility) => {
    if (typeof window === 'undefined') return;
    try {
      // Save to localStorage for immediate response
      localStorage.setItem('bigquery-dashboard-columns', JSON.stringify(columns));
      
      // Save to database via preferences system
      if (updateColumnVisibility) {
        updateColumnVisibility(columns);
        console.log('Column visibility saved to database:', columns);
      }
    } catch (error) {
      console.error('Error saving column visibility:', error);
    }
  }, [updateColumnVisibility]);

  // Data state
  const [data, setData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state - Always start with defaults to prevent infinite loops
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    getCurrentMonthRange
  );
  const [selectedAdser, setSelectedAdser] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [pageDisplayMode, setPageDisplayMode] = useState<string>('pageid');
  
  // Filter sidebar visibility state
  const [isFilterVisible, setIsFilterVisible] = useState<boolean>(true);
  
  // Column visibility state - will be loaded from preferences
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>(getDefaultVisibleColumns());

  // Color configuration state - will be loaded from preferences  
  const [colorConfig, setColorConfig] = useState<ColorConfig>({});

  // Load preferences from database or localStorage
  useEffect(() => {
    console.log('🚀 Loading preferences and column visibility...');
    
    // Check if preferences are available
    if (!preferencesLoading && preferences) {
      console.log('📋 Loading from database preferences:', preferences);
      
      // Load column visibility from preferences
      if (preferences.columnVisibility) {
        console.log('�️ Setting column visibility from preferences:', preferences.columnVisibility);
        setVisibleColumns(preferences.columnVisibility);
      } else {
        console.log('� No column visibility in preferences, using defaults');
        setVisibleColumns(getDefaultVisibleColumns());
      }
      
      // Load color configuration from preferences
      if (preferences.colorConfiguration) {
        console.log('🎨 Setting color config from preferences:', preferences.colorConfiguration);
        setColorConfig(preferences.colorConfiguration);
      } else {
        console.log('🎨 No color config in preferences, using defaults');
        setColorConfig(getDefaultColorConfig());
      }
      
      setIsInitialized(true);
    } else if (!preferencesLoading && !preferences) {
      console.log('📦 No database preferences, checking localStorage...');
      
      // Fallback to localStorage
      try {
        const savedColumnVisibility = localStorage.getItem('monitor-column-visibility');
        if (savedColumnVisibility) {
          const parsed = JSON.parse(savedColumnVisibility);
          console.log('📦 Loading column visibility from localStorage:', parsed);
          setVisibleColumns(parsed);
        } else {
          console.log('📦 No localStorage column visibility, using defaults');
          setVisibleColumns(getDefaultVisibleColumns());
        }
      } catch (error) {
        console.error('❌ Error loading from localStorage:', error);
        setVisibleColumns(getDefaultVisibleColumns());
      }
      
      setColorConfig(getDefaultColorConfig());
      setIsInitialized(true);
    }
  }, [preferences, preferencesLoading]); // Depend on preferences loading

  // Initialize filters from URL parameters (highest priority)
  useEffect(() => {
    if (!isInitialized || preferencesLoading) return;
    
    console.log('🔗 Checking URL parameters for initial load...');
    
    // Get URL parameters
    const teamParam = searchParams.get('team');
    const adserParam = searchParams.get('adser');
    const pageParam = searchParams.get('page');
    const statusParam = searchParams.get('status');
    
    let urlHasParams = false;
    
    // Load from URL if parameters exist
    if (teamParam && teamParam !== 'all') {
      console.log('🔗 Loading team from URL:', teamParam);
      setSelectedTeam(teamParam);
      urlHasParams = true;
    }
    
    if (adserParam && adserParam !== 'all') {
      console.log('🔗 Loading adser from URL:', adserParam);
      setSelectedAdser(adserParam);
      urlHasParams = true;
    }
    
    if (pageParam) {
      const pageNum = parseInt(pageParam, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        console.log('🔗 Loading page from URL:', pageNum);
        setCurrentPage(pageNum);
        urlHasParams = true;
      }
    }
    
    if (statusParam && statusParam !== 'all') {
      console.log('🔗 Loading status from URL:', statusParam);
      setSelectedStatus(statusParam);
      urlHasParams = true;
    }
    
    if (urlHasParams) {
      console.log('✅ Loaded filters from URL parameters');
    }
  }, [isInitialized, preferencesLoading, searchParams]);

  // Load saved filters from preferences or localStorage (if no URL params)
  useEffect(() => {
    console.log('🔍 Loading filter settings...');
    
    // Only load filters after preferences are loaded and component is initialized
    if (!isInitialized || preferencesLoading) {
      console.log('⏳ Waiting for initialization or preferences loading...');
      return;
    }
    
    // Don't override URL parameters
    const hasUrlParams = searchParams.get('team') || searchParams.get('adser') || 
                         searchParams.get('page') || searchParams.get('status');
    if (hasUrlParams) {
      console.log('🔗 URL parameters exist, skipping preference/localStorage load');
      return;
    }
    
    let filtersLoaded = false;
    
    // Try to load from database preferences first
    if (preferences?.filterSettings) {
      const filterSettings = preferences.filterSettings;
      console.log('📋 Loading filter settings from database:', filterSettings);
      
      if (filterSettings.searchText !== undefined) {
        console.log('✅ Loading searchText:', filterSettings.searchText);
        setSearchText(filterSettings.searchText);
        filtersLoaded = true;
      }
      if (filterSettings.selectedTeam !== undefined) {
        console.log('✅ Loading selectedTeam:', filterSettings.selectedTeam);
        setSelectedTeam(filterSettings.selectedTeam);
        filtersLoaded = true;
      }
      if (filterSettings.selectedAdvertiser !== undefined) {
        console.log('✅ Loading selectedAdvertiser:', filterSettings.selectedAdvertiser);
        setSelectedAdser(filterSettings.selectedAdvertiser);
        filtersLoaded = true;
      }
      if (filterSettings.selectedAdser !== undefined) {
        console.log('✅ Loading selectedAdser:', filterSettings.selectedAdser);
        setSelectedAdser(filterSettings.selectedAdser);
        filtersLoaded = true;
      }
      if (filterSettings.pageDisplayMode !== undefined) {
        console.log('✅ Loading pageDisplayMode:', filterSettings.pageDisplayMode);
        setPageDisplayMode(filterSettings.pageDisplayMode);
        filtersLoaded = true;
      }
      if (filterSettings.selectedStatus !== undefined) {
        console.log('✅ Loading selectedStatus:', filterSettings.selectedStatus);
        setSelectedStatus(filterSettings.selectedStatus);
        filtersLoaded = true;
      }
      if (filterSettings.statusFilter !== undefined) {
        console.log('✅ Loading statusFilter:', filterSettings.statusFilter);
        setSelectedStatus(filterSettings.statusFilter);
        filtersLoaded = true;
      }
    }
    
    // Fallback to localStorage if no database preferences
    if (!filtersLoaded) {
      console.log('📦 No filter settings in database, checking localStorage...');
      const savedFilters = loadSavedFilters();
      if (savedFilters) {
        console.log('📦 Loading filter settings from localStorage:', savedFilters);
        if (savedFilters.dateRange) {
          setDateRange(savedFilters.dateRange);
        }
        if (savedFilters.selectedAdser) {
          setSelectedAdser(savedFilters.selectedAdser);
        }
        if (savedFilters.selectedStatus) {
          setSelectedStatus(savedFilters.selectedStatus);
        }
        if (savedFilters.selectedTeam) {
          setSelectedTeam(savedFilters.selectedTeam);
        }
        if (savedFilters.searchText) {
          setSearchText(savedFilters.searchText);
        }
        if (savedFilters.pageDisplayMode) {
          setPageDisplayMode(savedFilters.pageDisplayMode);
        }
        if (savedFilters.itemsPerPage) {
          setItemsPerPage(savedFilters.itemsPerPage);
        }
      }
    }
    
    console.log('✅ Filter settings loaded successfully');
  }, [isInitialized, preferences, preferencesLoading, searchParams]); // Load when initialized and preferences are ready
  
  // Sync debouncedFilters with current filter values - separate effect
  useEffect(() => {
    setDebouncedFilters({
      dateRange,
      selectedAdser,
      selectedStatus,
      selectedTeam,
      searchText
    });
  }, [dateRange, selectedAdser, selectedStatus, selectedTeam, searchText]);

  // Load saved sort settings from localStorage
  useEffect(() => {
    console.log('🔍 Loading sort settings from localStorage...');
    try {
      const savedSortSettings = localStorage.getItem('bigquery-sort-settings');
      console.log('📱 Raw localStorage value:', savedSortSettings);
      
      if (savedSortSettings) {
        const settings = JSON.parse(savedSortSettings);
        console.log('📋 Parsed settings:', settings);
        
        if (settings.column && settings.direction) {
          console.log('✅ Setting sortConfig to:', { key: settings.column, direction: settings.direction });
          setSortConfig({ key: settings.column, direction: settings.direction });
          console.log('Sort settings loaded from localStorage:', settings);
        } else {
          console.log('❌ Invalid settings format:', settings);
        }
      } else {
        console.log('📭 No saved sort settings found');
      }
    } catch (error) {
      console.error('❌ Error loading sort settings from localStorage:', error);
    }
  }, []);

  // Load column visibility from localStorage when preferences system is disabled
  useEffect(() => {
    try {
      const savedColumns = localStorage.getItem('bigquery-dashboard-columns');
      if (savedColumns) {
        const parsedColumns = JSON.parse(savedColumns);
        console.log('Loading column visibility from localStorage (preferences disabled):', parsedColumns);
        setVisibleColumns(parsedColumns);
      }
    } catch (error) {
      console.error('Error loading column visibility from localStorage:', error);
    }
  }, []);

  // Set isInitialized to true since preferences system is disabled
  useEffect(() => {
    console.log('🚀 Setting isInitialized to true (preferences system disabled)');
    setIsInitialized(true);
  }, []);

  // Load color configuration from localStorage when preferences system is disabled
  useEffect(() => {
    console.log('🎨 Loading color configuration from localStorage...');
    try {
      const savedColorConfig = localStorage.getItem('bigquery-color-config');
      if (savedColorConfig) {
        const parsedConfig = JSON.parse(savedColorConfig);
        console.log('✅ Color configuration loaded from localStorage:', parsedConfig);
        setColorConfig(parsedConfig);
        
        // Also sync to preferences system if available
        if (updateColorConfiguration) {
          updateColorConfiguration(parsedConfig);
        }
      } else {
        console.log('📭 No saved color configuration found, using defaults');
        const defaultConfig = getDefaultColorConfig();
        setColorConfig(defaultConfig);
        
        // Save defaults to localStorage and preferences
        localStorage.setItem('bigquery-color-config', JSON.stringify(defaultConfig));
        if (updateColorConfiguration) {
          updateColorConfiguration(defaultConfig);
        }
      }
    } catch (error) {
      console.error('❌ Error loading color configuration from localStorage:', error);
      const defaultConfig = getDefaultColorConfig();
      setColorConfig(defaultConfig);
      
      // Save defaults to localStorage
      localStorage.setItem('bigquery-color-config', JSON.stringify(defaultConfig));
    }
  }, [updateColorConfiguration]);

  // Default color configuration
  const getDefaultColorConfig = (): ColorConfig => ({
    // Cost & Performance Metrics
    cpm: [
      { id: 'cpm-high', column: 'cpm', condition: 'greater', value1: 50, isPercentage: false, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true },
      { id: 'cpm-low', column: 'cpm', condition: 'less', value1: 20, isPercentage: false, isTextCondition: false, color: '#16a34a', backgroundColor: '#f0fdf4', isBold: false, enabled: true }
    ],
    cost: [
      { id: 'cost-high', column: 'cost', condition: 'greater', value1: 10000, isPercentage: false, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: true, enabled: true },
      { id: 'cost-medium', column: 'cost', condition: 'between', value1: 5000, value2: 10000, isPercentage: false, isTextCondition: false, color: '#ea580c', backgroundColor: '#fff7ed', isBold: false, enabled: true },
      { id: 'cost-low', column: 'cost', condition: 'less', value1: 1000, isPercentage: false, isTextCondition: false, color: '#16a34a', backgroundColor: '#f0fdf4', isBold: false, enabled: true }
    ],
    turnover: [
      { id: 'turnover-excellent', column: 'turnover', condition: 'greater', value1: 50000, isPercentage: false, isTextCondition: false, color: '#059669', backgroundColor: '#ecfdf5', isBold: true, enabled: true },
      { id: 'turnover-good', column: 'turnover', condition: 'between', value1: 20000, value2: 50000, isPercentage: false, isTextCondition: false, color: '#16a34a', backgroundColor: '#f0fdf4', isBold: false, enabled: true },
      { id: 'turnover-low', column: 'turnover', condition: 'less', value1: 5000, isPercentage: false, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true }
    ],
    // Registration & Deposit Metrics
    register: [
      { id: 'register-high', column: 'register', condition: 'greater', value1: 100, isPercentage: false, isTextCondition: false, color: '#059669', backgroundColor: '#ecfdf5', isBold: true, enabled: true },
      { id: 'register-medium', column: 'register', condition: 'between', value1: 50, value2: 100, isPercentage: false, isTextCondition: false, color: '#16a34a', backgroundColor: '#f0fdf4', isBold: false, enabled: true },
      { id: 'register-low', column: 'register', condition: 'less', value1: 10, isPercentage: false, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true }
    ],
    deposit: [
      { id: 'deposit-excellent', column: 'deposit', condition: 'greater', value1: 50, isPercentage: false, isTextCondition: false, color: '#059669', backgroundColor: '#ecfdf5', isBold: true, enabled: true },
      { id: 'deposit-good', column: 'deposit', condition: 'between', value1: 20, value2: 50, isPercentage: false, isTextCondition: false, color: '#16a34a', backgroundColor: '#f0fdf4', isBold: false, enabled: true },
      { id: 'deposit-none', column: 'deposit', condition: 'equals', value1: 0, isPercentage: false, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true }
    ],
    // Message Metrics
    total_message: [
      { id: 'totalmsg-high', column: 'total_message', condition: 'greater', value1: 1000, isPercentage: false, isTextCondition: false, color: '#059669', backgroundColor: '#ecfdf5', isBold: false, enabled: true },
      { id: 'totalmsg-low', column: 'total_message', condition: 'less', value1: 100, isPercentage: false, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true }
    ],
    meta_message: [
      { id: 'metamsg-high', column: 'meta_message', condition: 'greater', value1: 500, isPercentage: false, isTextCondition: false, color: '#059669', backgroundColor: '#ecfdf5', isBold: false, enabled: true },
      { id: 'metamsg-low', column: 'meta_message', condition: 'less', value1: 50, isPercentage: false, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true }
    ],
    // User Quality Metrics  
    total_user: [
      { id: 'totaluser-high', column: 'total_user', condition: 'greater', value1: 500, isPercentage: false, isTextCondition: false, color: '#059669', backgroundColor: '#ecfdf5', isBold: false, enabled: true },
      { id: 'totaluser-low', column: 'total_user', condition: 'less', value1: 50, isPercentage: false, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true }
    ],
    totalLoss: [
      { id: 'loss-high', column: 'totalLoss', condition: 'greater', value1: 30, isPercentage: true, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true },
      { id: 'loss-medium', column: 'totalLoss', condition: 'between', value1: 15, value2: 30, isPercentage: true, isTextCondition: false, color: '#ea580c', backgroundColor: '#fff7ed', isBold: false, enabled: true },
      { id: 'loss-low', column: 'totalLoss', condition: 'less', value1: 10, isPercentage: true, isTextCondition: false, color: '#16a34a', backgroundColor: '#f0fdf4', isBold: false, enabled: true }
    ],
    qualityContact: [
      { id: 'quality-excellent', column: 'qualityContact', condition: 'greater', value1: 150, isPercentage: false, isTextCondition: false, color: '#059669', backgroundColor: '#ecfdf5', isBold: true, enabled: true },
      { id: 'quality-good', column: 'qualityContact', condition: 'between', value1: 80, value2: 150, isPercentage: false, isTextCondition: false, color: '#16a34a', backgroundColor: '#f0fdf4', isBold: false, enabled: true },
      { id: 'quality-low', column: 'qualityContact', condition: 'less', value1: 50, isPercentage: false, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true }
    ],
    // Cost Analysis
    costPerMessage: [
      { id: 'costmsg-high', column: 'costPerMessage', condition: 'greater', value1: 15, isPercentage: false, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true },
      { id: 'costmsg-medium', column: 'costPerMessage', condition: 'between', value1: 8, value2: 15, isPercentage: false, isTextCondition: false, color: '#ea580c', backgroundColor: '#fff7ed', isBold: false, enabled: true },
      { id: 'costmsg-low', column: 'costPerMessage', condition: 'less', value1: 5, isPercentage: false, isTextCondition: false, color: '#16a34a', backgroundColor: '#f0fdf4', isBold: false, enabled: true }
    ],
    costPerDeposit: [
      { id: 'costdep-notopup', column: 'costPerDeposit', condition: 'contains', value1: 'ยังไม่มีเติม', isPercentage: false, isTextCondition: true, color: '#6366f1', backgroundColor: '#eef2ff', isBold: false, enabled: true },
      { id: 'costdep-high', column: 'costPerDeposit', condition: 'greater', value1: 1000, isPercentage: false, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: true, enabled: true },
      { id: 'costdep-medium', column: 'costPerDeposit', condition: 'between', value1: 500, value2: 1000, isPercentage: false, isTextCondition: false, color: '#ea580c', backgroundColor: '#fff7ed', isBold: false, enabled: true },
      { id: 'costdep-good', column: 'costPerDeposit', condition: 'less', value1: 300, isPercentage: false, isTextCondition: false, color: '#16a34a', backgroundColor: '#f0fdf4', isBold: false, enabled: true }
    ],
    // Campaign Status
    status: [
      { id: 'status-active', column: 'status', condition: 'equals', value1: 'Active', isPercentage: false, isTextCondition: true, color: '#059669', backgroundColor: '#ecfdf5', isBold: false, enabled: true },
      { id: 'status-inactive', column: 'status', condition: 'equals', value1: 'Inactive', isPercentage: false, isTextCondition: true, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true },
      { id: 'status-pending', column: 'status', condition: 'equals', value1: 'Pending', isPercentage: false, isTextCondition: true, color: '#ea580c', backgroundColor: '#fff7ed', isBold: false, enabled: true }
    ],
    // Data Quality Issues
    silent: [
      { id: 'silent-high', column: 'silent', condition: 'greater', value1: 20, isPercentage: true, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true },
      { id: 'silent-medium', column: 'silent', condition: 'between', value1: 10, value2: 20, isPercentage: true, isTextCondition: false, color: '#ea580c', backgroundColor: '#fff7ed', isBold: false, enabled: true }
    ],
    duplicate: [
      { id: 'duplicate-high', column: 'duplicate', condition: 'greater', value1: 15, isPercentage: true, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true },
      { id: 'duplicate-medium', column: 'duplicate', condition: 'between', value1: 5, value2: 15, isPercentage: true, isTextCondition: false, color: '#ea580c', backgroundColor: '#fff7ed', isBold: false, enabled: true }
    ],
    hasAccount: [
      { id: 'hasaccount-high', column: 'hasAccount', condition: 'greater', value1: 10, isPercentage: true, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true },
      { id: 'hasaccount-medium', column: 'hasAccount', condition: 'between', value1: 5, value2: 10, isPercentage: true, isTextCondition: false, color: '#ea580c', backgroundColor: '#fff7ed', isBold: false, enabled: true }
    ],
    spammer: [
      { id: 'spammer-high', column: 'spammer', condition: 'greater', value1: 5, isPercentage: true, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true },
      { id: 'spammer-medium', column: 'spammer', condition: 'between', value1: 2, value2: 5, isPercentage: true, isTextCondition: false, color: '#ea580c', backgroundColor: '#fff7ed', isBold: false, enabled: true }
    ],
    blocked: [
      { id: 'blocked-high', column: 'blocked', condition: 'greater', value1: 5, isPercentage: true, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true },
      { id: 'blocked-medium', column: 'blocked', condition: 'between', value1: 2, value2: 5, isPercentage: true, isTextCondition: false, color: '#ea580c', backgroundColor: '#fff7ed', isBold: false, enabled: true }
    ],
    // Demographic Issues
    under18: [
      { id: 'under18-high', column: 'under18', condition: 'greater', value1: 10, isPercentage: true, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true },
      { id: 'under18-medium', column: 'under18', condition: 'between', value1: 5, value2: 10, isPercentage: true, isTextCondition: false, color: '#ea580c', backgroundColor: '#fff7ed', isBold: false, enabled: true }
    ],
    over50: [
      { id: 'over50-high', column: 'over50', condition: 'greater', value1: 15, isPercentage: true, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true },
      { id: 'over50-medium', column: 'over50', condition: 'between', value1: 8, value2: 15, isPercentage: true, isTextCondition: false, color: '#ea580c', backgroundColor: '#fff7ed', isBold: false, enabled: true }
    ],
    foreigner: [
      { id: 'foreigner-high', column: 'foreigner', condition: 'greater', value1: 10, isPercentage: true, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true },
      { id: 'foreigner-medium', column: 'foreigner', condition: 'between', value1: 5, value2: 10, isPercentage: true, isTextCondition: false, color: '#ea580c', backgroundColor: '#fff7ed', isBold: false, enabled: true }
    ],
    // Card Metrics
    total_card: [
      { id: 'totalcard-high', column: 'total_card', condition: 'greater', value1: 10, isPercentage: false, isTextCondition: false, color: '#059669', backgroundColor: '#ecfdf5', isBold: false, enabled: true },
      { id: 'totalcard-low', column: 'total_card', condition: 'less', value1: 3, isPercentage: false, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true }
    ],
    card_num: [
      { id: 'cardnum-high', column: 'card_num', condition: 'greater', value1: 5, isPercentage: false, isTextCondition: false, color: '#059669', backgroundColor: '#ecfdf5', isBold: false, enabled: true },
      { id: 'cardnum-low', column: 'card_num', condition: 'less', value1: 2, isPercentage: false, isTextCondition: false, color: '#dc2626', backgroundColor: '#fef2f2', isBold: false, enabled: true }
    ]
  });

  // Save and load column widths using preferences system
  const saveColumnWidths = (widths: {[key: string]: number}) => {
    if (typeof window === 'undefined') return;
    try {
      console.log('💾 Saving column widths:', widths);
      
      // Save to localStorage for immediate response
      localStorage.setItem('bigquery-dashboard-column-widths', JSON.stringify(widths));
      console.log('✅ Column widths saved to localStorage');
      
      // Save to database via preferences system
      if (updateColumnWidths) {
        updateColumnWidths(widths);
        console.log('✅ Column widths sent to database via preferences');
      } else {
        console.warn('⚠️ updateColumnWidths function not available');
      }
    } catch (error) {
      console.error('❌ Error saving column widths:', error);
    }
  };

  const loadColumnWidths = (): {[key: string]: number} => {
    if (typeof window === 'undefined') {
      console.log('🔄 Server-side rendering - using default column widths');
      return getDefaultColumnWidths();
    }
    
    console.log('🔄 Loading column widths...');
    
    // First try to load from user preferences
    if (preferences?.columnWidths && Object.keys(preferences.columnWidths).length > 0) {
      console.log('✅ Loading column widths from database preferences:', preferences.columnWidths);
      // Merge with default widths to handle new columns that might be added
      const merged = { ...getDefaultColumnWidths(), ...preferences.columnWidths };
      console.log('🔄 Merged column widths:', merged);
      return merged;
    }
    
    // Fallback to localStorage for backwards compatibility
    try {
      const saved = localStorage.getItem('bigquery-dashboard-column-widths');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('📦 Loading column widths from localStorage (will sync to database):', parsed);
        
        // Sync to database
        if (updateColumnWidths) {
          console.log('🔄 Syncing localStorage column widths to database...');
          updateColumnWidths(parsed);
        } else {
          console.warn('⚠️ updateColumnWidths function not available for sync');
        }
        
        // Merge with default widths to handle new columns that might be added
        const merged = { ...getDefaultColumnWidths(), ...parsed };
        console.log('🔄 Merged column widths from localStorage:', merged);
        return merged;
      }
    } catch (error) {
      console.error('❌ Error loading column widths from localStorage:', error);
    }
    
    const defaultWidths = getDefaultColumnWidths();
    console.log('🔄 Using default column widths:', defaultWidths);
    return defaultWidths;
  };

  // Default column widths function
  const getDefaultColumnWidths = (): {[key: string]: number} => ({
    no: 60,
    adser: 75,
    adId: 120,
    pageId: 120,
    page: 100,
    e: 80,
    cookie: 100,
    j: 80,
    k: 80,
    budget: 75,
    note: 150,
    status: 100,
    start: 120,
    off: 120,
    captions: 150,
    not_target: 150,
    aj: 100,
    timezone: 100,
    cpm: 75,
    totalMessage: 75,
    costPerMessage: 75,
    message: 100,
    register: 75,
    deposit: 75,
    costPerDeposit: 75,
    cost: 75,
    turnover: 100,
    totalUser: 100,
    totalLoss: 100,
    qualityContact: 75,
    silent: 75,
    duplicate: 75,
    hasAccount: 75,
    spammer: 75,
    blocked: 75,
    under18: 75,
    over50: 75,
    foreigner: 75,
    // Daily deposit columns
    day1: 50, day2: 50, day3: 50, day4: 50, day5: 50,
    day6: 50, day7: 50, day8: 50, day9: 50, day10: 50,
    day11: 50, day12: 50, day13: 50, day14: 50, day15: 50,
    day16: 50, day17: 50, day18: 50, day19: 50, day20: 50,
    day21: 50, day22: 50, day23: 50, day24: 50, day25: 50,
    day26: 50, day27: 50, day28: 50, day29: 50, day30: 50,
    day31: 50
  });

  // Column width state - เริ่มด้วย default ก่อน แล้วค่อย sync จาก preferences
  const [columnWidths, setColumnWidths] = useState<{[key: string]: number}>(() => {
    const defaultWidths = getDefaultColumnWidths();
    console.log('🏁 DataTable mounted - Initial column widths:', defaultWidths);
    return defaultWidths;
  });

  // Load column widths on component mount and when preferences change
  useEffect(() => {
    // Don't load if still loading preferences
    if (preferencesLoading) {
      console.log('🔄 Still loading preferences, waiting...');
      return;
    }
    
    const loadAndSetColumnWidths = () => {
      const loaded = loadColumnWidths();
      console.log('🔄 Setting column widths - preferences loaded:', !!preferences, loaded);
      setColumnWidths(loaded);
    };
    
    loadAndSetColumnWidths();
  }, [preferences?.columnWidths, preferencesLoading]); // Include loading state

  // Handle column width change with enhanced logging
  const handleColumnWidthChange = useCallback((key: string, width: number) => {
    console.log(`🔧 Column width change requested: ${key} = ${width}px`);
    
    setColumnWidths(prev => {
      const newWidths = {
        ...prev,
        [key]: width
      };
      console.log(`📝 Updated columnWidths state:`, newWidths);
      
      // Save to localStorage and database
      saveColumnWidths(newWidths);
      return newWidths;
    });
  }, []);

  // Expanded cell state for double-click viewing
  const [expandedCell, setExpandedCell] = useState<ExpandedCell | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });
  
  // Load sorting preferences
  useEffect(() => {
    if (preferences?.filterSettings?.sortSettings && 
        (!sortConfig.key || sortConfig.key !== preferences.filterSettings.sortSettings.column)) {
      const sortSettings = preferences.filterSettings.sortSettings;
      setSortConfig({
        key: sortSettings.column,
        direction: sortSettings.direction
      });
    }
  }, [preferences?.filterSettings?.sortSettings]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Update URL when filters change
  useEffect(() => {
    if (!isInitialized) return; // Don't update URL during initialization
    
    console.log('🔗 Updating URL parameters...');
    updateURLParams({
      team: selectedTeam,
      adser: selectedAdser,
      page: currentPage,
      status: selectedStatus
    });
  }, [selectedTeam, selectedAdser, currentPage, selectedStatus, isInitialized, updateURLParams]);

  // Daily deposits state
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [dailyDepositsData, setDailyDepositsData] = useState<Record<string, Record<string, number>>>({});
  const [isLoadingDailyDeposits, setIsLoadingDailyDeposits] = useState<boolean>(false);
  const [isDailyDepositsSidebarOpen, setIsDailyDepositsSidebarOpen] = useState<boolean>(false);

  // Refs for scroll sync
  const mainTableScrollRef = useRef<HTMLDivElement>(null);
  const dailyDepositsScrollRef = useRef<HTMLDivElement>(null);

  // Scroll sync handler
  const handleMainTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (dailyDepositsScrollRef.current && mainTableScrollRef.current) {
      dailyDepositsScrollRef.current.scrollTop = mainTableScrollRef.current.scrollTop;
    }
  };

  const handleDailyDepositsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (mainTableScrollRef.current && dailyDepositsScrollRef.current) {
      mainTableScrollRef.current.scrollTop = dailyDepositsScrollRef.current.scrollTop;
    }
  };

  // Get days in selected month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const daysInSelectedMonth = getDaysInMonth(selectedYear, selectedMonth);
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  // Fetch daily deposits data
  const fetchDailyDeposits = useCallback(async (month: number, year: number) => {
    setIsLoadingDailyDeposits(true);
    try {
      console.log(`Fetching daily deposits for ${year}-${month}`);
      const response = await fetch(`/api/daily-deposits?month=${month}&year=${year}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setDailyDepositsData(result.data);
        console.log(`Successfully loaded daily deposits data for ${result.summary.totalAdIds} ad IDs`);
      } else {
        console.error('Failed to fetch daily deposits:', result.error);
        setDailyDepositsData({});
      }
    } catch (error) {
      console.error('Error fetching daily deposits:', error);
      setDailyDepositsData({});
    } finally {
      setIsLoadingDailyDeposits(false);
    }
  }, []);

  // Effect to fetch daily deposits when month/year changes
  useEffect(() => {
    fetchDailyDeposits(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, fetchDailyDeposits]);

  // Helper functions for daily deposits table styling
  const getCurrentDay = () => new Date().getDate();
  const getCurrentMonth = () => new Date().getMonth() + 1;
  const getCurrentYear = () => new Date().getFullYear();

  const getDayStatus = (dayNumber: number, startDate: string | null, endDate: string | null) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Check if we're looking at current month/year
    if (selectedMonth !== currentMonth || selectedYear !== currentYear) {
      return 'inactive'; // Past or future month
    }

    // Check if day is within start-end range
    if (startDate) {
      const start = new Date(startDate);
      const startDay = start.getDate();
      const startMonth = start.getMonth() + 1;
      const startYear = start.getFullYear();

      // Only highlight if start date is in the same month/year we're viewing
      if (startMonth === selectedMonth && startYear === selectedYear) {
        if (dayNumber < startDay) {
          return 'before-start'; // Before start date
        }
      }
    }

    if (dayNumber === currentDay) {
      return 'current'; // Today
    } else if (dayNumber < currentDay) {
      return 'past'; // Past days (after start date)
    } else {
      return 'future'; // Future days
    }
  };

  const getDayCellStyle = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-blue-200 dark:bg-blue-900/50'; // Current day - dark blue background
      case 'past':
        return 'bg-purple-50 dark:bg-purple-900/20'; // Past days (active period) - light purple
      case 'before-start':
        return ''; // Before start date - normal
      case 'future':
        return ''; // Future days - normal
      default:
        return '';
    }
  };

  const getDayHeaderStyle = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-blue-200 dark:bg-blue-900/50'; // Current day header - same as data cells
      case 'past':
        return 'bg-slate-100 dark:bg-slate-800'; // Past days - normal header
      case 'before-start':
        return 'bg-slate-100 dark:bg-slate-800'; // Before start date - normal header
      case 'future':
        return 'bg-slate-100 dark:bg-slate-800'; // Future days - normal header
      default:
        return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  const getDayValueStyle = (status: string, value: number) => {
    if (value <= 0) return 'text-gray-500 dark:text-gray-400 font-normal';
    
    switch (status) {
      case 'current':
        return 'font-semibold text-blue-700 dark:text-blue-200'; // Current day - bold blue text
      case 'past':
        return 'font-normal text-slate-700 dark:text-slate-200'; // Past days - normal weight text
      default:
        return 'font-normal text-slate-700 dark:text-slate-200'; // Default - normal weight text
    }
  };
  const [itemsPerPage, setItemsPerPage] = useState<number>(100);

  // Available options for filters
  const [adsers, setAdsers] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [teamAdvertiserMapping, setTeamAdvertiserMapping] = useState<Record<string, string[]>>({});

  // Debug: Log teams state when it changes
  useEffect(() => {
    console.log('🔄 Teams state updated:', teams);
  }, [teams]);

  // Function to get Thai column name
  const getThaiColumnName = (key: string): string => {
    const columnNames: Record<string, string> = {
      'no': 'ลำดับ',
      'adser': 'Adser',
      'adid': 'ID โฆษณา',
      'pageid': 'ID เพจ',
      'page': 'ชื่อเพจ',
      'content': 'เนื้อหา',
      'cookie': 'Cookie',
      'target': 'เป้าหมาย',
      'not_target': 'ไม่เป้าหมาย',
      'budget': 'งบประมาณ',
      'note': 'หมายเหตุ',
      'status': 'สถานะ',
      'start': 'วันเริ่ม',
      'off': 'วันสิ้นสุด',
      'captions': 'คำบรรยาย',
      'card': 'การ์ด',
      'timezone': 'เขตเวลา',
      'type_time': 'ประเภทเวลา',
      'team': 'ทีม',
      'total_card': 'การ์ดทั้งหมด',
      'card_num': 'จำนวนการ์ด',
      'total_message': 'ข้อความทั้งหมด',
      'meta_message': 'ข้อความ Meta',
      'register': 'สมัครสมาชิก',
      'deposit': 'ฝากเงิน',
      'cost': 'ค่าใช้จ่าย',
      'turnover': 'ยอดเทิร์น',
      'total_user': 'ผู้ใช้ทั้งหมด',
      'silent': 'เงียบ',
      'duplicate': 'ซ้ำ',
      'has_account': 'มีบัญชี',
      'spammer': 'Spammer',
      'blocked': 'ถูกบล็อก',
      'under_18': 'อายุต่ำกว่า 18',
      'over_50': 'อายุมากกว่า 50',
      'foreigner': 'ชาวต่างชาติ',
      'cpm': 'CPM',
      'cost_per_message': 'ค่าใช้จ่ายต่อข้อความ',
      'cost_per_deposit': 'ค่าใช้จ่ายต่อฝากเงิน',
      // Daily deposit columns
      'day1': 'วันที่ 1', 'day2': 'วันที่ 2', 'day3': 'วันที่ 3', 'day4': 'วันที่ 4', 'day5': 'วันที่ 5',
      'day6': 'วันที่ 6', 'day7': 'วันที่ 7', 'day8': 'วันที่ 8', 'day9': 'วันที่ 9', 'day10': 'วันที่ 10',
      'day11': 'วันที่ 11', 'day12': 'วันที่ 12', 'day13': 'วันที่ 13', 'day14': 'วันที่ 14', 'day15': 'วันที่ 15',
      'day16': 'วันที่ 16', 'day17': 'วันที่ 17', 'day18': 'วันที่ 18', 'day19': 'วันที่ 19', 'day20': 'วันที่ 20',
      'day21': 'วันที่ 21', 'day22': 'วันที่ 22', 'day23': 'วันที่ 23', 'day24': 'วันที่ 24', 'day25': 'วันที่ 25',
      'day26': 'วันที่ 26', 'day27': 'วันที่ 27', 'day28': 'วันที่ 28', 'day29': 'วันที่ 29', 'day30': 'วันที่ 30',
      'day31': 'วันที่ 31'
    };
    return columnNames[key] || key;
  };

  // Sorting function
  const handleSort = useCallback((key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      } else {
        direction = 'asc';
      }
    }
    
    setSortConfig({ key, direction });
    
    // Save sort settings to localStorage immediately
    console.log('💾 Attempting to save sort settings:', { key, direction });
    try {
      if (direction) {
        const sortSettings = {
          column: key,
          direction,
          timestamp: Date.now()
        };
        localStorage.setItem('bigquery-sort-settings', JSON.stringify(sortSettings));
        console.log('✅ Sort settings saved to localStorage:', sortSettings);
        
        // Verify it was saved
        const verification = localStorage.getItem('bigquery-sort-settings');
        console.log('🔍 Verification read:', verification);
      } else {
        localStorage.removeItem('bigquery-sort-settings');
        console.log('🗑️ Sort settings cleared from localStorage');
      }
    } catch (error) {
      console.error('❌ Error saving sort settings:', error);
    }

    // Also save sort settings to preferences (debounced to prevent infinite loops)
    if (updateFilterSettings) {
      setTimeout(() => {
        if (direction) {
          updateFilterSettings({
            ...preferences?.filterSettings,
            sortSettings: {
              column: key,
              direction,
              timestamp: Date.now()
            }
          });
        } else {
          // Clear sort settings when direction is null
          const updatedSettings = { ...preferences?.filterSettings };
          delete updatedSettings.sortSettings;
          updateFilterSettings(updatedSettings);
        }
      }, 100); // Small delay to prevent immediate re-render
    }
  }, [sortConfig.key, sortConfig.direction, preferences?.filterSettings, updateFilterSettings]);

  // Special color function for costPerDeposit that handles both text and numeric values
  const getCostPerDepositColor = (cost: number, deposit: number): { color?: string; backgroundColor?: string; fontWeight?: string } => {
    const textValue = calculateCostPerDeposit(cost, deposit);
    const numericValue = deposit > 0 ? cost / deposit : 0;
    
    const rules = colorConfig['costPerDeposit'];
    if (!rules || !Array.isArray(rules)) return {};

    for (const rule of rules) {
      if (!rule.enabled) continue;

      // Handle text conditions first (higher priority)
      if (rule.isTextCondition && typeof textValue === 'string') {
        const textLower = textValue.toLowerCase();
        const searchText = String(rule.value1).toLowerCase();
        
        switch (rule.condition) {
          case 'contains':
            if (textLower.includes(searchText)) {
              return { 
                color: rule.color, 
                backgroundColor: rule.backgroundColor,
                fontWeight: rule.isBold ? 'bold' : 'normal'
              };
            }
            break;
          case 'equals':
            if (textLower === searchText) {
              return { 
                color: rule.color, 
                backgroundColor: rule.backgroundColor,
                fontWeight: rule.isBold ? 'bold' : 'normal'
              };
            }
            break;
        }
      }
      // Handle numeric conditions
      else if (!rule.isTextCondition && typeof numericValue === 'number') {
        const ruleValue = Number(rule.value1);
        const ruleValue2 = rule.value2 !== undefined ? Number(rule.value2) : undefined;
        
        let compareValue = numericValue;
        if (rule.isPercentage) {
          // For percentage, calculate relative to max value in dataset or use direct value
          compareValue = numericValue; // We'll use the raw value for percentage comparison
        }

        switch (rule.condition) {
          case 'greater':
            if (compareValue > ruleValue) {
              return { 
                color: rule.color, 
                backgroundColor: rule.backgroundColor,
                fontWeight: rule.isBold ? 'bold' : 'normal'
              };
            }
            break;
          case 'less':
            if (compareValue < ruleValue) {
              return { 
                color: rule.color, 
                backgroundColor: rule.backgroundColor,
                fontWeight: rule.isBold ? 'bold' : 'normal'
              };
            }
            break;
          case 'between':
            if (ruleValue2 !== undefined && compareValue >= ruleValue && compareValue <= ruleValue2) {
              return { 
                color: rule.color, 
                backgroundColor: rule.backgroundColor,
                fontWeight: rule.isBold ? 'bold' : 'normal'
              };
            }
            break;
        }
      }
    }

    return {};
  };

  // Color formatting function
  // Generate unique colors for adsers with oval/pill styling
  const getAdserColor = (adser: string): { color: string; backgroundColor: string; borderRadius: string; padding: string; margin: string; display: string; maxWidth: string } => {
    if (!adser || adser.trim() === '') {
      return { 
        color: '#64748b', 
        backgroundColor: 'transparent',
        borderRadius: '0',
        padding: '0',
        margin: '0',
        display: 'block',
        maxWidth: 'none'
      };
    }

    // Predefined color palette for specific adsers to ensure distinctiveness
    const adserColorMap: { [key: string]: { hue: number; saturation: number; lightness: number; bgSaturation: number; bgLightness: number } } = {
      'lucifer': { hue: 0, saturation: 70, lightness: 30, bgSaturation: 50, bgLightness: 92 }, // Red
      'risa': { hue: 240, saturation: 75, lightness: 25, bgSaturation: 45, bgLightness: 90 }, // Blue
      'joanne': { hue: 120, saturation: 65, lightness: 28, bgSaturation: 40, bgLightness: 88 }, // Green
      'sim': { hue: 280, saturation: 70, lightness: 32, bgSaturation: 50, bgLightness: 91 }, // Purple
      'minho': { hue: 35, saturation: 75, lightness: 30, bgSaturation: 45, bgLightness: 89 }, // Orange
    };

    const adserKey = adser.toLowerCase();
    
    // Check if this adser has a predefined color
    if (adserColorMap[adserKey]) {
      const colorData = adserColorMap[adserKey];
      return {
        color: `hsl(${colorData.hue}, ${colorData.saturation}%, ${colorData.lightness}%)`,
        backgroundColor: `hsla(${colorData.hue}, ${colorData.bgSaturation}%, ${colorData.bgLightness}%, 0.7)`,
        borderRadius: '10px',
        padding: '2px 6px',
        margin: '1px',
        display: 'inline-block',
        maxWidth: 'calc(100% - 6px)'
      };
    }

    // For other adsers, use hash-based generation with better distribution
    let hash = 0;
    for (let i = 0; i < adser.length; i++) {
      const char = adser.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    hash = Math.abs(hash);
    
    // Use golden ratio for better color distribution
    const goldenRatio = 0.618033988749;
    const hue = Math.floor((hash * goldenRatio) % 1 * 360);
    
    // Avoid colors too close to predefined ones
    const predefinedHues = [0, 240, 120, 280, 35];
    let adjustedHue = hue;
    for (const predefinedHue of predefinedHues) {
      if (Math.abs(adjustedHue - predefinedHue) < 30) {
        adjustedHue = (adjustedHue + 60) % 360;
      }
    }
    
    const saturation = 60 + (hash % 25); // 60-85%
    const lightness = 25 + (hash % 15); // 25-40%
    const bgSaturation = 35 + (hash % 20); // 35-55%
    const bgLightness = 85 + (hash % 10); // 85-95%
    
    return {
      color: `hsl(${adjustedHue}, ${saturation}%, ${lightness}%)`,
      backgroundColor: `hsla(${adjustedHue}, ${bgSaturation}%, ${bgLightness}%, 0.6)`,
      borderRadius: '10px',
      padding: '2px 6px',
      margin: '1px',
      display: 'inline-block',
      maxWidth: 'calc(100% - 6px)'
    };
  };

  const getColumnColor = (columnKey: string, value: number | string, totalValue?: number): { color?: string; backgroundColor?: string; fontWeight?: string; borderRadius?: string; padding?: string; margin?: string; display?: string; maxWidth?: string } => {
    // Special handling for adser column to assign unique colors with oval styling
    if (columnKey === 'adser' && typeof value === 'string' && value.trim() !== '') {
      const adserColors = getAdserColor(value);
      return {
        ...adserColors,
        fontWeight: 'normal'
      };
    }

    const rules = colorConfig[columnKey];
    if (!rules || !Array.isArray(rules)) return {};

    for (const rule of rules) {
      if (!rule.enabled) continue;

      // Handle text conditions
      if (rule.isTextCondition && typeof value === 'string') {
        const textValue = value.toLowerCase();
        const searchText = String(rule.value1).toLowerCase();
        
        switch (rule.condition) {
          case 'contains':
            if (textValue.includes(searchText)) {
              return { 
                color: rule.color, 
                backgroundColor: rule.backgroundColor,
                fontWeight: rule.isBold ? 'bold' : 'normal'
              };
            }
            break;
          case 'equals':
            if (textValue === searchText) {
              return { 
                color: rule.color, 
                backgroundColor: rule.backgroundColor,
                fontWeight: rule.isBold ? 'bold' : 'normal'
              };
            }
            break;
          case 'not_contains':
            if (!textValue.includes(searchText)) {
              return { 
                color: rule.color, 
                backgroundColor: rule.backgroundColor,
                fontWeight: rule.isBold ? 'bold' : 'normal'
              };
            }
            break;
        }
        continue;
      }

      // Handle numeric conditions
      if (!rule.isTextCondition && typeof value === 'number') {
        let compareValue = value;
        
        // Handle percentage calculations
        if (rule.isPercentage && totalValue !== undefined && totalValue > 0) {
          compareValue = (value / totalValue) * 100;
        }

        // Check conditions
        switch (rule.condition) {
          case 'greater':
            if (compareValue > Number(rule.value1)) {
              return { 
                color: rule.color, 
                backgroundColor: rule.backgroundColor,
                fontWeight: rule.isBold ? 'bold' : 'normal'
              };
            }
            break;
          case 'less':
            if (compareValue < Number(rule.value1)) {
              return { 
                color: rule.color, 
                backgroundColor: rule.backgroundColor,
                fontWeight: rule.isBold ? 'bold' : 'normal'
              };
            }
            break;
          case 'between':
            if (rule.value2 !== undefined && compareValue >= Number(rule.value1) && compareValue <= Number(rule.value2)) {
              return { 
                color: rule.color, 
                backgroundColor: rule.backgroundColor,
                fontWeight: rule.isBold ? 'bold' : 'normal'
              };
            }
            break;
        }
      }
    }

    return {};
  };

  // Calculation utility functions
  const calculateCPM = (cost: number, totalMessage: number): string => {
    if (!totalMessage || totalMessage === 0) return '-';
    const cpm = (cost / totalMessage).toFixed(2);
    return parseFloat(cpm).toLocaleString();
  };

  const calculateCostPerMessage = (cost: number, message: number): string => {
    if (!message || message === 0) return '-';
    const costPerMsg = (cost / message).toFixed(2);
    return parseFloat(costPerMsg).toLocaleString();
  };

  const calculateCostPerDeposit = (cost: number, deposit: number): string => {
    if (!deposit || deposit === 0) return 'ยังไม่มีเติม';
    const costPerDep = (cost / deposit).toFixed(2);
    return parseFloat(costPerDep).toLocaleString();
  };

  // Format status with colors
  const formatStatusWithColor = (status: string) => {
    const getStatusStyle = (status: string) => {
      switch (status?.toLowerCase()) {
        case 'active':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'inactive':
          return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'paused':
          return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'completed':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'cancelled':
        case 'canceled':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'draft':
          return 'bg-purple-100 text-purple-800 border-purple-200';
        default:
          return 'bg-gray-100 text-gray-600 border-gray-200';
      }
    };

    const style = getStatusStyle(status);
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
        {status || '-'}
      </span>
    );
  };

  // Sort data based on sortConfig
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      let aVal, bVal;
      
      // Handle calculated columns
      if (sortConfig.key === 'cpm') {
        aVal = (a.cost || 0) / (a.total_message || 1);
        bVal = (b.cost || 0) / (b.total_message || 1);
      } else if (sortConfig.key === 'cost_per_message') {
        aVal = (a.cost || 0) / (a.message || 1);
        bVal = (b.cost || 0) / (b.message || 1);
      } else if (sortConfig.key === 'cost_per_deposit') {
        // Special handling for cost per deposit
        const aDeposit = a.deposit || 0;
        const bDeposit = b.deposit || 0;
        
        // If no deposit, put at bottom regardless of sort direction
        if (aDeposit === 0 && bDeposit === 0) return 0;
        if (aDeposit === 0) return 1; // a goes to bottom
        if (bDeposit === 0) return -1; // b goes to bottom
        
        // Both have deposits, calculate normally
        aVal = (a.cost || 0) / aDeposit;
        bVal = (b.cost || 0) / bDeposit;
      } else {
        // Regular columns
        aVal = a[sortConfig.key];
        bVal = b[sortConfig.key];
      }
      
      // Handle null/undefined values
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      // Convert to string for comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      // Try to parse as numbers for numeric comparison
      const aNum = parseFloat(aStr);
      const bNum = parseFloat(bStr);
      
      let result = 0;
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        // Numeric comparison
        result = aNum - bNum;
      } else {
        // String comparison
        result = aStr.localeCompare(bStr);
      }
      
      return sortConfig.direction === 'asc' ? result : -result;
    });
  }, [data, sortConfig]);

  // Handle double click to expand cell content
  const handleCellDoubleClick = (rowIndex: number, column: string, content: string) => {
    setExpandedCell({ rowIndex, column });
    setEditingValue(content);
  };

  // Handle cell collapse
  const handleCellCollapse = () => {
    setExpandedCell(null);
    setEditingValue('');
  };

  // Handle key press in expanded cell
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCellCollapse();
    } else if (e.key === 'Escape') {
      handleCellCollapse();
    }
  };

  // Handle click outside to close expanded cell
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expandedCell && !(event.target as Element).closest('.expanded-cell')) {
        setExpandedCell(null);
        setEditingValue('');
      }
    };

    if (expandedCell) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [expandedCell]);

  // Expandable cell component (memoized for performance)
  const ExpandableCell = React.memo(({ 
    content, 
    rowIndex, 
    column, 
    className,
    title,
    style 
  }: { 
    content: string; 
    rowIndex: number; 
    column: string; 
    className: string;
    title?: string;
    style?: React.CSSProperties;
  }) => {
    const isExpanded = expandedCell?.rowIndex === rowIndex && expandedCell?.column === column;
    
    if (isExpanded) {
      return (
        <TableCell className={`${className} p-0 relative overflow-visible`}>
          <div className="expanded-cell absolute z-50 bg-white/95 backdrop-blur-sm border-2 border-blue-300/50 shadow-xl rounded-lg"
               style={{
                 minWidth: '250px',
                 minHeight: '80px',
                 maxWidth: '500px',
                 maxHeight: '300px',
                 top: '-4px',
                 left: '-4px'
               }}>
            <div className="flex items-center justify-between p-1 bg-blue-50/80 backdrop-blur-sm rounded-t-lg">
              <span className="text-xs text-blue-600 font-medium">
                {column} - Double-click to edit
              </span>
              <button
                onClick={handleCellCollapse}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <textarea
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full bg-transparent border-none outline-none text-sm text-slate-800 p-3 placeholder-slate-400"
              style={{ 
                fontFamily: 'inherit',
                wordBreak: 'break-all',
                overflowWrap: 'break-word',
                height: 'calc(100% - 28px)',
                resize: 'both',
                minWidth: '242px',
                minHeight: '72px',
                maxWidth: '492px',
                maxHeight: '272px'
              }}
              autoFocus
            />
          </div>
        </TableCell>
      );
    }
    
    return (
      <TableCell 
        className={`${className} cursor-pointer hover:bg-blue-50/50 transition-colors text-slate-800`}
        title={title || content}
        onDoubleClick={() => handleCellDoubleClick(rowIndex, column, content)}
      >
        <div 
          className="truncate overflow-hidden text-ellipsis whitespace-nowrap max-w-full text-slate-800" 
          style={style}
        >
          {content}
        </div>
      </TableCell>
    );
  });

  // Set display name for the memoized component
  ExpandableCell.displayName = 'ExpandableCell';

  // Fetch filter options separately
  const fetchFilterOptions = useCallback(async () => {
    try {
      console.log('📡 Fetching filter options from /api/filters...');
      const response = await fetch('/api/filters', {
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Filter options received:', result);
        console.log('📊 Teams from API:', result.teams);
        let availableAdsers = result.adsers || [];
        
        // Filter adsers based on user permissions
        if (currentUser?.adserView && Array.isArray(currentUser.adserView) && currentUser.adserView.length > 0) {
          console.log('User adserView permissions:', currentUser.adserView);
          console.log('Available adsers before filtering:', availableAdsers);
          availableAdsers = availableAdsers.filter((adser: string) => 
            currentUser.adserView?.includes(adser)
          );
          console.log('Available adsers after filtering:', availableAdsers);
        } else {
          console.log('No adserView permissions found for user:', currentUser);
        }
        
        setAdsers(availableAdsers);
        setStatuses(result.statuses || []);
        setTeams(result.teams || []);
        console.log('💾 Setting teams state to:', result.teams || []);
        setTeamAdvertiserMapping(result.teamAdvertiserMapping || {}); // เก็บ mapping จาก API
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  }, [currentUser]);

  // Clear localStorage once on mount to avoid stale data
  useEffect(() => {
    localStorage.removeItem('bigquery-dashboard-filters');
    localStorage.removeItem('bigquery-dashboard-aggregated-filters');
    // Also clear preferences to avoid timezone issues
    localStorage.removeItem('userPreferences');
  }, []);

  // Add debouncing hook for data fetching
  // Initialize with empty values first, will be synced after filters load from localStorage  
  const [debouncedFilters, setDebouncedFilters] = useState({
    dateRange: undefined as DateRange | undefined,
    selectedAdser: 'all' as string,
    selectedStatus: 'all' as string,
    selectedTeam: '' as string,
    searchText: '' as string
  });

  // Debounce filter changes to reduce API calls
  useEffect(() => {
    console.log('⏱️ Filter changed, starting debounce:', { 
      dateRange: dateRange ? { from: dateRange.from?.toISOString(), to: dateRange.to?.toISOString() } : null,
      selectedAdser, 
      selectedStatus, 
      selectedTeam, 
      searchText 
    });
    
    const timeoutId = setTimeout(() => {
      console.log('✅ Debounce completed, updating debouncedFilters');
      setDebouncedFilters({
        dateRange,
        selectedAdser,
        selectedStatus,
        selectedTeam,
        searchText
      });
    }, 300); // 300ms debounce

    return () => {
      console.log('⏰ Debounce cancelled');
      clearTimeout(timeoutId);
    };
  }, [dateRange?.from?.toISOString(), dateRange?.to?.toISOString(), selectedAdser, selectedStatus, selectedTeam, searchText]);

  // Optimized fetch data function using debounced filters
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      // Helper function to format date without timezone issues
      const formatDateForAPI = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      if (debouncedFilters.dateRange?.from) {
        params.append('dateFrom', formatDateForAPI(debouncedFilters.dateRange.from));
      }
      if (debouncedFilters.dateRange?.to) {
        params.append('dateTo', formatDateForAPI(debouncedFilters.dateRange.to));
      }
      if (debouncedFilters.selectedAdser && debouncedFilters.selectedAdser !== 'all') {
        params.append('adser', debouncedFilters.selectedAdser);
      }
      if (debouncedFilters.selectedStatus && debouncedFilters.selectedStatus !== 'all') {
        params.append('status', debouncedFilters.selectedStatus);
      }
      if (debouncedFilters.selectedTeam && debouncedFilters.selectedTeam !== 'all') {
        params.append('team', debouncedFilters.selectedTeam);
      }
      if (debouncedFilters.searchText && debouncedFilters.searchText.trim() !== '') {
        params.append('searchText', debouncedFilters.searchText.trim());
      }

      const response = await fetch(`/api/data?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      
      setData(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage, 
    itemsPerPage, 
    debouncedFilters.dateRange?.from?.toISOString(), 
    debouncedFilters.dateRange?.to?.toISOString(),
    debouncedFilters.selectedAdser, 
    debouncedFilters.selectedStatus, 
    debouncedFilters.selectedTeam, 
    debouncedFilters.searchText
  ]);

  // Initial data load - triggers when debounced filters change and component is initialized
  useEffect(() => {
    if (isInitialized) {
      console.log('🔄 DataTable fetchData useEffect triggered with debounced filters:', debouncedFilters);
      console.log('🔄 Current page:', currentPage, 'Items per page:', itemsPerPage);
      fetchData();
    } else {
      console.log('⏳ Waiting for component initialization before fetching data');
    }
  }, [fetchData, isInitialized]);

  // Load filter options on component mount
  useEffect(() => {
    fetchFilterOptions();
  }, [currentUser]);

  // Reset selected Adser if it's not in user's allowed list
  useEffect(() => {
    if (adsers.length > 0 && selectedAdser !== 'all' && !adsers.includes(selectedAdser)) {
      setSelectedAdser('all');
    }
  }, [adsers, selectedAdser]);

  // DISABLED: Reset to page 1 when filters change - but not during initial load  
  // This was causing pagination to reset to page 1 every time
  /*
  useEffect(() => {
    // Only reset if component is initialized and this is not the first load
    if (isInitialized) {
      console.log('🔄 Filter changed, resetting to page 1');
      setCurrentPage(1);
    }
  }, [dateRange?.from?.toISOString(), dateRange?.to?.toISOString(), selectedAdser, selectedStatus, selectedTeam, searchText, isInitialized]);
  */

  // Save filters to localStorage when they change (but only after initialization)
  useEffect(() => {
    console.log('🔄 Filter change detected, isInitialized:', isInitialized);
    console.log('📋 Current filter values:', { 
      dateRange: dateRange ? { from: dateRange.from?.toISOString(), to: dateRange.to?.toISOString() } : null,
      selectedAdser, 
      selectedStatus, 
      selectedTeam, 
      searchText, 
      pageDisplayMode, 
      itemsPerPage 
    });
    
    if (!isInitialized) {
      console.log('❌ Not saving filters - component not initialized yet');
      return; // Don't save during initial load
    }
    
    const filtersToSave = {
      dateRange: dateRange ? {
        from: dateRange.from?.toISOString(),
        to: dateRange.to?.toISOString()
      } : null,
      selectedAdser,
      selectedStatus,
      selectedTeam,
      searchText,
      pageDisplayMode,
      itemsPerPage
    };
    
    console.log('💾 Saving filters to localStorage:', filtersToSave);
    saveFilters(filtersToSave);
  }, [dateRange?.from?.toISOString(), dateRange?.to?.toISOString(), selectedAdser, selectedStatus, selectedTeam, searchText, pageDisplayMode, itemsPerPage, isInitialized]);

  // Save column visibility to localStorage when it changes
  useEffect(() => {
    console.log('👁️ Column visibility change detected, isInitialized:', isInitialized);
    console.log('📋 Current visibleColumns:', visibleColumns);
    
    if (!isInitialized) {
      console.log('❌ Not saving column visibility - component not initialized yet');
      return;
    }
    
    console.log('💾 Saving column visibility to localStorage');
    saveColumnVisibility(visibleColumns);
  }, [visibleColumns, isInitialized, saveColumnVisibility]);

  // Auto-save color configuration to localStorage when it changes
  useEffect(() => {
    console.log('🎨 Color configuration change detected, isInitialized:', isInitialized);
    console.log('📋 Current colorConfig keys:', Object.keys(colorConfig));
    
    if (!isInitialized) {
      console.log('❌ Not saving color config - component not initialized yet');
      return;
    }
    
    if (Object.keys(colorConfig).length === 0) {
      console.log('❌ Not saving color config - empty configuration');
      return;
    }

    console.log('💾 Saving color configuration to localStorage');
    try {
      localStorage.setItem('bigquery-color-config', JSON.stringify(colorConfig));
      console.log('✅ Color configuration saved to localStorage:', colorConfig);
      
      // Also update preferences system if available
      if (updateColorConfiguration) {
        updateColorConfiguration(colorConfig);
      }
    } catch (error) {
      console.error('❌ Error saving color configuration:', error);
    }
  }, [colorConfig, isInitialized, updateColorConfiguration]);

  // Check if aggregated mode (date range selected)
  const isAggregatedMode = dateRange?.from && dateRange?.to;

  // Clear filters function
  const clearFilters = () => {
    const defaultRange = getCurrentMonthRange;
    setDateRange(defaultRange);
    setSelectedAdser('all');
    setSelectedStatus('all');
    setSelectedTeam('');
    setSearchText('');
    setPageDisplayMode('pageid');
    setCurrentPage(1);
    
    // Reset column visibility to default
    setVisibleColumns(getDefaultVisibleColumns());
    
    // Reset column widths to default
    const defaultWidths = getDefaultColumnWidths();
    setColumnWidths(defaultWidths);
    
    // Reset color configuration to default
    const defaultColors = getDefaultColorConfig();
    setColorConfig(defaultColors);
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bigquery-dashboard-filters');
      localStorage.removeItem('bigquery-dashboard-columns');
      localStorage.removeItem('bigquery-dashboard-column-widths');
      localStorage.removeItem('bigquery-dashboard-color-config');
    }
  };

  // Format functions
  const formatStringField = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    return String(value);
  };

  const formatNumericField = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value);
    return isNaN(num) ? '-' : num.toLocaleString();
  };

  const formatZeroDefaultField = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '0';
    const num = Number(value);
    return isNaN(num) ? '0' : num.toLocaleString();
  };

  // Format percentage with actual number in parentheses
  const formatPercentageField = (value: unknown, total: unknown): React.ReactElement => {
    const num = Number(value) || 0;
    const totalNum = Number(total) || 0;
    
    if (totalNum === 0) return (
      <span>
        0% <span className="text-xs opacity-75">(0)</span>
      </span>
    );
    
    const percentage = ((num / totalNum) * 100).toFixed(1);
    return (
      <span>
        {percentage}% <span className="text-xs opacity-75">({num.toLocaleString()})</span>
      </span>
    );
  };

  // Pagination controls
  const totalItems = total;
  const startIndex = (currentPage - 1) * itemsPerPage;

  // Memoize teamAdvertiserMapping to prevent unnecessary re-renders
  const memoizedTeamAdvertiserMapping = useMemo(() => teamAdvertiserMapping, [teamAdvertiserMapping]);

  if (error) {
    return (
      <div className="flex h-full bg-slate-50/30 dark:bg-slate-700/30">
        {/* Filter Sidebar - Collapsible */}
        <div className={`h-full flex-shrink-0 bg-slate-100/30 dark:bg-slate-800/30 border-r border-slate-300/20 dark:border-slate-700/20 overflow-hidden backdrop-blur-sm transition-all duration-300 ${
          isFilterVisible ? 'w-80' : 'w-0'
        }`}>
          {isFilterVisible && (
            <FilterSidebar
              dateRange={dateRange}
              setDateRange={setDateRange}
              selectedAdvertiser={selectedAdser}
              setSelectedAdvertiser={setSelectedAdser}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              selectedTeam={selectedTeam}
              setSelectedTeam={setSelectedTeam}
              searchText={searchText}
              setSearchText={setSearchText}
              pageDisplayMode={pageDisplayMode}
              setPageDisplayMode={setPageDisplayMode}
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
              colorConfig={colorConfig}
              setColorConfig={setColorConfig}
              advertisers={adsers}
              statuses={statuses}
              teams={teams}
              teamAdvertiserMapping={memoizedTeamAdvertiserMapping} // ส่ง mapping
              onRefresh={fetchData}
              isLoading={loading}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
              setCurrentPage={setCurrentPage}
              user={currentUser || undefined} // เพิ่ม user prop
              sortConfig={sortConfig}
            />
          )}
        </div>

        {/* Main Content with Error */}
        <div className="flex-1 bg-white/20 dark:bg-slate-600/20 backdrop-blur-sm overflow-hidden flex flex-col max-h-screen">
          {/* Filter Toggle Button */}
          <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-slate-800/40 border-b border-slate-200/30 dark:border-slate-700/30">
            <button
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors border border-slate-300 dark:border-slate-600"
              title={isFilterVisible ? 'ซ่อนฟิลเตอร์' : 'แสดงฟิลเตอร์'}
            >
              <Filter className="h-4 w-4" />
              {isFilterVisible ? (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">ซ่อนฟิลเตอร์</span>
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-sm font-medium">แสดงฟิลเตอร์</span>
                </>
              )}
            </button>
          </div>

          {/* Error Content */}
          <div className="flex-1 p-6">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg shadow-sm">
              <strong>Error:</strong> {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full relative gap-2 overflow-hidden">
      {/* Section 1: Filter Sidebar - ซ้าย */}
      <div className={`h-full flex-shrink-0 transition-all duration-200 relative ${
        isFilterVisible ? 'w-80' : 'w-0'
      }`} style={{ overflow: 'visible' }}>
        {/* Toggle Filter Button - อยู่ขอบขวาของการ์ดฟิลเตอร์ */}
        <button
          onClick={() => setIsFilterVisible(!isFilterVisible)}
          className="absolute right-0 top-[52px] translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-lg border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center transition-all duration-200"
          style={{ zIndex: 9999 }}
          title={isFilterVisible ? 'ซ่อนฟิลเตอร์' : 'แสดงฟิลเตอร์'}
        >
          {isFilterVisible ? (
            <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          )}
        </button>

        <div className="w-80 h-full">
          <FilterSidebar
            dateRange={dateRange}
            setDateRange={setDateRange}
            selectedAdvertiser={selectedAdser}
            setSelectedAdvertiser={setSelectedAdser}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            selectedTeam={selectedTeam}
            setSelectedTeam={setSelectedTeam}
            searchText={searchText}
            setSearchText={setSearchText}
            pageDisplayMode={pageDisplayMode}
            setPageDisplayMode={setPageDisplayMode}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            colorConfig={colorConfig}
            setColorConfig={setColorConfig}
            advertisers={adsers}
            statuses={statuses}
            teams={teams}
            teamAdvertiserMapping={memoizedTeamAdvertiserMapping}
            onRefresh={fetchData}
            isLoading={loading}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setCurrentPage}
            user={currentUser || undefined}
            sortConfig={sortConfig}
          />
        </div>
      </div>

      {/* Section 2: Main Data Table - กลาง */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Card สำหรับตาราง */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardContent className="h-full p-4 flex flex-col overflow-hidden">
          {/* Loading spinner */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
              <p className="mt-4 text-lg text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          )}

          {/* Main Container - Scrollable table area */}
          {!loading && (
            <>
            <div 
              ref={mainTableScrollRef}
              onScroll={handleMainTableScroll}
              className="flex-1 overflow-auto min-h-0 mb-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
          >
              {/* Main Table */}
              <div className="data-table rounded-lg border border-slate-200 dark:border-slate-700" style={{ minWidth: 'max-content' }}>
                  <Table 
                    key={`table-${Object.values(visibleColumns).join('')}`}
                    className="data-table relative" 
                    style={{ tableLayout: 'auto' }}
                  >
                    <TableCaption>
                      {isAggregatedMode 
                        ? `ข้อมูลรวมตาม Ad ID - หน้า ${currentPage} จาก ${totalPages} (${totalItems.toLocaleString()} Ad ID ทั้งหมด)`
                        : `ข้อมูลแคมเปญการตลาด - หน้า ${currentPage} จาก ${totalPages} (${totalItems.toLocaleString()} รายการทั้งหมด)`
                      }
                    </TableCaption>
              <TableHeader>
                <TableRow>
                  {visibleColumns.no && (
                    <ResizableHeader 
                      sortKey="no" 
                      className="text-center border-r font-medium" 
                      width={columnWidths.no}
                      onWidthChange={(width) => handleColumnWidthChange("no", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      No.
                    </ResizableHeader>
                  )}
                  {visibleColumns.adser && (
                    <ResizableHeader 
                      sortKey="adser" 
                      className="text-center" 
                      width={columnWidths.adser || 75}
                      onWidthChange={(width) => handleColumnWidthChange("adser", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      Adser
                    </ResizableHeader>
                  )}
                  {visibleColumns.adId && (
                    <ResizableHeader 
                      sortKey="adid" 
                      className="text-center" 
                      width={columnWidths.adId}
                      onWidthChange={(width) => handleColumnWidthChange("adid", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      ID โฆษณา
                    </ResizableHeader>
                  )}
                  {pageDisplayMode === 'pageid' && visibleColumns.pageId && (
                    <ResizableHeader 
                      sortKey="pageid" 
                      className="text-center"
                      width={columnWidths["pageid"] || 120}
                      onWidthChange={(width) => handleColumnWidthChange("pageid", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      ID เพจ
                    </ResizableHeader>
                  )}
                  {pageDisplayMode === 'page' && visibleColumns.page && (
                    <ResizableHeader 
                      sortKey="page" 
                      className="text-center"
                      width={columnWidths["page"] || 100}
                      onWidthChange={(width) => handleColumnWidthChange("page", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      @ เพจ
                    </ResizableHeader>
                  )}
                  {visibleColumns.content && (
                    <ResizableHeader 
                      sortKey="content" 
                      className="text-center"
                      width={columnWidths["content"] || 80}
                      onWidthChange={(width) => handleColumnWidthChange("content", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      คอนเทนต์
                    </ResizableHeader>
                  )}
                  {visibleColumns.cookie && (
                    <ResizableHeader 
                      sortKey="cookie" 
                      className="text-center"
                      width={columnWidths["cookie"] || 100}
                      onWidthChange={(width) => handleColumnWidthChange("cookie", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      บัญชีเฟสบุค
                    </ResizableHeader>
                  )}
                  {visibleColumns.target && (
                    <ResizableHeader 
                      sortKey="target" 
                      className="text-center"
                      width={columnWidths["target"] || 80}
                      onWidthChange={(width) => handleColumnWidthChange("target", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      กลุ่มเป้าหมาย
                    </ResizableHeader>
                  )}
                  {visibleColumns.notTarget && (
                    <ResizableHeader 
                      sortKey="not_target" 
                      className="text-center"
                      width={columnWidths["not_target"] || 150}
                      onWidthChange={(width) => handleColumnWidthChange("not_target", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      ไม่รวมกลุ่มเป้าหมาย
                    </ResizableHeader>
                  )}
                  {visibleColumns.budget && (
                    <ResizableHeader 
                      sortKey="budget" 
                      className="text-center"
                      width={columnWidths["budget"] || 75}
                      onWidthChange={(width) => handleColumnWidthChange("budget", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      งบรัน
                    </ResizableHeader>
                  )}
                  {visibleColumns.note && (
                    <ResizableHeader 
                      sortKey="note" 
                      className="text-center"
                      width={columnWidths["note"] || 150}
                      onWidthChange={(width) => handleColumnWidthChange("note", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      Note
                    </ResizableHeader>
                  )}
                  {visibleColumns.status && (
                    <ResizableHeader 
                      sortKey="status" 
                      className="text-center"
                      width={columnWidths["status"] || 100}
                      onWidthChange={(width) => handleColumnWidthChange("status", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      สถานะ
                    </ResizableHeader>
                  )}
                  {visibleColumns.captions && (
                    <ResizableHeader 
                      sortKey="captions" 
                      className="text-center"
                      width={columnWidths["captions"] || 150}
                      minWidth={100}
                      onWidthChange={(width) => handleColumnWidthChange("captions", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      แคปชั่น
                    </ResizableHeader>
                  )}
                  {visibleColumns.cardNum && (
                    <ResizableHeader 
                      sortKey="card_num" 
                      className="text-center"
                      width={columnWidths["card_num"] || 100}
                      onWidthChange={(width) => handleColumnWidthChange("card_num", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      บัตร 4 ตัวท้าย
                    </ResizableHeader>
                  )}
                  {visibleColumns.timezone && (
                    <ResizableHeader 
                      sortKey="timezone" 
                      className="text-center"
                      width={columnWidths["timezone"] || 100}
                      onWidthChange={(width) => handleColumnWidthChange("timezone", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      ไทม์โซน
                    </ResizableHeader>
                  )}
                  {visibleColumns.typeTime && (
                    <ResizableHeader 
                      sortKey="type_time" 
                      className="text-center"
                      width={columnWidths["type_time"] || 100}
                      onWidthChange={(width) => handleColumnWidthChange("type_time", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      ประเภทเวลา
                    </ResizableHeader>
                  )}
                  {visibleColumns.team && (
                    <ResizableHeader 
                      sortKey="team" 
                      className="text-center"
                      width={columnWidths["team"] || 100}
                      onWidthChange={(width) => handleColumnWidthChange("team", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      ทีม
                    </ResizableHeader>
                  )}
                  {visibleColumns.cpm && (
                    <ResizableHeader 
                      sortKey="cpm" 
                      className="text-center"
                      width={columnWidths["cpm"] || 75}
                      onWidthChange={(width) => handleColumnWidthChange("cpm", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      CPM
                    </ResizableHeader>
                  )}
                  {visibleColumns.totalMessage && (
                    <ResizableHeader 
                      sortKey="total_message" 
                      className="text-center"
                      width={columnWidths["total_message"] || 75}
                      onWidthChange={(width) => handleColumnWidthChange("total_message", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      ยอดทัก
                    </ResizableHeader>
                  )}
                  {visibleColumns.totalLoss && (
                    <ResizableHeader 
                      sortKey="calculated" 
                      className="text-center"
                      width={columnWidths["totalLoss"] || 100}
                      onWidthChange={(width) => handleColumnWidthChange("totalLoss", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      ยอดเสีย
                    </ResizableHeader>
                  )}
                  {visibleColumns.qualityContact && (
                    <ResizableHeader 
                      sortKey="calculated" 
                      className="text-center"
                      width={columnWidths["qualityContact"] || 75}
                      onWidthChange={(width) => handleColumnWidthChange("qualityContact", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      ทักคุณภาพ
                    </ResizableHeader>
                  )}
                  {visibleColumns.costPerMessage && (
                    <ResizableHeader 
                      sortKey="cost_per_message" 
                      className="text-center"
                      width={columnWidths["costPerMessage"] || 75}
                      onWidthChange={(width) => handleColumnWidthChange("costPerMessage", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      ต้นทุนทักจากเฟส
                    </ResizableHeader>
                  )}
                  {visibleColumns.metaMessage && (
                    <ResizableHeader 
                      sortKey="meta_message" 
                      className="text-center"
                      width={columnWidths["meta_message"] || 100}
                      onWidthChange={(width) => handleColumnWidthChange("meta_message", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      ยอดทัก Meta
                    </ResizableHeader>
                  )}
                  {visibleColumns.register && (
                    <ResizableHeader 
                      sortKey="register" 
                      className="text-center"
                      width={columnWidths["register"] || 75}
                      onWidthChange={(width) => handleColumnWidthChange("register", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      สมัคร
                    </ResizableHeader>
                  )}
                  {visibleColumns.deposit && (
                    <ResizableHeader 
                      sortKey="deposit" 
                      className="text-center"
                      width={columnWidths["deposit"] || 75}
                      onWidthChange={(width) => handleColumnWidthChange("deposit", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      เติม
                    </ResizableHeader>
                  )}
                  {visibleColumns.costPerDeposit && (
                    <ResizableHeader 
                      sortKey="cost_per_deposit" 
                      className="text-center"
                      width={columnWidths["costPerDeposit"] || 75}
                      onWidthChange={(width) => handleColumnWidthChange("costPerDeposit", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      ต้นทุนต่อเติม
                    </ResizableHeader>
                  )}
                  {visibleColumns.cost && (
                    <ResizableHeader 
                      sortKey="cost" 
                      className="text-center"
                      width={columnWidths["cost"] || 75}
                      onWidthChange={(width) => handleColumnWidthChange("cost", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      ใช้จ่าย
                    </ResizableHeader>
                  )}
                  {visibleColumns.turnover && (
                    <ResizableHeader 
                      sortKey="turnover" 
                      className="text-center"
                      width={columnWidths["turnover"] || 100}
                      onWidthChange={(width) => handleColumnWidthChange("turnover", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      ยอดเล่นใหม่
                    </ResizableHeader>
                  )}
                  {visibleColumns.totalUser && (
                    <ResizableHeader 
                      sortKey="total_user" 
                      className="text-center"
                      width={columnWidths["total_user"] || 100}
                      onWidthChange={(width) => handleColumnWidthChange("total_user", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      จำนวนยูส
                    </ResizableHeader>
                  )}
                  {visibleColumns.silent && (
                    <ResizableHeader 
                      sortKey="silent" 
                      className="text-center"
                      width={columnWidths["silent"] || 65}
                      onWidthChange={(width) => handleColumnWidthChange("silent", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      ทักเงียบ
                    </ResizableHeader>
                  )}
                  {visibleColumns.duplicate && (
                    <ResizableHeader 
                      sortKey="duplicate" 
                      className="text-center"
                      width={columnWidths["duplicate"] || 65}
                      onWidthChange={(width) => handleColumnWidthChange("duplicate", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      ทักซ้ำ
                    </ResizableHeader>
                  )}
                  {visibleColumns.hasAccount && (
                    <ResizableHeader 
                      sortKey="has_account" 
                      className="text-center"
                      width={columnWidths["has_account"] || 65}
                      onWidthChange={(width) => handleColumnWidthChange("has_account", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      มียูส
                    </ResizableHeader>
                  )}
                  {visibleColumns.spammer && (
                    <ResizableHeader 
                      sortKey="spammer" 
                      className="text-center"
                      width={columnWidths["spammer"] || 65}
                      onWidthChange={(width) => handleColumnWidthChange("spammer", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      ก่อกวน
                    </ResizableHeader>
                  )}
                  {visibleColumns.blocked && (
                    <ResizableHeader 
                      sortKey="blocked" 
                      className="text-center"
                      width={columnWidths["blocked"] || 65}
                      onWidthChange={(width) => handleColumnWidthChange("blocked", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      บล็อก
                    </ResizableHeader>
                  )}
                  {visibleColumns.under18 && (
                    <ResizableHeader 
                      sortKey="under_18" 
                      className="text-center"
                      width={columnWidths["under_18"] || 65}
                      onWidthChange={(width) => handleColumnWidthChange("under_18", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      เด็ก
                    </ResizableHeader>
                  )}
                  {visibleColumns.over50 && (
                    <ResizableHeader 
                      sortKey="over_50" 
                      className="text-center"
                      width={columnWidths["over_50"] || 65}
                      onWidthChange={(width) => handleColumnWidthChange("over_50", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      อายุเกิน50
                    </ResizableHeader>
                  )}
                  {visibleColumns.foreigner && (
                    <ResizableHeader 
                      sortKey="foreigner" 
                      className="text-center"
                      width={columnWidths["foreigner"] || 65}
                      onWidthChange={(width) => handleColumnWidthChange("foreigner", width)}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      ต่างชาติ
                    </ResizableHeader>
                  )}
                  
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((row, index) => (
                  <TableRow 
                    key={index} 
                    className={`${index % 2 === 0 ? "bg-white hover:bg-blue-50" : "bg-blue-50/50 hover:bg-blue-100/70"}`} 
                    style={{ height: '32px', maxHeight: '32px', minHeight: '32px' }}
                  >
                    {visibleColumns.no && (
                      <ExpandableCell
                        content={(startIndex + index + 1).toString()}
                        rowIndex={index}
                        column="No."
                        className="w-[60px] text-center border-r border-slate-200 px-1 py-0.5"
                      />
                    )}
                    {visibleColumns.adser && (
                      <ExpandableCell
                        content={formatStringField(row.adser)}
                        rowIndex={index}
                        column="Adser"
                        className="w-[75px] text-center border-r border-slate-200 px-1 py-0.5"
                        style={getColumnColor('adser', row.adser || '')}
                      />
                    )}
                    {visibleColumns.adId && (
                      <ExpandableCell
                        content={formatStringField(row.adid)}
                        rowIndex={index}
                        column="Ad ID"
                        className="w-[120px] text-center border-r border-slate-200 px-1 py-0.5"
                      />
                    )}
                    {pageDisplayMode === 'pageid' && visibleColumns.pageId && (
                      <ExpandableCell
                        content={formatStringField(row.pageid)}
                        rowIndex={index}
                        column="Page ID"
                        className="w-[120px] text-center border-r border-slate-200 px-1 py-0.5"
                      />
                    )}
                    {pageDisplayMode === 'page' && visibleColumns.page && (
                      <ExpandableCell
                        content={formatStringField(row.page)}
                        rowIndex={index}
                        column="Page"
                        className="w-[100px] text-center border-r border-slate-200 px-1 py-0.5"
                      />
                    )}
                    {visibleColumns.content && (
                      <ExpandableCell
                        content={formatStringField(row.content)}
                        rowIndex={index}
                        column="Content"
                        className="w-[80px] max-w-[150px] text-left border-r border-slate-200 px-1 py-0.5"
                      />
                    )}
                    {visibleColumns.cookie && (
                      <ExpandableCell
                        content={formatStringField(row.cookie)}
                        rowIndex={index}
                        column="Cookie"
                        className="w-[100px] text-left border-r border-slate-200 px-1 py-0.5"
                      />
                    )}
                    {visibleColumns.target && (
                      <ExpandableCell
                        content={formatStringField(row.target)}
                        rowIndex={index}
                        column="Target"
                        className="w-[80px] max-w-[150px] text-left border-r border-slate-200 px-1 py-0.5"
                      />
                    )}
                    {visibleColumns.notTarget && (
                      <ExpandableCell
                        content={formatStringField(row.not_target)}
                        rowIndex={index}
                        column="Not Target"
                        className="w-[150px] min-w-[150px] max-w-[150px] text-left border-r border-slate-200 px-1 py-0.5 truncate overflow-hidden whitespace-nowrap"
                      />
                    )}
                    {visibleColumns.budget && (
                      <ExpandableCell
                        content={formatNumericField(row.budget)}
                        rowIndex={index}
                        column="Budget"
                        className="w-[75px] text-center border-r border-slate-200 px-1 py-0.5"
                      />
                    )}
                    {visibleColumns.note && (
                      <ExpandableCell
                        content={formatStringField(row.note)}
                        rowIndex={index}
                        column="Note"
                        className="w-[150px] min-w-[150px] max-w-[150px] text-left border-r border-slate-200 px-1 py-0.5 truncate overflow-hidden whitespace-nowrap"
                      />
                    )}
                    {visibleColumns.status && (
                      <td className="w-[100px] text-center border-r border-slate-200 px-1 py-0.5">
                        {formatStatusWithColor(row.status || '')}
                      </td>
                    )}
                    {visibleColumns.captions && (
                      <ExpandableCell
                        content={formatStringField(row.captions)}
                        rowIndex={index}
                        column="Captions"
                        className="w-[150px] min-w-[150px] max-w-[150px] text-left border-r border-slate-200 px-1 py-0.5 truncate overflow-hidden whitespace-nowrap"
                      />
                    )}
                    {visibleColumns.cardNum && (
                      <ExpandableCell
                        content={formatStringField(row.card_num)}
                        rowIndex={index}
                        column="Card Num"
                        className="w-[100px] min-w-[100px] max-w-[100px] text-center truncate border-r border-slate-200 p-1"
                      />
                    )}
                    {visibleColumns.timezone && (
                      <ExpandableCell
                        content={formatStringField(row.timezone)}
                        rowIndex={index}
                        column="Timezone"
                        className="w-[100px] min-w-[100px] max-w-[100px] text-left truncate border-r border-slate-200 p-1"
                      />
                    )}
                    {visibleColumns.typeTime && (
                      <ExpandableCell
                        content={formatStringField(row.type_time)}
                        rowIndex={index}
                        column="Type Time"
                        className="w-[100px] min-w-[100px] max-w-[100px] text-left truncate border-r border-slate-200 p-1"
                      />
                    )}
                    {visibleColumns.team && (
                      <ExpandableCell
                        content={formatStringField(row.team)}
                        rowIndex={index}
                        column="Team"
                        className="w-[100px] min-w-[100px] max-w-[100px] text-center truncate border-r border-slate-200 p-1"
                      />
                    )}
                    {visibleColumns.cpm && (
                      <ExpandableCell
                        content={calculateCPM(row.cost || 0, row.total_message || 0)}
                        rowIndex={index}
                        column="CPM"
                        className="w-[75px] min-w-[75px] max-w-[75px] text-center truncate border-r border-slate-200 p-1"
                        style={getColumnColor('cpm', (row.cost || 0) / (row.total_message || 1))}
                      />
                    )}
                    {visibleColumns.totalMessage && (
                      <ExpandableCell
                        content={formatNumericField(row.total_message)}
                        rowIndex={index}
                        column="Total Message"
                        className="w-[75px] min-w-[75px] max-w-[75px] text-center truncate border-r border-slate-200 p-1"
                      />
                    )}
                    {visibleColumns.totalLoss && (
                      <td 
                        className="w-[100px] min-w-[100px] max-w-[100px] text-center truncate border-r border-slate-200 p-1"
                        style={{
                          width: `${columnWidths["totalLoss"] || 100}px`,
                          ...getColumnColor('totalLoss', 
                            (row.silent || 0) + (row.duplicate || 0) + (row.has_account || 0) + (row.spammer || 0) + (row.blocked || 0) + (row.under_18 || 0) + (row.over_50 || 0) + (row.foreigner || 0),
                            row.total_message || 0
                          )
                        }}
                      >
                        {formatPercentageField(
                          (row.silent || 0) + 
                          (row.duplicate || 0) + 
                          (row.has_account || 0) + 
                          (row.spammer || 0) + 
                          (row.blocked || 0) + 
                          (row.under_18 || 0) + 
                          (row.over_50 || 0) + 
                          (row.foreigner || 0),
                          row.total_message
                        )}
                      </td>
                    )}
                    {visibleColumns.qualityContact && (
                      <td 
                        className="w-[100px] min-w-[100px] max-w-[100px] text-center truncate border-r border-slate-200 p-1"
                        style={{
                          width: `${columnWidths["qualityContact"] || 100}px`,
                          ...getColumnColor('qualityContact', 
                            (row.total_message || 0) - (
                              (row.silent || 0) + (row.duplicate || 0) + (row.has_account || 0) + (row.spammer || 0) + (row.blocked || 0) + (row.under_18 || 0) + (row.over_50 || 0) + (row.foreigner || 0)
                            ),
                            row.total_message || 0
                          )
                        }}
                      >
                        {formatPercentageField(
                          (row.total_message || 0) - (
                            (row.silent || 0) + 
                            (row.duplicate || 0) + 
                            (row.has_account || 0) + 
                            (row.spammer || 0) + 
                            (row.blocked || 0) + 
                            (row.under_18 || 0) + 
                            (row.over_50 || 0) + 
                            (row.foreigner || 0)
                          ),
                          row.total_message
                        )}
                      </td>
                    )}
                    {visibleColumns.costPerMessage && (
                      <ExpandableCell
                        content={calculateCostPerMessage(row.cost || 0, row.meta_message || 0)}
                        rowIndex={index}
                        column="Cost Per Message"
                        className="w-[75px] min-w-[75px] max-w-[75px] text-center truncate border-r border-slate-200 p-1"
                        style={getColumnColor('costPerMessage', (row.cost || 0) / (row.meta_message || 1))}
                      />
                    )}
                    {visibleColumns.metaMessage && (
                      <ExpandableCell
                        content={formatZeroDefaultField(row.meta_message)}
                        rowIndex={index}
                        column="Meta Message"
                        className="w-[100px] min-w-[100px] max-w-[100px] text-center truncate border-r border-slate-200 p-1"
                      />
                    )}
                    {visibleColumns.register && (
                      <ExpandableCell
                        content={formatNumericField(row.register)}
                        rowIndex={index}
                        column="Register"
                        className="w-[75px] min-w-[75px] max-w-[75px] text-center truncate border-r border-slate-200 p-1"
                      />
                    )}
                    {visibleColumns.deposit && (
                      <ExpandableCell
                        content={formatNumericField(row.deposit)}
                        rowIndex={index}
                        column="Deposit"
                        className="w-[75px] min-w-[75px] max-w-[75px] text-center truncate border-r border-slate-200 p-1"
                      />
                    )}
                    {visibleColumns.costPerDeposit && (
                      <ExpandableCell
                        content={calculateCostPerDeposit(row.cost || 0, row.deposit || 0)}
                        rowIndex={index}
                        column="Cost Per Deposit"
                        className="w-[75px] min-w-[75px] max-w-[75px] text-center truncate border-r border-slate-200 p-1"
                        style={getCostPerDepositColor(row.cost || 0, row.deposit || 0)}
                      />
                    )}
                    {visibleColumns.cost && (
                      <ExpandableCell
                        content={formatZeroDefaultField(row.cost)}
                        rowIndex={index}
                        column="Cost"
                        className="w-[75px] min-w-[75px] max-w-[75px] text-right truncate border-r border-slate-200 p-1"
                      />
                    )}
                    {visibleColumns.turnover && (
                      <ExpandableCell
                        content={formatNumericField(row.turnover)}
                        rowIndex={index}
                        column="Turnover"
                        className="w-[100px] min-w-[100px] max-w-[100px] text-right truncate border-r border-slate-200 p-1"
                      />
                    )}
                    {visibleColumns.totalUser && (
                      <ExpandableCell
                        content={formatNumericField(row.total_user)}
                        rowIndex={index}
                        column="Total User"
                        className="w-[100px] min-w-[100px] max-w-[100px] text-center truncate border-r border-slate-200 p-1"
                      />
                    )}
                    {visibleColumns.silent && (
                      <td 
                        className="text-center truncate border-r border-slate-200 p-1"
                        style={{
                          width: `${columnWidths["silent"] || 65}px`,
                          ...getColumnColor('silent', row.silent || 0, row.total_message || 0)
                        }}
                      >
                        {formatPercentageField(row.silent, row.total_message)}
                      </td>
                    )}
                    {visibleColumns.duplicate && (
                      <td 
                        className="text-center truncate border-r border-slate-200 p-1"
                        style={{
                          width: `${columnWidths["duplicate"] || 65}px`,
                          ...getColumnColor('duplicate', row.duplicate || 0, row.total_message || 0)
                        }}
                      >
                        {formatPercentageField(row.duplicate, row.total_message)}
                      </td>
                    )}
                    {visibleColumns.hasAccount && (
                      <td 
                        className="text-center truncate border-r border-slate-200 p-1"
                        style={{
                          width: `${columnWidths["has_account"] || 65}px`,
                          ...getColumnColor('hasAccount', row.has_account || 0, row.total_message || 0)
                        }}
                      >
                        {formatPercentageField(row.has_account, row.total_message)}
                      </td>
                    )}
                    {visibleColumns.spammer && (
                      <td 
                        className="text-center truncate border-r border-slate-200 p-1"
                        style={{
                          width: `${columnWidths["spammer"] || 65}px`,
                          ...getColumnColor('spammer', row.spammer || 0, row.total_message || 0)
                        }}
                      >
                        {formatPercentageField(row.spammer, row.total_message)}
                      </td>
                    )}
                    {visibleColumns.blocked && (
                      <td 
                        className="text-center truncate border-r border-slate-200 p-1"
                        style={{
                          width: `${columnWidths["blocked"] || 65}px`,
                          ...getColumnColor('blocked', row.blocked || 0, row.total_message || 0)
                        }}
                      >
                        {formatPercentageField(row.blocked, row.total_message)}
                      </td>
                    )}
                    {visibleColumns.under18 && (
                      <td 
                        className="text-center truncate border-r border-slate-200 p-1"
                        style={{
                          width: `${columnWidths["under_18"] || 65}px`,
                          ...getColumnColor('under18', row.under_18 || 0, row.total_message || 0)
                        }}
                      >
                        {formatPercentageField(row.under_18, row.total_message)}
                      </td>
                    )}
                    {visibleColumns.over50 && (
                      <td 
                        className="text-center truncate border-r border-slate-200 p-1"
                        style={{
                          width: `${columnWidths["over_50"] || 65}px`,
                          ...getColumnColor('over50', row.over_50 || 0, row.total_message || 0)
                        }}
                      >
                        {formatPercentageField(row.over_50, row.total_message)}
                      </td>
                    )}
                    {visibleColumns.foreigner && (
                      <td 
                        className="text-center truncate border-r border-slate-200 p-1"
                        style={{
                          width: `${columnWidths["foreigner"] || 65}px`,
                          ...getColumnColor('foreigner', row.foreigner || 0, row.total_message || 0)
                        }}
                      >
                        {formatPercentageField(row.foreigner, row.total_message)}
                      </td>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
            </div>

            {/* Pagination - Fixed at bottom */}
            {totalPages > 1 && (
            <div className="flex-shrink-0 pt-4">
            <div className="flex justify-center items-center gap-4 bg-white/30 dark:bg-slate-600/30 backdrop-blur-sm rounded-lg p-4 border border-slate-200/40 dark:border-slate-400/20">
            <button 
              onClick={() => {
                console.log(`🔄 Pagination: Clicking previous, current page: ${currentPage}`);
                setCurrentPage(prev => Math.max(1, prev - 1));
              }}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm bg-slate-100/80 hover:bg-slate-200/80 disabled:bg-slate-50/60 disabled:text-slate-400 dark:bg-slate-500/60 dark:hover:bg-slate-400/60 dark:disabled:bg-slate-600/40 dark:disabled:text-slate-500 rounded-md transition-colors border border-slate-200/50 dark:border-slate-400/30"
            >
              ← ก่อนหน้า
            </button>
            
            <div className="flex items-center gap-2">
              {/* Show page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      console.log(`🔄 Pagination: Clicking page ${pageNum}, current page: ${currentPage}`);
                      setCurrentPage(pageNum);
                    }}
                    className={`px-3 py-1 text-sm rounded-md transition-colors border ${
                      currentPage === pageNum 
                        ? 'bg-emerald-500/90 text-white border-emerald-400/50 shadow-md dark:bg-emerald-600/90 dark:border-emerald-500/50' 
                        : 'bg-slate-100/80 hover:bg-slate-200/80 border-slate-200/50 dark:bg-slate-500/60 dark:hover:bg-slate-400/60 dark:border-slate-400/30'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button 
              onClick={() => {
                console.log(`🔄 Pagination: Clicking next, current page: ${currentPage}, total pages: ${totalPages}`);
                setCurrentPage(prev => Math.min(totalPages, prev + 1));
              }}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm bg-slate-100/80 hover:bg-slate-200/80 disabled:bg-slate-50/60 disabled:text-slate-400 dark:bg-slate-500/60 dark:hover:bg-slate-400/60 dark:disabled:bg-slate-600/40 dark:disabled:text-slate-500 rounded-md transition-colors border border-slate-200/50 dark:border-slate-400/30"
            >
              ถัดไป →
            </button>
          </div>
            </div>
            )}
            </>
          )}
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Daily Deposits - Sidebar ขวา แสดงเสมอ */}
      {false && (
      <div className={`h-full flex-shrink-0 border-l-2 border-slate-300 dark:border-slate-600 overflow-hidden transition-all duration-300 ml-2 ${
        isDailyDepositsSidebarOpen ? 'w-[900px]' : 'w-[420px]'
      }`}>
        <div className="w-full h-full flex flex-col">
          {/* Header with date selector and expand button */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-base font-semibold text-slate-700 dark:text-slate-200">เติมวันนี้</h4>
              <div className="flex items-center gap-2">
                {isLoadingDailyDeposits && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
                <button
                  onClick={() => setIsDailyDepositsSidebarOpen(!isDailyDepositsSidebarOpen)}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                  title={isDailyDepositsSidebarOpen ? 'แสดงเฉพาะวันนี้' : 'ขยายแสดงทั้งเดือน'}
                >
                  {isDailyDepositsSidebarOpen ? (
                    <>
                      <ChevronLeft className="h-3 w-3" />
                      <span>ย่อ</span>
                    </>
                  ) : (
                    <>
                      <span>ขยาย</span>
                      <ChevronRight className="h-3 w-3" />
                    </>
                  )}
                </button>
              </div>
            </div>
            {!isDailyDepositsSidebarOpen && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 dark:text-slate-400">วันที่:</label>
                <input
                  type="date"
                  value={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    setSelectedYear(date.getFullYear());
                    setSelectedMonth(date.getMonth() + 1);
                  }}
                  className="flex-1 px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded"
                  disabled={isLoadingDailyDeposits}
                />
              </div>
            )}
            {isDailyDepositsSidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600 dark:text-slate-400">เดือน:</label>
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded"
                    disabled={isLoadingDailyDeposits}
                  >
                    {['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'].map((month, index) => (
                      <option key={index + 1} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600 dark:text-slate-400">ปี:</label>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded"
                    disabled={isLoadingDailyDeposits}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Table content */}
          <div 
            ref={dailyDepositsScrollRef}
            onScroll={handleDailyDepositsScroll}
            className="flex-1 overflow-x-auto overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700" 
            style={{ 
              scrollbarWidth: 'thin', 
              scrollbarColor: '#64748b #e2e8f0'
            }}
          >
            {!isDailyDepositsSidebarOpen ? (
              // แสดง 3 คอลัมน์ (ย่อ): Ad ID | เติมวันนี้ | เติมวันนี้
              <table className="data-table w-full">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left border-b border-r border-slate-200 dark:border-slate-700 font-semibold" style={{ width: '35%' }}>
                      Ad ID
                    </th>
                    <th className="px-3 py-2 text-center border-b border-r border-slate-200 dark:border-slate-700 font-semibold" style={{ width: '32.5%' }}>
                      เติมวันนี้
                    </th>
                    <th className="px-3 py-2 text-center border-b border-slate-200 dark:border-slate-700 font-semibold" style={{ width: '32.5%' }}>
                      เติมวันนี้
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingDailyDeposits ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>กำลังโหลด...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedData.map((row, index) => {
                      const adid = row.adid?.toString() || '';
                      const dailyData = dailyDepositsData[adid] || {};
                      const dayKey = `day${new Date().getDate()}`;
                      const value = dailyData[dayKey] || 0;
                      
                      return (
                        <tr key={index} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50" style={{ height: '32px', maxHeight: '32px', minHeight: '32px' }}>
                          <td className="px-3 py-1 border-r border-slate-200 dark:border-slate-700 truncate" style={{ lineHeight: '32px' }}>
                            {formatStringField(row.adid)}
                          </td>
                          <td className="px-3 py-1 text-center font-medium border-r border-slate-200 dark:border-slate-700" style={{ lineHeight: '32px' }}>
                            {value > 0 ? value.toLocaleString() : '-'}
                          </td>
                          <td className="px-3 py-1 text-center font-medium" style={{ lineHeight: '32px' }}>
                            {value > 0 ? value.toLocaleString() : '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              // แสดงทั้งเดือน (ขยาย)
              <div className="min-w-max">
                <table className="data-table w-full text-xs">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                    <tr>
                      <th className="px-2 py-2 text-left border-b border-slate-200 dark:border-slate-700 sticky left-0 bg-slate-100 dark:bg-slate-800 z-20" style={{ minWidth: '80px' }}>
                        Ad ID
                      </th>
                      <th className="px-1 py-2 text-center border-b border-slate-200 dark:border-slate-700" style={{ minWidth: '60px' }}>
                        เปิด
                      </th>
                      <th className="px-1 py-2 text-center border-b border-slate-200 dark:border-slate-700" style={{ minWidth: '60px' }}>
                        ปิด
                      </th>
                      {Array.from({ length: daysInSelectedMonth }, (_, i) => (
                        <th key={i + 1} className="px-1 py-2 text-center border-b border-slate-200 dark:border-slate-700" style={{ minWidth: '28px' }}>
                          {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingDailyDeposits ? (
                      <tr>
                        <td colSpan={daysInSelectedMonth + 3} className="px-4 py-8 text-center text-slate-500">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span>กำลังโหลด...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sortedData.map((row, index) => {
                        const adid = row.adid?.toString() || '';
                        const dailyData = dailyDepositsData[adid] || {};
                        
                        return (
                          <tr key={index} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50" style={{ height: '32px', maxHeight: '32px', minHeight: '32px' }}>
                            <td className="px-2 py-0 text-left sticky left-0 bg-white dark:bg-slate-800 z-10" style={{ lineHeight: '32px' }}>
                              <span className="truncate block">{formatStringField(row.adid)}</span>
                            </td>
                            <td className="px-1 py-0 text-center" style={{ lineHeight: '32px' }}>
                              {row.start ? new Date(row.start).toLocaleDateString('th-TH', { 
                                day: '2-digit', 
                                month: '2-digit'
                              }) : '-'}
                            </td>
                            <td className="px-1 py-0 text-center" style={{ lineHeight: '32px' }}>
                              {row.off ? new Date(row.off).toLocaleDateString('th-TH', { 
                                day: '2-digit', 
                                month: '2-digit'
                              }) : '-'}
                            </td>
                            {Array.from({ length: daysInSelectedMonth }, (_, i) => {
                              const dayNumber = i + 1;
                              const dayKey = `day${dayNumber}`;
                              const value = dailyData[dayKey] || 0;
                              const dayStatus = getDayStatus(dayNumber, row.start || null, row.off || null);
                              const cellStyle = getDayCellStyle(dayStatus);
                              
                              return (
                                <td key={i + 1} className={`px-1 py-0 text-center ${cellStyle}`} style={{ lineHeight: '32px' }}>
                                  {value > 0 ? (
                                    <span className={getDayValueStyle(dayStatus, value)}>
                                      {value.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}