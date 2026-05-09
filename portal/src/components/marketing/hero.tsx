import { DashboardMock } from './dashboard-mock'
import { WaitlistForm } from './waitlist-form'

export function Hero({ count }: { count: number }) {
  return (
    <section
      id="top"
      className="rm-section rm-grid-bg relative"
      style={{ paddingTop: 132, paddingBottom: 72 }}
    >
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
        <div>
          <div className="rm-eyebrow">
            <span className="dot" />
            BETA · เปิดให้ครีเอเตอร์ไทยเท่านั้น
          </div>

          <h1
            className="font-display"
            style={{
              marginTop: 18,
              fontSize: 'clamp(38px, 6vw, 70px)',
              fontWeight: 800,
              lineHeight: 1.06,
              textWrap: 'balance' as const,
            }}
          >
            ลงโพสต์ทุกวัน{' '}
            <span
              style={{
                color: 'var(--rm-accent)',
                fontStyle: 'italic',
                fontWeight: 700,
              }}
            >
              ในเสียงของคุณ
            </span>
            <br />
            ใช้แค่ 5 นาที.
          </h1>

          <p
            className="font-thai"
            style={{
              fontSize: 'clamp(17px, 1.5vw, 21px)',
              color: 'var(--rm-muted)',
              marginTop: 24,
              maxWidth: 580,
              lineHeight: 1.55,
            }}
          >
            Riff หา{' '}
            <span style={{ color: 'var(--rm-text)' }}>
              video YouTube ที่ดังที่สุด
            </span>{' '}
            ในนิชของคุณ แล้วเขียนเป็น{' '}
            <span style={{ color: 'var(--rm-text)' }}>
              FB post · IG carousel · Reels · YT script
            </span>{' '}
            ในแบบที่คุณเขียนเอง ไม่ใช่สำเนา ไม่ใช่ AI generic
          </p>

          <p
            className="font-thai"
            style={{
              fontSize: 17,
              color: 'var(--rm-text)',
              marginTop: 14,
              fontWeight: 500,
              maxWidth: 580,
              lineHeight: 1.55,
            }}
          >
            ไม่ต้องจ้าง agency ไม่ต้องมีทีม content เป็น{' '}
            <span style={{ color: 'var(--rm-accent)', fontWeight: 700 }}>
              1-Person Content Marketing
            </span>{' '}
            ได้เลย.
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
              ครีเอเตอร์รออยู่
            </span>
            <span>·</span>
            <span>ไม่มี spam</span>
            <span>·</span>
            <span>ยกเลิกเมื่อไหร่ก็ได้</span>
          </div>
        </div>

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
              VIDEO ดัง ๆ ที่เจอ
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
              ใน 90 วันที่ผ่านมา
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
