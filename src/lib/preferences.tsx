'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FilterSettings {
  dateRange?: {
    from?: string;
    to?: string;
  };
}

interface UserPreferences {
  filterSettings?: FilterSettings;
}

interface UserPreferencesContextType {
  preferences: UserPreferences | null;
  updateFilterSettings: (settings: FilterSettings) => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse preferences:', e);
      }
    }
  }, []);

  const updateFilterSettings = (settings: FilterSettings) => {
    const newPreferences = {
      ...preferences,
      filterSettings: {
        ...preferences?.filterSettings,
        ...settings,
      },
    };
    setPreferences(newPreferences);
    localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
  };

  return (
    <UserPreferencesContext.Provider value={{ preferences, updateFilterSettings }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    return { preferences: null, updateFilterSettings: () => {} };
  }
  return context;
}
