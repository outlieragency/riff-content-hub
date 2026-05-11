'use client'

import { useState, useTransition } from 'react'
import { Plus, Check, Loader2, Sparkles } from 'lucide-react'
import { trackCreator } from '@/lib/actions/track-creator'
import { nicheLabel } from '@/lib/niches'

export type SuggestedCreator = {
  handle: string
  niche: string
  hint?: string
}

/**
 * Horizontal scroll row of suggested creators in the user's selected
 * niches that they don't yet track. Each card = `+ Track @handle`.
 * Click triggers worker channel sync and revalidates /discover.
 */
export function SuggestedCreators({
  creators,
}: {
  creators: SuggestedCreator[]
}) {
  if (creators.length === 0) return null

  return (
    <section className="mb-5">
      <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
        <Sparkles size={12} />
        <span className="font-medium">Suggested creators</span>
        <span className="text-muted-foreground/70">— ใน niche ที่เลือก พี่ยังไม่ track</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {creators.map((c) => (
          <SuggestionCard key={c.handle} creator={c} />
        ))}
      </div>
    </section>
  )
}

function SuggestionCard({ creator }: { creator: SuggestedCreator }) {
  const [pending, start] = useTransition()
  const [state, setState] = useState<'idle' | 'tracked' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  function onTrack() {
    setError(null)
    start(async () => {
      const res = await trackCreator(creator.handle)
      if (res.ok) setState('tracked')
      else {
        setState('error')
        setError(res.error)
      }
    })
  }

  const niche = nicheLabel(creator.niche)

  return (
    <button
      type="button"
      onClick={state === 'idle' ? onTrack : undefined}
      disabled={pending || state !== 'idle'}
      title={creator.hint ?? undefined}
      className={`snap-start shrink-0 inline-flex items-center gap-2 pl-3 pr-4 py-2 rounded-full text-xs transition-colors ${
        state === 'tracked'
          ? 'bg-green-100 text-green-700'
          : state === 'error'
            ? 'bg-red-100 text-red-700'
            : 'bg-secondary hover:bg-foreground hover:text-background'
      } disabled:opacity-70`}
    >
      <span
        className={`w-5 h-5 rounded-full inline-flex items-center justify-center ${
          state === 'tracked' ? 'bg-green-700/15' : 'bg-foreground/10'
        }`}
      >
        {pending ? (
          <Loader2 size={11} className="animate-spin" />
        ) : state === 'tracked' ? (
          <Check size={11} />
        ) : (
          <Plus size={11} />
        )}
      </span>
      <span className="font-medium">@{creator.handle}</span>
      <span className="text-[10px] opacity-70">{niche}</span>
      {error && (
        <span className="text-[10px] ml-1 opacity-90">— {error.slice(0, 30)}</span>
      )}
    </button>
  )
}
