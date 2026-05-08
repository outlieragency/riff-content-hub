'use client'

import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const titleId = useId()
  const descId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  // Element that had focus right before the modal opened — we put it back on close.
  const triggerRef = useRef<HTMLElement | null>(null)
  // Callers usually pass an inline `onClose`, which is a fresh reference each
  // render. Stash it in a ref so the effect below can depend only on `open`
  // and not retrigger (re-running cleanup → stealing focus from inputs).
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // ESC + body scroll lock + remember the previously-focused element so we
  // can hand focus back when the modal unmounts.
  useEffect(() => {
    if (!open) return
    triggerRef.current = (document.activeElement as HTMLElement | null) ?? null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      // Restore focus on close. requestAnimationFrame so the DOM has settled
      // (e.g. the panel just unmounted, the trigger may now be re-enabled).
      const previous = triggerRef.current
      if (previous && typeof previous.focus === 'function') {
        requestAnimationFrame(() => previous.focus())
      }
      triggerRef.current = null
    }
  }, [open])

  // Auto-focus the first interactive element inside the modal on open.
  useEffect(() => {
    if (!open) return
    const root = containerRef.current
    if (!root) return
    // Defer one frame so children that auto-mount their inputs are ready.
    requestAnimationFrame(() => {
      const focusables = root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      // Prefer the first non-close-button element so the cursor lands in the
      // form, not on the X. Fall back to the close button if there's nothing else.
      const target = Array.from(focusables).find(
        (el) => el.dataset.modalCloseButton !== 'true',
      )
      ;(target ?? focusables[0])?.focus()
    })
  }, [open])

  // Trap Tab inside the modal.
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Tab') return
    const root = containerRef.current
    if (!root) return
    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)
    if (focusables.length === 0) {
      e.preventDefault()
      return
    }
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement as HTMLElement | null
    if (e.shiftKey) {
      if (active === first || !root.contains(active)) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (active === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  if (!open) return null

  const widths = {
    sm: 'max-w-[400px]',
    md: 'max-w-[520px]',
    lg: 'max-w-[680px]',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        onKeyDown={handleKeyDown}
        className={`w-full ${widths[size]} bg-card border border-border rounded-[16px] shadow-xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-border-soft">
          <div>
            <div id={titleId} className="text-lg font-semibold text-foreground">
              {title}
            </div>
            {description && (
              <p id={descId} className="text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            data-modal-close-button="true"
            aria-label="Close dialog"
            className="w-7 h-7 -mr-1 rounded-[7px] flex items-center justify-center text-text-muted hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
