const ITEMS = [
  'Built by Earth Rati',
  '40K+ followers',
  '7-figure creator',
  'Outlier Agency',
  'Featured: Creator Economy TH',
  '200+ private beta users',
]

export function SocialProof() {
  return (
    <section
      className="relative py-7"
      style={{
        borderTop: '1px solid var(--rm-border)',
        borderBottom: '1px solid var(--rm-border)',
      }}
    >
      <div className="rm-container px-6 flex items-center gap-8 flex-wrap justify-center">
        <span
          className="font-mono uppercase text-[var(--rm-muted-2)]"
          style={{ fontSize: 11.5, letterSpacing: '0.14em' }}
        >
          Built by the team behind →
        </span>
        <div className="flex gap-7 flex-wrap items-center">
          {ITEMS.map((t) => (
            <span
              key={t}
              className="font-display"
              style={{
                fontWeight: 600,
                opacity: 0.7,
                letterSpacing: '-0.01em',
                fontSize: 14,
                color: 'var(--rm-muted)',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
