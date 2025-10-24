"use client"

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { useTheme as useNextTheme } from 'next-themes'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeColors {
  primary: string
  background: string
}

interface FontSettings {
  family: string
  size: number
}

interface ThemeContextType {
  mode: ThemeMode
  colors: ThemeColors
  fonts: FontSettings
  effectiveTheme: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
  setColors: (colors: Partial<ThemeColors>) => void
  setFonts: (fonts: Partial<FontSettings>) => void
  resetToDefaults: () => void
  isLoading: boolean
}

const defaultColors: ThemeColors = {
  primary: '#2563eb',
  background: '#ffffff'
}

const defaultFonts: FontSettings = {
  family: 'Inter, system-ui, -apple-system, sans-serif',
  size: 14
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Simple provider with basic functionality
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme: nextTheme, setTheme: setNextTheme, resolvedTheme } = useNextTheme()
  const [mode, setModeState] = useState<ThemeMode>('light')
  const [colors, setColorsState] = useState<ThemeColors>(defaultColors)
  const [fonts, setFontsState] = useState<FontSettings>(defaultFonts)
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Mount only
  useEffect(() => {
    setMounted(true)
    
    // Load theme mode from localStorage
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode
    if (savedMode) {
      setModeState(savedMode)
      const isDark = savedMode === 'dark' || (savedMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      setEffectiveTheme(isDark ? 'dark' : 'light')
    }
    
    // Load colors from localStorage
    const savedColors = localStorage.getItem('theme-colors')
    const savedBackground = localStorage.getItem('theme-background')
    
    if (savedColors) {
      try {
        const parsed = JSON.parse(savedColors)
        setColorsState(parsed)
      } catch (e) {
        console.error('Failed to parse saved colors:', e)
      }
    } else if (savedBackground) {
      // If no colors but has background, use background
      setColorsState({
        ...defaultColors,
        background: savedBackground
      })
    }
    
    // Load fonts from localStorage
    const savedFonts = localStorage.getItem('theme-fonts')
    if (savedFonts) {
      try {
        const parsed = JSON.parse(savedFonts)
        setFontsState(parsed)
      } catch (e) {
        console.error('Failed to parse saved fonts:', e)
      }
    }
  }, [])

  // Sync with next-themes
  useEffect(() => {
    if (!mounted) return
    
    if (nextTheme) {
      setModeState(nextTheme as ThemeMode)
    }
    
    if (resolvedTheme) {
      setEffectiveTheme(resolvedTheme as 'light' | 'dark')
    }
  }, [nextTheme, resolvedTheme, mounted])

  // Listen for background changes from localStorage
  useEffect(() => {
    if (!mounted) return
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme-background' && e.newValue) {
        setColorsState(prev => ({
          ...prev,
          background: e.newValue || prev.background
        }))
      }
    }
    
    // Also check periodically in case storage event doesn't fire
    const interval = setInterval(() => {
      const savedBackground = localStorage.getItem('theme-background')
      if (savedBackground && savedBackground !== colors.background) {
        setColorsState(prev => ({
          ...prev,
          background: savedBackground
        }))
      }
    }, 1000)
    
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [mounted, colors.background])

  // Apply theme class when mode changes
  useEffect(() => {
    if (!mounted) return
    
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setEffectiveTheme(isDark ? 'dark' : 'light')
    
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(isDark ? 'dark' : 'light')
  }, [mode, mounted])

  const handleSetMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    setNextTheme(newMode)
    localStorage.setItem('theme-mode', newMode)
  }

  const handleSetColors = (newColors: Partial<ThemeColors>) => {
    const updated = { ...colors, ...newColors }
    setColorsState(updated)
    localStorage.setItem('theme-colors', JSON.stringify(updated))
  }

  const handleSetFonts = (newFonts: Partial<FontSettings>) => {
    const updated = { ...fonts, ...newFonts }
    setFontsState(updated)
    localStorage.setItem('theme-fonts', JSON.stringify(updated))
  }

  const resetToDefaults = () => {
    setModeState('light')
    setColorsState(defaultColors)
    setFontsState(defaultFonts)
    localStorage.removeItem('theme-mode')
    localStorage.removeItem('theme-colors')
    localStorage.removeItem('theme-fonts')
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{
      mode,
      colors,
      fonts,
      effectiveTheme,
      setMode: handleSetMode,
      setColors: handleSetColors,
      setFonts: handleSetFonts,
      resetToDefaults,
      isLoading: false
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
