"use client"

import { createContext, useContext, useState, useEffect } from 'react'

type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function SimpleThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load theme from localStorage
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode
    if (savedMode === 'light' || savedMode === 'dark') {
      setMode(savedMode)
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(savedMode)
    }
  }, [])

  const handleSetMode = (newMode: ThemeMode) => {
    setMode(newMode)
    localStorage.setItem('theme-mode', newMode)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(newMode)
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode: handleSetMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useSimpleTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useSimpleTheme must be used within a SimpleThemeProvider')
  }
  return context
}
