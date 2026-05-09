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
  Sparkles,
  Tv,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuickRecreateModal } from '@/components/recreate/quick-recreate-modal'
import { NavLink } from './nav-link'

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

const NAV_BASE =
  'flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-sm transition-colors'
const NAV_ACTIVE = 'bg-secondary text-foreground font-medium'
const NAV_INACTIVE =
  'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'

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
        {NAV.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            className={NAV_BASE}
            activeClassName={NAV_ACTIVE}
            inactiveClassName={NAV_INACTIVE}
          >
            <item.icon size={15} strokeWidth={1.6} />
            <span className="flex-1">{item.label}</span>
            {item.badge != null && (
              <span className="text-2xs px-1.5 py-0.5 rounded-full bg-brand text-white font-medium">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 space-y-0.5">
        <NavLink
          href="/channels"
          className={cn(
            NAV_BASE,
            pathname.startsWith('/channels') ? NAV_ACTIVE : NAV_INACTIVE,
          )}
        >
          <Plus size={15} strokeWidth={1.6} />
          <span>Add channel</span>
        </NavLink>
      </div>
    </aside>
  )
}
