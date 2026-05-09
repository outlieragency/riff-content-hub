const TIERS = [
  { range: '< 1.0', label: 'Below avg', color: '#9aa39a', w: 12 },
  { range: '1.0 – 2.0', label: 'Average', color: '#93C5FD', w: 24 },
  { range: '2.0 – 5.0', label: 'Outlier', color: '#86efac', w: 50 },
  { range: '5.0 – 10.0', label: 'Viral', color: '#fdba74', w: 78 },
  { range: '> 10.0', label: 'Mega viral', color: '#fca5a5', w: 100 },
]

export function OutlierScore() {
  return (
    <section id="score" className="rm-section">
      <div
        className="rm-container relative overflow-hidden"
        style={{
          background: 'var(--rm-surface)',
          border: '1px solid var(--rm-border)',
          borderRadius: 24,
          padding: 'clamp(32px, 5vw, 72px)',
        }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            top: -200,
            left: -200,
            width: 500,
            height: 500,
            background:
              'radial-gradient(circle, rgba(74,222,128,0.06), transparent 60%)',
          }}
        />
        <div className="grid gap-14 items-center relative score-grid">
          <div>
            <div className="rm-eyebrow">
              <span className="dot" />
              THE SIGNAL
            </div>
            <h2
              className="font-display mt-3.5"
              style={{
                fontSize: 'clamp(32px, 4.4vw, 52px)',
                fontWeight: 700,
                lineHeight: 1.04,
                letterSpacing: '-0.025em',
                textWrap: 'balance' as const,
              }}
            >
              What&apos;s an{' '}
              <span style={{ color: 'var(--rm-accent)' }}>Outlier Score</span>?
            </h2>
            <p
              className="font-thai mt-4.5 text-[var(--rm-muted)]"
              style={{ fontSize: 18, marginTop: 18, lineHeight: 1.55 }}
            >
              Score ยิ่งสูง = video reach ออกนอกฐานแฟนเดิมไปไกล = viral signal.
              เป็น industry-standard formula ที่ creator agency ใช้กันจริง —
              ไม่ใช่ vanity metric.
            </p>

            <div
              className="mt-7"
              style={{
                padding: '20px 22px',
                borderRadius: 12,
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid var(--rm-border-2)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 18,
                lineHeight: 1.5,
              }}
            >
              <div
                className="text-[var(--rm-muted-2)]"
                style={{ fontSize: 11, letterSpacing: '0.14em' }}
              >
                {'// FORMULA'}
              </div>
              <div className="mt-1.5 text-[var(--rm-text)]">
                <span style={{ color: 'var(--rm-accent)' }}>OutlierScore</span>
                <span className="text-[var(--rm-muted)]"> = </span>
                Video Views <span className="text-[var(--rm-muted)]">÷</span>{' '}
                Channel Subscribers
              </div>
              <div
                className="text-[var(--rm-muted-2)] mt-3 italic"
                style={{ fontSize: 12 }}
              >
                e.g. 2.1M views ÷ 180K subs ={' '}
                <span className="text-[var(--rm-text)]">11.7×</span>
                <span style={{ color: '#fca5a5' }}> · mega viral</span>
              </div>
            </div>
          </div>

          <div>
            <div
              className="font-mono uppercase mb-3.5 text-[var(--rm-muted)]"
              style={{ fontSize: 12, letterSpacing: '0.14em' }}
            >
              5 TIERS — AS THEY APPEAR IN-APP
            </div>
            <div className="flex flex-col gap-3">
              {TIERS.map((t) => (
                <div
                  key={t.range}
                  className="grid gap-3.5 items-center"
                  style={{ gridTemplateColumns: '92px 110px 1fr' }}
                >
                  <span
                    className="rm-score-chip justify-center"
                    style={{
                      color: t.color,
                      borderColor: `${t.color}40`,
                      background: `${t.color}10`,
                    }}
                  >
                    {t.range}
                  </span>
                  <span
                    className="font-display font-semibold"
                    style={{ fontSize: 14, color: t.color }}
                  >
                    {t.label}
                  </span>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <div
                      className="h-full"
                      style={{
                        width: `${t.w}%`,
                        background: `linear-gradient(90deg, ${t.color}30, ${t.color})`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div
              className="font-mono mt-5 pt-3.5 border-t border-dashed text-[var(--rm-muted-2)]"
              style={{ fontSize: 11, borderColor: 'var(--rm-border-2)' }}
            >
              Tier thresholds tuned with 2.4M video benchmark across creator
              economy TH/EN.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .score-grid { grid-template-columns: minmax(0,1fr) minmax(0,1fr); }
        @media (max-width: 900px) { .score-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  )
}
