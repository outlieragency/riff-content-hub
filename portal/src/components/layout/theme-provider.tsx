'use client'

import { useEffect } from 'react'

// Apply persisted theme from localStorage on first load
// Using a script in <head> would prevent flash, but inline this does it after hydration.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem('theme') // 'light' | 'dark' | 'system'
    const theme = stored ?? 'light'
    applyTheme(theme as 'light' | 'dark' | 'system')

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const onChange = () => applyTheme('system')
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    }
  }, [])

  return <>{children}</>
}

export function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement
  let effective: 'light' | 'dark'
  if (theme === 'system') {
    effective = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  } else {
    effective = theme
  }
  root.classList.toggle('dark', effective === 'dark')
  root.dataset.theme = effective
}
