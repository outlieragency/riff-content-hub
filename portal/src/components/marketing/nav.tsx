'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { RiffLogo } from './logo'

const NAV_LINKS: [string, string][] = [
  ['Riff คืออะไร', '#what'],
  ['ทำงานยังไง', '#how'],
  ['ผลลัพธ์', '#outcomes'],
  ['คำถามที่พบบ่อย', '#faq'],
]

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-[background,backdrop-filter,border] duration-300"
      style={{
        background: scrolled ? 'rgba(10,15,10,0.78)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(140%) blur(14px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'saturate(140%) blur(14px)' : 'none',
        borderBottom: scrolled
          ? '1px solid var(--rm-border)'
          : '1px solid transparent',
      }}
    >
      <div className="rm-container flex items-center justify-between px-6 py-4">
        <RiffLogo />

        <div className="rm-hide-md flex gap-7">
          {NAV_LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="font-thai text-[var(--rm-muted)] hover:text-[var(--rm-text)] no-underline transition-colors"
              style={{ fontSize: 15.5, fontWeight: 500 }}
            >
              {label}
            </a>
          ))}
        </div>

        <div className="flex gap-3 items-center">
          <Link
            href="/login"
            className="font-thai text-[var(--rm-muted)] hover:text-[var(--rm-text)] no-underline"
            style={{ fontSize: 15.5, fontWeight: 500 }}
          >
            เข้าสู่ระบบ
          </Link>
          <a
            href="#waitlist"
            className="rm-btn rm-btn-primary rm-btn-sm font-thai"
            style={{
              opacity: scrolled ? 1 : 0,
              pointerEvents: scrolled ? 'auto' : 'none',
              transition: 'opacity .25s',
            }}
          >
            ขอสิทธิ์ใช้ก่อน →
          </a>
        </div>
      </div>
    </nav>
  )
}
