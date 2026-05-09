export function Founder() {
  return (
    <section className="rm-section">
      <div
        className="rm-container grid gap-12 items-center founder-grid"
        style={{
          background: 'var(--rm-surface)',
          borderRadius: 24,
          padding: 'clamp(32px, 5vw, 64px)',
          border: '1px solid var(--rm-border)',
        }}
      >
        {/* Portrait placeholder */}
        <div
          className="relative overflow-hidden flex items-center justify-center"
          style={{
            width: 220,
            height: 220,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #4a2a1c, #1a0a04 70%)',
            border: '1px solid var(--rm-border-2)',
            color: 'var(--rm-accent)',
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: 80,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0 8px, transparent 8px 16px)',
            }}
          />
          <div className="relative" style={{ letterSpacing: '-0.04em' }}>
            ER
          </div>
          <div
            className="font-mono absolute"
            style={{
              left: 12,
              bottom: 10,
              fontSize: 9.5,
              color: 'var(--rm-muted-2)',
              letterSpacing: '0.14em',
            }}
          >
            FOUNDER PORTRAIT
          </div>
        </div>

        <div>
          <div className="rm-eyebrow">
            <span className="dot" />
            ใครเป็นคนสร้าง
          </div>
          <h2
            className="mt-3.5"
            style={{
              fontSize: 'clamp(26px, 3.6vw, 40px)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              textWrap: 'balance' as const,
            }}
          >
            ไม่ได้สร้างโดย tech bro{' '}
            <span style={{ color: 'var(--rm-accent)' }}>
              สร้างโดย creator
            </span>{' '}
            ที่ใช้เองทุกวัน
          </h2>
          <p
            className="text-[var(--rm-muted)]"
            style={{
              fontSize: 'clamp(15px, 1.4vw, 18px)',
              marginTop: 18,
              lineHeight: 1.6,
              maxWidth: 620,
            }}
          >
            ผม Earth Rati ทำ content คนเดียวมา 3 ปี สร้างยอดขายหลักล้าน/เดือน
            จาก digital product เพราะลง content ทุกวันได้ Riff คือเครื่องมือที่ผมสร้าง
            เพื่อให้ตัวเองทำได้เร็วขึ้นโดยไม่เสีย voice และเปิดให้ creator คนอื่นใช้ด้วย
          </p>
          <blockquote
            className="mt-6 pl-5"
            style={{ borderLeft: '2px solid var(--rm-accent)' }}
          >
            <p
              className="m-0 text-[var(--rm-text)]"
              style={{ fontSize: 'clamp(17px, 1.7vw, 20px)', lineHeight: 1.5, fontStyle: 'italic', fontWeight: 500 }}
            >
              &ldquo;ถ้า Riff ทำงานได้กับผม ที่ลง content ทุกวันมา 3 ปี
              มันจะทำงานได้กับคุณ&rdquo;
            </p>
            <footer
              className="mt-3 text-[var(--rm-muted-2)]"
              style={{ fontSize: 12, letterSpacing: '0.06em', fontWeight: 500 }}
            >
              EARTH RATI · FOUNDER, OUTLIER AGENCY
            </footer>
          </blockquote>
        </div>
      </div>

      <style>{`
        .founder-grid { grid-template-columns: 240px 1fr; }
        @media (max-width: 900px) {
          .founder-grid { grid-template-columns: 1fr; }
          .founder-grid > div:first-child { width: 160px; height: 160px; font-size: 56px; }
        }
      `}</style>
    </section>
  )
}
