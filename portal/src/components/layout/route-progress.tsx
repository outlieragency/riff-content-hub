'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Top progress bar shown during route transitions.
 *
 * Uses pathname + searchParams change as the "navigation completed" signal.
 * The bar starts via global `window.dispatchEvent('riff:nav-start')` and
 * completes automatically on next render.
 *
 * Listening for events (not Link clicks) lets us also catch programmatic
 * router.push() / router.refresh() calls.
 */
export function RouteProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState<number>(0)
  const [visible, setVisible] = useState(false)

  // Begin: any nav-start event
  useEffect(() => {
    function onStart() {
      setVisible(true)
      setProgress(8)
      // Tick to 80% in ~600ms (UX: feel responsive even on slow nav)
      const start = Date.now()
      const tick = () => {
        const elapsed = Date.now() - start
        const target = Math.min(80, 8 + (elapsed / 600) * 72)
        setProgress((p) => (p < target ? target : p))
        if (elapsed < 600) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }
    window.addEventListener('riff:nav-start', onStart)
    return () => window.removeEventListener('riff:nav-start', onStart)
  }, [])

  // End: pathname/searchParams changed → complete + hide
  // (Setting state in effect is intentional — this *is* the "external state
  // changed" signal we're subscribing to, not a derived value.)
  useEffect(() => {
    if (!visible) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(100)
    const t = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[2px] bg-brand/15 pointer-events-none">
      <div
        className="h-full bg-brand transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress >= 100 ? '200ms' : '150ms',
        }}
      />
    </div>
  )
}
