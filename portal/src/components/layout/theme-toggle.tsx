'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { applyTheme } from './theme-provider'

type Theme = 'light' | 'dark' | 'system'

function getStored(): Theme {
  if (typeof window === 'undefined') return 'system'
  return (localStorage.getItem('theme') as Theme) ?? 'system'
}

export function ThemeToggleItem() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    setTheme(getStored())
  }, [])

  function setMode(next: Theme) {
    localStorage.setItem('theme', next)
    setTheme(next)
    applyTheme(next)
  }

  return (
    <div className="px-3 py-1.5">
      <div className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        Theme
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setMode('light')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-[6px] text-xs transition-colors ${
            theme === 'light'
              ? 'bg-accent text-accent-foreground border border-brand-border'
              : 'text-muted-foreground hover:bg-secondary'
          }`}
          title="Light"
        >
          <Sun size={12} />
        </button>
        <button
          type="button"
          onClick={() => setMode('dark')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-[6px] text-xs transition-colors ${
            theme === 'dark'
              ? 'bg-accent text-accent-foreground border border-brand-border'
              : 'text-muted-foreground hover:bg-secondary'
          }`}
          title="Dark"
        >
          <Moon size={12} />
        </button>
        <button
          type="button"
          onClick={() => setMode('system')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-[6px] text-xs transition-colors ${
            theme === 'system'
              ? 'bg-accent text-accent-foreground border border-brand-border'
              : 'text-muted-foreground hover:bg-secondary'
          }`}
          title="System"
        >
          <Monitor size={12} />
        </button>
      </div>
    </div>
  )
}
