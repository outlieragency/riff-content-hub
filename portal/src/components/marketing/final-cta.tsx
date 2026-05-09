import { WaitlistForm } from './waitlist-form'

export function FinalCTA({ count }: { count: number }) {
  return (
    <section
      className="rm-section relative overflow-hidden"
      style={{ paddingTop: 120, paddingBottom: 120 }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(255,107,53,0.16), transparent 50%)',
        }}
      />
      <div
        className="rm-container relative text-center"
        style={{ maxWidth: 820 }}
      >
        <div className="rm-eyebrow inline-flex justify-center">
          <span className="dot" />
          EARLY ACCESS · BATCH 03 OPENS NEXT WEEK
        </div>
        <h2
          className="font-display"
          style={{
            fontSize: 'clamp(40px, 6vw, 76px)',
            marginTop: 18,
            fontWeight: 800,
            textWrap: 'balance' as const,
            lineHeight: 1.02,
            letterSpacing: '-0.025em',
          }}
        >
          Stop juggling 6 tools. <br />
          <span style={{ color: 'var(--rm-accent)', fontStyle: 'italic' }}>
            Start riffing.
          </span>
        </h2>
        <p
          className="font-thai text-[var(--rm-muted)]"
          style={{ fontSize: 19, marginTop: 22 }}
        >
          Join {count} creators on the waitlist · Early access drops in batches.
        </p>
        <div className="mt-7 flex justify-center">
          <WaitlistForm size="lg" source="final-cta" />
        </div>
        <div
          className="font-mono mt-3.5 text-[var(--rm-muted-2)]"
          style={{ fontSize: 11.5, letterSpacing: '0.08em' }}
        >
          NO SPAM · NO PRICING SURPRISES · UNSUBSCRIBE IN ONE CLICK
        </div>
      </div>
    </section>
  )
}
