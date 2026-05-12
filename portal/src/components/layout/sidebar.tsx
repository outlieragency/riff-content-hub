'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Compass,
  Home,
  Image as ImageIcon,
  LayoutTemplate,
  Lightbulb,
  Mic,
  Pencil,
  Settings as SettingsIcon,
  Sliders,
  Sparkles,
  Tv,
  UserPlus,
  Mail,
} from 'lucide-react'
import { QuickRecreateModal } from '@/components/recreate/quick-recreate-modal'
import { NavLink } from './nav-link'

type NavItem = {
  href: string
  label: string
  icon: typeof Home
}

const WORKFLOW: NavItem[] = [
  { href: '/today', label: 'Dashboard', icon: Home },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/ideas', label: 'Ideas', icon: Lightbulb },
  { href: '/recreated', label: 'Recreated', icon: Pencil },
]

const CONFIG: NavItem[] = [
  { href: '/channels', label: 'Channels', icon: Tv },
  { href: '/voice', label: 'Voice', icon: Mic },
  { href: '/carousel-templates', label: 'FB Templates', icon: LayoutTemplate },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
]

const NAV_BASE =
  'flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-sm transition-colors'
const NAV_ACTIVE = 'bg-secondary text-foreground font-medium'
const NAV_INACTIVE =
  'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'

export function Sidebar({ isFounder = false }: { isFounder?: boolean }) {
  const [quickOpen, setQuickOpen] = useState(false)

  return (
    <aside className="w-[220px] shrink-0 bg-card flex flex-col border-r border-border-soft">
      <QuickRecreateModal open={quickOpen} onClose={() => setQuickOpen(false)} />
      <div className="px-5 py-6">
        <Link href="/today" className="flex flex-col leading-none">
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
        {WORKFLOW.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            className={NAV_BASE}
            activeClassName={NAV_ACTIVE}
            inactiveClassName={NAV_INACTIVE}
          >
            <item.icon size={15} strokeWidth={1.6} />
            <span className="flex-1">{item.label}</span>
          </NavLink>
        ))}

        <div className="my-3 border-t border-border-soft" aria-hidden />

        {CONFIG.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            className={NAV_BASE}
            activeClassName={NAV_ACTIVE}
            inactiveClassName={NAV_INACTIVE}
          >
            <item.icon size={15} strokeWidth={1.6} />
            <span className="flex-1">{item.label}</span>
          </NavLink>
        ))}

        {isFounder && (
          <>
            <div className="my-3 border-t border-border-soft" aria-hidden />
            <div className="px-3 mb-1.5 text-2xs uppercase tracking-wider text-muted-foreground font-medium">
              Founder
            </div>
            <NavLink
              href="/admin/users"
              className={NAV_BASE}
              activeClassName={NAV_ACTIVE}
              inactiveClassName={NAV_INACTIVE}
            >
              <UserPlus size={15} strokeWidth={1.6} />
              <span className="flex-1">Users</span>
            </NavLink>
            <NavLink
              href="/admin/waitlist"
              className={NAV_BASE}
              activeClassName={NAV_ACTIVE}
              inactiveClassName={NAV_INACTIVE}
            >
              <Mail size={15} strokeWidth={1.6} />
              <span className="flex-1">Waitlist</span>
            </NavLink>
            <NavLink
              href="/admin/settings"
              className={NAV_BASE}
              activeClassName={NAV_ACTIVE}
              inactiveClassName={NAV_INACTIVE}
            >
              <Sliders size={15} strokeWidth={1.6} />
              <span className="flex-1">App Settings</span>
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  )
}
