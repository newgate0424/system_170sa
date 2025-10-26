'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ColorRule {
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

export interface ColorConfig {
  [columnKey: string]: ColorRule[];
}

export interface UserPreferences {
  id: number;
  userId: number;
  sidebarSettings?: SidebarSettings;
  themeSettings?: ThemeSettings;
  filterSettings?: FilterSettings;
  columnVisibility?: ColumnVisibility;
  columnWidths?: ColumnWidths;
  colorConfiguration?: ColorConfig;
  tableSettings?: TableSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface SidebarSettings {
  isOpen: boolean;
  width?: number;
  collapsedMode?: boolean;
}

export interface ThemeSettings {
  primaryColor?: string;
  backgroundColor?: string;
  isDarkMode?: boolean;
  fontFamily?: string;
  fontSize?: number;
  customColors?: {
    [key: string]: string;
  };
}

export interface SortSettings {
  column: string;
  direction: 'asc' | 'desc';
  timestamp?: number;
}

export interface FilterSettings {
  dateRange?: {
    from?: string;
    to?: string;
  };
  searchText?: string;
  selectedTeam?: string;
  selectedAdser?: string;
  selectedAdvertiser?: string;
  pageDisplayMode?: string;
  selectedStatus?: string;
  statusFilter?: string;
  showInactiveContent?: boolean;
  sortSettings?: SortSettings;
}

export interface ColumnVisibility {
  [columnKey: string]: boolean;
}

export interface ColumnWidths {
  [columnKey: string]: number;
}

export interface TableSettings {
  rowHeight?: number;
  fontSize?: number;
  density?: 'comfortable' | 'compact' | 'standard';
}

// Cache manager
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class CacheManager {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new CacheManager();

export const CACHE_KEYS = {
  USER_PREFERENCES: (userId: number) => `user-preferences-${userId}`,
};

// Debouncer
class PreferencesDebouncer {
  private static instance: PreferencesDebouncer;
  private timers: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): PreferencesDebouncer {
    if (!PreferencesDebouncer.instance) {
      PreferencesDebouncer.instance = new PreferencesDebouncer();
    }
    return PreferencesDebouncer.instance;
  }

  debounceUpdate(key: string, data: any, callback: () => Promise<boolean>, delay = 1000): void {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    const timer = setTimeout(async () => {
      await callback();
      this.timers.delete(key);
    }, delay);

    this.timers.set(key, timer);
  }

  cancel(key: string): void {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }
  }
}

// API class
export class PreferencesAPI {
  private static getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private static getUserIdFromToken(): number | null {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      const user = JSON.parse(userStr);
      return user.id || null;
    } catch {
      return null;
    }
  }

  private static isAuthError(error: any): boolean {
    return error?.status === 401 || error?.status === 403;
  }

  private static async withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        if (this.isAuthError(error)) {
          throw error;
        }
        
        if (i === maxRetries) {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    
    throw lastError;
  }

  static async getPreferences(): Promise<UserPreferences | null> {
    const userId = this.getUserIdFromToken();
    if (!userId) return null;

    const cached = cache.get(CACHE_KEYS.USER_PREFERENCES(userId));
    if (cached) return cached;

    return this.withRetry(async () => {
      const response = await fetch('/api/preferences', {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return null;
        }
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      cache.set(CACHE_KEYS.USER_PREFERENCES(userId), data);
      
      return data;
    }).catch((error) => {
      console.error('Error fetching preferences:', error);
      return null;
    });
  }

  static async savePreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
    const token = localStorage.getItem('token');
    if (!token) return false;

    return this.withRetry(async () => {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      const userId = this.getUserIdFromToken();
      if (userId) {
        cache.invalidate(CACHE_KEYS.USER_PREFERENCES(userId));
      }

      return true;
    }).catch((error) => {
      console.error('Error saving preferences:', error);
      return false;
    });
  }

  static async updatePreferences(
    type: 'sidebar' | 'theme' | 'filter' | 'columns' | 'widths' | 'colors' | 'table',
    data: SidebarSettings | ThemeSettings | FilterSettings | ColumnVisibility | ColumnWidths | ColorConfig | TableSettings
  ): Promise<boolean> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log(`Skipping ${type} preferences update - user not authenticated`);
      return false;
    }

    return this.withRetry(async () => {
      const payload = { type, data };

      const response = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = `Failed to update ${type} preferences`;
        try {
          const errorData = await response.text();
          if (errorData) {
            errorMessage += `: ${errorData}`;
          }
        } catch (e) {
          // Ignore
        }
        const apiError = new Error(errorMessage);
        (apiError as Error & { status: number }).status = response.status;
        throw apiError;
      }

      const userId = this.getUserIdFromToken();
      if (userId) {
        cache.invalidate(CACHE_KEYS.USER_PREFERENCES(userId));
      }

      return true;
    }).catch((error) => {
      console.error(`Error updating ${type} preferences:`, error);
      return false;
    });
  }

  static async saveSidebarSettings(sidebarSettings: SidebarSettings): Promise<boolean> {
    return this.updatePreferences('sidebar', sidebarSettings);
  }

  static async saveThemeSettings(themeSettings: ThemeSettings): Promise<boolean> {
    return this.updatePreferences('theme', themeSettings);
  }

  static async saveFilterSettings(filterSettings: FilterSettings): Promise<boolean> {
    return this.updatePreferences('filter', filterSettings);
  }

  static async saveColumnVisibility(columnVisibility: ColumnVisibility): Promise<boolean> {
    return this.updatePreferences('columns', columnVisibility);
  }

  static async saveColumnWidths(columnWidths: ColumnWidths): Promise<boolean> {
    return this.updatePreferences('widths', columnWidths);
  }

  static async saveColorConfiguration(colorConfiguration: ColorConfig): Promise<boolean> {
    return this.updatePreferences('colors', colorConfiguration);
  }

  static async saveTableSettings(tableSettings: TableSettings): Promise<boolean> {
    return this.updatePreferences('table', tableSettings);
  }
}

