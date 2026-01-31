import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useColorScheme as useSystemColorScheme } from 'react-native'
import { storage } from '@/services/storage'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  effectiveTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme()
  const [theme, setThemeState] = useState<Theme>('system')

  useEffect(() => {
    storage.getThemePreference().then(saved => {
      if (saved) setThemeState(saved)
    })
  }, [])

  const setTheme = useCallback((value: Theme) => {
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