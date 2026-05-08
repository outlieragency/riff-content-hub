'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Flame,
  Home,
  Lightbulb,
  Mic,
  Pencil,
  Plus,
  Settings,
  Sparkles,
  Tv,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuickRecreateModal } from '@/components/recreate/quick-recreate-modal'

type NavItem = {
  href: string
  label: string
  icon: typeof Flame
  badge?: number
}

const NAV: NavItem[] = [
  { href: '/', label: 'Today', icon: Home },
  { href: '/outliers', label: 'Outliers', icon: Flame },
  { href: '/channels', label: 'Channels', icon: Tv },
  { href: '/ideas', label: 'Ideas', icon: Lightbulb },
  { href: '/recreated', label: 'Recreated', icon: Pencil },
  { href: '/voice', label: 'Voice', icon: Mic },
]

export function Sidebar() {
  const pathname = usePathname()
  const [quickOpen, setQuickOpen] = useState(false)

  return (
    <aside className="w-[220px] shrink-0 bg-card flex flex-col border-r border-border-soft">
      <QuickRecreateModal open={quickOpen} onClose={() => setQuickOpen(false)} />
      <div className="px-5 py-6">
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-serif-display text-xl text-foreground tracking-tight">
            Riff<span className="text-brand">.</span>
          </span>
          <span className="text-2xs text-muted-foreground mt-1 tracking-wider">
            by Outlier
          </span>
        </Link>
      </div>

      <div className="px-3 mb-2">
        <button
          onClick={() => setQuickOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-sm bg-brand hover:bg-brand-hover text-white font-medium transition-colors"
        >
          <Sparkles size={15} strokeWidth={1.6} />
          <span>Quick from URL</span>
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-sm transition-colors',
                active
                  ? 'bg-secondary text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
              )}
            >
              <item.icon size={15} strokeWidth={1.6} />
              <span className="flex-1">{item.label}</span>
              {item.badge != null && (
                <span className="text-2xs px-1.5 py-0.5 rounded-full bg-brand text-white font-medium">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-4 space-y-0.5">
        <Link
          href="/channels"
          className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
        >
          <Plus size={15} strokeWidth={1.6} />
          <span>Add channel</span>
        </Link>
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-sm transition-colors',
            pathname.startsWith('/settings')
              ? 'bg-secondary text-foreground font-medium'
              : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
          )}
        >
          <Settings size={15} strokeWidth={1.6} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  )
}
