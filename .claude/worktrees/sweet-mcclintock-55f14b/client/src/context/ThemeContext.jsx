import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function useTheme() {
  return useContext(ThemeContext)
}

// Default theme values (used as fallback)
const DEFAULT_THEME = {
  id: 'theme_default',
  name: 'Défaut',
  colors: {
    bg: '#0d0221',
    bgGradientFrom: '#1a0bdb',
    bgGradientTo: '#0d0221',
    primary: '#ff1ee8',
    secondary: '#39ff14',
    accent: '#ffe600',
    text: '#ffffff',
    textMuted: 'rgba(255,255,255,0.5)',
    cardBg: 'rgba(255,255,255,0.07)',
    cardBorder: 'rgba(255,255,255,0.12)',
    timerNormal: '#39ff14',
    timerWarning: '#ffe600',
    timerUrgent: '#ff2020',
  },
  backgroundImage: null,
}

function applyTheme(theme) {
  if (!theme) return
  const root = document.documentElement
  const c = { ...DEFAULT_THEME.colors, ...(theme.colors || {}) }

  root.style.setProperty('--theme-bg', c.bg || DEFAULT_THEME.colors.bg)
  root.style.setProperty('--theme-gradient-from', c.bgGradientFrom || c.bg || DEFAULT_THEME.colors.bgGradientFrom)
  root.style.setProperty('--theme-gradient-to', c.bgGradientTo || c.bg || DEFAULT_THEME.colors.bgGradientTo)
  root.style.setProperty('--theme-primary', c.primary || DEFAULT_THEME.colors.primary)
  root.style.setProperty('--theme-secondary', c.secondary || DEFAULT_THEME.colors.secondary)
  root.style.setProperty('--theme-accent', c.accent || DEFAULT_THEME.colors.accent)
  root.style.setProperty('--theme-text', c.text || DEFAULT_THEME.colors.text)
  root.style.setProperty('--theme-text-muted', c.textMuted || DEFAULT_THEME.colors.textMuted)
  root.style.setProperty('--theme-card-bg', c.cardBg || DEFAULT_THEME.colors.cardBg)
  root.style.setProperty('--theme-card-border', c.cardBorder || DEFAULT_THEME.colors.cardBorder)
  root.style.setProperty('--theme-timer-normal', c.timerNormal || DEFAULT_THEME.colors.timerNormal)
  root.style.setProperty('--theme-timer-warning', c.timerWarning || DEFAULT_THEME.colors.timerWarning)
  root.style.setProperty('--theme-timer-urgent', c.timerUrgent || DEFAULT_THEME.colors.timerUrgent)

  // Background image
  if (theme.backgroundImage) {
    root.style.setProperty('--theme-bg-image', `url('${theme.backgroundImage}')`)
  } else {
    root.style.setProperty('--theme-bg-image', 'none')
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULT_THEME)

  async function loadActiveTheme() {
    try {
      const res = await fetch('/api/theme/active')
      if (!res.ok) return
      const t = await res.json()
      if (t && t.id) {
        setTheme(t)
        applyTheme(t)
      }
    } catch {
      applyTheme(DEFAULT_THEME)
    }
  }

  useEffect(() => {
    applyTheme(DEFAULT_THEME) // apply defaults immediately
    loadActiveTheme()
  }, [])

  function refreshTheme() { loadActiveTheme() }

  return (
    <ThemeContext.Provider value={{ theme, refreshTheme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
