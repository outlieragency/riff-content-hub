'use client'

import { useState, useTransition } from 'react'
import { joinWaitlist } from '@/lib/actions/waitlist'

/**
 * Waitlist signup form.
 *
 * Two modes:
 * 1. **GHL embed** — set NEXT_PUBLIC_GHL_FORM_URL env var; an iframe renders
 *    the GHL form (Earth's preferred path for email automation).
 * 2. **Native fallback** — if no env var, renders a simple email field that
 *    POSTs to a Supabase `waitlist` table via server action.
 *
 * Both modes are controlled by `<WaitlistForm />` so any section can drop
 * it in with consistent styling.
 */
export function WaitlistForm({
  size = 'md',
  source = 'hero',
}: {
  size?: 'md' | 'lg'
  source?: string
}) {
  const ghlUrl = process.env.NEXT_PUBLIC_GHL_FORM_URL

  if (ghlUrl) {
    return (
      <div className="w-full max-w-[480px]">
        <iframe
          src={ghlUrl}
          title="Join the Riff waitlist"
          className="w-full rounded-[10px] border border-[var(--rm-border-2)] bg-[var(--rm-surface)]"
          style={{ height: size === 'lg' ? 240 : 200 }}
          loading="lazy"
        />
      </div>
    )
  }

  return <NativeWaitlistForm size={size} source={source} />
}

function NativeWaitlistForm({
  size,
  source,
}: {
  size: 'md' | 'lg'
  source: string
}) {
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('ใส่ email ก่อน')
      return
    }
    setError(null)
    start(async () => {
      const res = await joinWaitlist({ email: email.trim(), source })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setJoined(true)
    })
  }

  const buttonHeight = size === 'lg' ? 48 : 44
  const buttonFontSize = size === 'lg' ? 16 : 15

  return (
    <form onSubmit={submit} className="w-full max-w-[480px]">
      <div className="rm-field">
        <input
          type="email"
          required
          placeholder="you@studio.co"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending || joined}
        />
        <button
          type="submit"
          className="rm-btn rm-btn-primary"
          disabled={pending || joined}
          style={{ height: buttonHeight, fontSize: buttonFontSize, padding: '0 22px' }}
        >
          {joined ? "✓ You're in" : pending ? '...' : 'Join waitlist →'}
        </button>
      </div>
      {error && (
        <div
          className="font-mono mt-2 text-[var(--rm-danger)]"
          style={{ fontSize: 13, letterSpacing: '0.06em' }}
        >
          {error}
        </div>
      )}
    </form>
  )
}