// Hook
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debouncer = PreferencesDebouncer.getInstance();

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping preferences load');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Loading user preferences from database...');
      const userPrefs = await PreferencesAPI.getPreferences();
      console.log('✅ User preferences loaded successfully:', userPrefs);

      setPreferences(userPrefs);
    } catch (err: any) {
      console.error('Error loading preferences:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updateSidebarSettings = useCallback(async (sidebarSettings: SidebarSettings) => {
    localStorage.setItem('sidebarSettings', JSON.stringify(sidebarSettings));
    
    return new Promise<boolean>((resolve) => {
      debouncer.debounceUpdate('sidebar', sidebarSettings, async () => {
        const success = await PreferencesAPI.saveSidebarSettings(sidebarSettings);
        resolve(success);
        return success;
      });
    });
  }, [debouncer]);

  const updateThemeSettings = useCallback(async (themeSettings: ThemeSettings) => {
    localStorage.setItem('themeSettings', JSON.stringify(themeSettings));
    
    return new Promise<boolean>((resolve) => {
      debouncer.debounceUpdate('theme', themeSettings, async () => {
        const success = await PreferencesAPI.saveThemeSettings(themeSettings);
        resolve(success);
        return success;
      });
    });
  }, [debouncer]);

  const updateFilterSettings = useCallback(async (filterSettings: FilterSettings) => {
    localStorage.setItem('filterSettings', JSON.stringify(filterSettings));
    
    debouncer.debounceUpdate('filter', filterSettings, async () => {
      const success = await PreferencesAPI.saveFilterSettings(filterSettings);
      if (!success) {
        console.warn('Failed to sync filter settings to server');
      }
      return success;
    });
    
    return true;
  }, [debouncer]);

  const updateColumnVisibility = useCallback(async (columnVisibility: ColumnVisibility) => {
    localStorage.setItem('columnVisibility', JSON.stringify(columnVisibility));
    
    debouncer.debounceUpdate('columns', columnVisibility, async () => {
      const success = await PreferencesAPI.saveColumnVisibility(columnVisibility);
      if (!success) {
        console.warn('Failed to sync column visibility to server');
      }
      return success;
    });
    
    return true;
  }, [debouncer]);

  const updateColumnWidths = useCallback(async (columnWidths: ColumnWidths) => {
    localStorage.setItem('columnWidths', JSON.stringify(columnWidths));
    
    debouncer.debounceUpdate('widths', columnWidths, async () => {
      const success = await PreferencesAPI.saveColumnWidths(columnWidths);
      if (!success) {
        console.warn('Failed to sync column widths to server');
      }
      return success;
    });
    
    return true;
  }, [debouncer]);

  const updateColorConfiguration = useCallback(async (colorConfiguration: ColorConfig) => {
    localStorage.setItem('colorConfiguration', JSON.stringify(colorConfiguration));
    
    const success = await PreferencesAPI.saveColorConfiguration(colorConfiguration);
    return success;
  }, []);

  const updateTableSettings = useCallback(async (tableSettings: TableSettings) => {
    localStorage.setItem('tableSettings', JSON.stringify(tableSettings));
    
    const success = await PreferencesAPI.saveTableSettings(tableSettings);
    return success;
  }, []);

  return {
    preferences,
    loading,
    error,
    updateSidebarSettings,
    updateThemeSettings,
    updateFilterSettings,
    updateColumnVisibility,
    updateColumnWidths,
    updateColorConfiguration,
    updateTableSettings,
  };
}
