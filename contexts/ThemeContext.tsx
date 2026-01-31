import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useColorScheme as useSystemColorScheme } from 'react-native'
import { storage } from '@/services/storage'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  effectiveTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const VALID_THEMES: Theme[] = ['light', 'dark', 'system']

function normalizeTheme(value: string | null): Theme | null {
  if (!value || typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (VALID_THEMES.includes(v as Theme)) return v as Theme
  return null
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme()
  const [theme, setThemeState] = useState<Theme>('system')
  const [hydrated, setHydrated] = useState(false)
  const userHasSetThemeRef = useRef(false)

  useEffect(() => {
    storage.getThemePreference().then(saved => {
      if (userHasSetThemeRef.current) {
        setHydrated(true)
        return
      }
      const normalized = normalizeTheme(saved)
      if (normalized) setThemeState(normalized)
      setHydrated(true)
    })
  }, [])

  const setTheme = useCallback((value: Theme) => {
    userHasSetThemeRef.current = true
    setThemeState(value)
    storage.setThemePreference(value).catch(console.error)
  }, [])

  const effectiveTheme = theme === 'system' ? (systemColorScheme ?? 'light') : theme

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}