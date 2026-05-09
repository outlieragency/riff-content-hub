import { DashboardMock } from './dashboard-mock'
import { WaitlistForm } from './waitlist-form'

export function Hero({ count }: { count: number }) {
  return (
    <section
      id="top"
      className="rm-section rm-grid-bg relative"
      style={{ paddingTop: 132, paddingBottom: 72 }}
    >
      {/* Radial accent glow top-right */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -100,
          right: -200,
          width: 700,
          height: 700,
          background:
            'radial-gradient(circle, rgba(255,107,53,0.13), transparent 60%)',
          filter: 'blur(20px)',
        }}
      />

      <div className="rm-container grid gap-14 items-center hero-grid">
        {/* Left column */}
        <div>
          <div className="rm-eyebrow">
            <span className="dot" />
            IN PRIVATE BETA · INVITE-ONLY
          </div>

          <h1
            className="font-display"
            style={{
              marginTop: 18,
              fontSize: 'clamp(40px, 6.4vw, 76px)',
              fontWeight: 800,
              lineHeight: 1.04,
              textWrap: 'balance' as const,
            }}
          >
            Turn YouTube outliers into your{' '}
            <span
              style={{
                color: 'var(--rm-accent)',
                fontStyle: 'italic',
                fontWeight: 700,
              }}
            >
              next viral post.
            </span>
          </h1>

          <p
            className="font-thai"
            style={{
              fontSize: 'clamp(18px, 1.6vw, 22px)',
              color: 'var(--rm-muted)',
              marginTop: 22,
              maxWidth: 580,
              lineHeight: 1.5,
            }}
          >
            Riff หา video ที่{' '}
            <span style={{ color: 'var(--rm-text)' }}>break out</span> จาก
            channel อื่น แล้ว recreate เป็น{' '}
            <span style={{ color: 'var(--rm-text)' }}>
              script · article · reel · carousel
            </span>{' '}
            ใน voice ของคุณ — ใน 1 tool.
          </p>

          <div id="waitlist" className="mt-7">
            <WaitlistForm size="md" source="hero" />
          </div>

          <div
            className="font-mono mt-3 text-[var(--rm-muted-2)] flex gap-3 flex-wrap"
            style={{ fontSize: 12 }}
          >
            <span>
              <span style={{ color: 'var(--rm-accent)' }}>●</span> {count}{' '}
              creators waiting
            </span>
            <span>·</span>
            <span>No spam, ever</span>
            <span>·</span>
            <span>Unsubscribe in one click</span>
          </div>
        </div>

        {/* Right column — dashboard mock */}
        <div className="relative dashboard-wrap">
          <div
            className="absolute pointer-events-none"
            style={{
              inset: -40,
              zIndex: 0,
              background:
                'radial-gradient(ellipse at 60% 40%, rgba(255,107,53,0.10), transparent 60%)',
              filter: 'blur(8px)',
            }}
          />
          <div
            className="relative z-10"
            style={{
              transform: 'perspective(1400px) rotateY(-3deg) rotateX(2deg)',
              transformOrigin: 'left center',
            }}
          >
            <DashboardMock />
          </div>
          {/* Floating stat tag */}
          <div
            className="absolute z-20"
            style={{
              top: -18,
              left: -18,
              background: 'var(--rm-surface)',
              border: '1px solid var(--rm-border-2)',
              borderRadius: 10,
              padding: '10px 14px',
              boxShadow: '0 12px 40px -12px rgba(0,0,0,0.7)',
            }}
          >
            <div
              className="font-mono uppercase text-[var(--rm-muted)]"
              style={{ fontSize: 10, letterSpacing: '0.14em' }}
            >
              OUTLIERS FOUND
            </div>
            <div
              className="font-mono text-[var(--rm-text)] font-semibold"
              style={{ fontSize: 22 }}
            >
              87<span style={{ color: 'var(--rm-accent)' }}>↑</span>
            </div>
            <div
              className="font-mono text-[var(--rm-muted-2)]"
              style={{ fontSize: 10 }}
            >
              past 90 days
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hero-grid { grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr); }
        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr; }
          .dashboard-wrap { display: none; }
        }
      `}</style>
    </section>
  )
}
