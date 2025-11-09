import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ConfigProvider, theme as antdTheme } from 'antd'

type ThemeMode = 'light' | 'dark'

type ThemeContextValue = {
  mode: ThemeMode
  toggle: () => void
  setMode: (m: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getInitialMode(): ThemeMode {
  const stored = localStorage.getItem('themeMode') as ThemeMode | null
  if (stored === 'light' || stored === 'dark') return stored
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode())

  useEffect(() => {
    localStorage.setItem('themeMode', mode)
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
    setMode,
  }), [mode])

  const algorithm = mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider
        theme={{
          algorithm,
          token: {
            // Marca
            colorPrimary: '#6366f1', // Indigo 500 para mais impacto
            colorInfo: '#6366f1',
            borderRadius: 12,
            fontFamily:
              "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
            // Paleta e superfícies
            colorBgLayout: mode === 'dark' ? '#0f141c' : '#f8fafc',
            colorBgContainer: mode === 'dark' ? '#141a22' : '#ffffff',
            colorBorder: mode === 'dark' ? '#1f2937' : '#e6eaf5',
            colorText: mode === 'dark' ? '#e5e7eb' : '#0f172a',
            colorTextSecondary: mode === 'dark' ? '#94a3b8' : '#475569',
            colorSuccess: mode === 'dark' ? '#22c55e' : '#16a34a',
            colorWarning: mode === 'dark' ? '#f59e0b' : '#d97706',
            colorError: mode === 'dark' ? '#ef4444' : '#dc2626',
            boxShadow: '0 12px 30px -12px rgba(2,6,23,0.20)',
          },
          components: {
            Card: {
              borderRadiusLG: 16,
              boxShadowTertiary: '0 24px 36px -20px rgba(2,6,23,0.25)',
            },
            Button: {
              controlHeight: 40,
              colorPrimaryHover: '#4f46e5',
              colorPrimaryActive: '#4338ca',
              borderRadiusLG: 12,
            },
            Input: {
              borderRadiusLG: 12,
              controlHeightLG: 44,
            },
            Tabs: {
              itemActiveColor: '#6366f1',
              inkBarColor: '#6366f1',
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider')
  return ctx
}