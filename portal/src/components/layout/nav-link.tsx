'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Nav link with built-in loading state for sidebar / topbar / cards.
 *
 * Click → fires `riff:nav-start` (top progress bar), shows local spinner
 * until pathname changes. Replaces raw <Link> in places where we want
 * tactile click feedback.
 */
export function NavLink({
  href,
  children,
  className,
  activeClassName,
  inactiveClassName,
  showSpinnerWhilePending = true,
}: {
  href: string
  children: React.ReactNode
  className?: string
  activeClassName?: string
  inactiveClassName?: string
  showSpinnerWhilePending?: boolean
}) {
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [pending, setPending] = useState(false)

  const isActive = pathname === href || pathname.startsWith(href + '/')
  const isHome = href === '/'
  const homeActive = isHome && pathname === '/'
  const active = isHome ? homeActive : isActive

  // When pathname changes after click → reset pending
  // (handled by top progress bar separately, but keep local state too
  // for nav-link spinner animation)
  if (pending && pathname === href) {
    // path settled → fire effect to reset
    queueMicrotask(() => setPending(false))
  }

  return (
    <Link
      href={href}
      onClick={() => {
        if (pathname === href) return
        setPending(true)
        startTransition(() => {})
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('riff:nav-start'))
        }
      }}
      className={cn(
        className,
        active ? activeClassName : inactiveClassName,
      )}
    >
      {children}
      {showSpinnerWhilePending && pending && (
        <Loader2 size={12} className="animate-spin ml-auto opacity-60" />
      )}
    </Link>
  )
}
