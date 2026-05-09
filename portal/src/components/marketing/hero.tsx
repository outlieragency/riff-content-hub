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
            สำหรับ creator ไทยที่ทำ content คนเดียว
          </div>

          <h1
            className="font-display"
            style={{
              marginTop: 20,
              fontSize: 'clamp(36px, 5.6vw, 66px)',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              textWrap: 'balance' as const,
            }}
          >
            1 video YouTube{' '}
            <span style={{ color: 'var(--rm-accent)' }}>= 4 โพสต์</span>
            <br />
            ในเสียงคุณ ใน 5 นาที
          </h1>

          <p
            style={{
              fontSize: 'clamp(17px, 1.5vw, 20px)',
              color: 'var(--rm-muted)',
              marginTop: 22,
              maxWidth: 580,
              lineHeight: 1.55,
            }}
          >
            Riff หาวิดีโอที่ดังจริงในนิชของคุณ แล้วเขียนเป็น{' '}
            <span style={{ color: 'var(--rm-text)', fontWeight: 600 }}>
              FB post · IG carousel · Reels · YT script
            </span>{' '}
            ในเสียงคุณเอง ลงได้ทุกวัน โดยไม่ต้องคิดไอเดียเอง ไม่ต้องเขียนเอง
            ไม่ต้องจ้าง agency
          </p>

          <p
            style={{
              fontSize: 16,
              color: 'var(--rm-muted)',
              marginTop: 12,
              maxWidth: 580,
              lineHeight: 1.55,
            }}
          >
            เคยใช้ <s style={{ color: 'var(--rm-muted-2)' }}>4 ชั่วโมง</s> ตอนนี้ใช้{' '}
            <span style={{ color: 'var(--rm-accent)', fontWeight: 700 }}>
              5 นาที
            </span>{' '}
            ต่อ 1 โพสต์
          </p>

          <div id="waitlist" className="mt-7">
            <WaitlistForm size="md" source="hero" />
          </div>

          <div
            className="mt-3 text-[var(--rm-muted-2)] flex gap-3 flex-wrap"
            style={{ fontSize: 13 }}
          >
            <span>
              <span style={{ color: 'var(--rm-accent)' }}>●</span> {count}{' '}
              creator รออยู่
            </span>
            <span>·</span>
            <span>ล็อกราคา early-creator ถูกกว่า 50%</span>
            <span>·</span>
            <span>ยกเลิกได้ตลอด</span>
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
              className="text-[var(--rm-muted)]"
              style={{ fontSize: 11, letterSpacing: '0.06em', fontWeight: 500 }}
            >
              video ดังที่เจอ
            </div>
            <div
              className="text-[var(--rm-text)]"
              style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}
            >
              87<span style={{ color: 'var(--rm-accent)' }}>↑</span>
            </div>
            <div
              className="text-[var(--rm-muted-2)]"
              style={{ fontSize: 11 }}
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
