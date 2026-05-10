/**
 * Forest panel — Founder testimonial.
 * Eden-style: a key result claim paired with a portrait polaroid + quote.
 */
export function Founder() {
  return (
    <section
      className="rm-forest"
      style={{ padding: '120px 24px' }}
    >
      <div className="rm-container">
        <div
          className="grid gap-12 items-center founder-grid"
          style={{ gridTemplateColumns: '1fr 1fr' }}
        >
          <div>
            <h2
              style={{
                fontSize: 'clamp(32px, 4vw, 50px)',
                fontWeight: 600,
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                textWrap: 'balance' as const,
              }}
            >
              จาก Solopreneur หลักล้าน
              <br />
              สู่{' '}
              <span className="rm-serif-italic">Outlier Agency</span>
            </h2>
            <p
              className="mt-5 text-[var(--rm-forest-muted)]"
              style={{ fontSize: 'clamp(15px, 1.3vw, 18px)', lineHeight: 1.7, maxWidth: 500 }}
            >
              ผมเป็น Solopreneur สร้าง Digital Product ขายเองมาตลอด 3 ปี
              ทั้ง template, course, coaching ทำยอดหลักล้าน/เดือนได้
              ทั้งที่ไม่มีทีม
              <br />
              <br />
              วันนี้ผมเปิด Outlier Agency พา Expert + Creator คนอื่น
              วางระบบ funnel + content ให้โต 7 หลัก/เดือน ในแบบเดียวกัน
              <br />
              <br />
              Riff คือเครื่องมือที่ผมใช้ทำ content ของตัวเอง
              และของลูกค้า agency ทุกราย
            </p>

            <div
              className="mt-7 pl-5"
              style={{ borderLeft: '2px solid rgba(241,236,223,0.30)' }}
            >
              <p
                className="rm-serif-italic"
                style={{
                  fontSize: 'clamp(18px, 1.7vw, 22px)',
                  lineHeight: 1.4,
                  color: 'var(--rm-forest-text)',
                  fontWeight: 400,
                  margin: 0,
                }}
              >
                &ldquo;ของจริงคือ ลง content ต่อเนื่อง
                = moat ที่ AI ลอกไม่ได้&rdquo;
              </p>
              <div
                className="mt-3 text-[var(--rm-forest-muted)]"
                style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.06em' }}
              >
                EARTH RATI · FOUNDER, OUTLIER AGENCY
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div
              className="rm-polaroid"
              style={{
                transform: 'rotate(2deg)',
                padding: '14px 14px 22px',
                maxWidth: 340,
              }}
            >
              <div
                style={{
                  aspectRatio: '4 / 5',
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #4A2A1C 0%, #1A0A04 70%)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0 8px, transparent 8px 16px)',
                  }}
                />
                <div
                  style={{
                    fontSize: 96,
                    fontWeight: 700,
                    letterSpacing: '-0.04em',
                    color: 'var(--rm-accent)',
                    position: 'relative',
                  }}
                >
                  ER
                </div>
              </div>
              <div
                className="mt-3 text-center"
                style={{ fontSize: 13, fontWeight: 500, color: '#5A5547' }}
              >
                Earth Rati · 2026
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .founder-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
