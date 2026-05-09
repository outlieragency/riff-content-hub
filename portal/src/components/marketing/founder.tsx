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
            fontFamily: 'Inter Tight, sans-serif',
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
            THE STORY
          </div>
          <h2
            className="font-display mt-3.5"
            style={{
              fontSize: 'clamp(28px, 3.6vw, 42px)',
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: '-0.025em',
              textWrap: 'balance' as const,
            }}
          >
            Built by a creator,{' '}
            <span style={{ color: 'var(--rm-accent)', fontStyle: 'italic' }}>
              for creators.
            </span>
          </h2>
          <p
            className="font-thai text-[var(--rm-muted)]"
            style={{
              fontSize: 18,
              marginTop: 18,
              lineHeight: 1.55,
              maxWidth: 620,
            }}
          >
            Earth สร้าง Riff ขึ้นมาเพื่อใช้ run agency ของตัวเอง (Outlier Agency)
            — ไม่ใช่ faceless SaaS. ถ้ามันทำงานได้สำหรับ 7-figure creator ที่ ship
            content ทุกวัน — มันจะทำงานได้สำหรับคุณ.
          </p>
          <blockquote
            className="mt-6 pl-5"
            style={{ borderLeft: '2px solid var(--rm-accent)' }}
          >
            <p
              className="font-thai italic m-0 text-[var(--rm-text)]"
              style={{ fontSize: 19, lineHeight: 1.5 }}
            >
              &ldquo;ผมเบื่อการสลับ tab 6 tabs เพื่อเขียน 1 post — เลยสร้าง Riff
              ขึ้นมาใช้เอง. ตอนนี้เปิดให้ creator คนอื่นใช้ด้วย.&rdquo;
            </p>
            <footer
              className="font-mono mt-2.5 text-[var(--rm-muted-2)]"
              style={{ fontSize: 12, letterSpacing: '0.06em' }}
            >
              — EARTH RATI · FOUNDER, OUTLIER AGENCY
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
