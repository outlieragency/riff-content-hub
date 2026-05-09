/**
 * Forest panel — "Top creators do what works, in their own way"
 * Highlights voice authenticity. Replaces what was Comparison +
 * social-proof in the old structure.
 */
const VOICES = [
  {
    name: 'Earth Rati',
    handle: '@earthrati',
    niche: 'Solopreneur · Marketing',
    style: 'ตรงไปตรงมา · ประโยคสั้น · ขึ้นต้นด้วยคำตอบ',
    rotation: -3,
  },
  {
    name: 'Mook',
    handle: '@missmook',
    niche: 'Coaching · Mindset',
    style: 'อบอุ่น · เล่าเรื่อง · ใช้ metaphor เห็นภาพ',
    rotation: 2,
  },
  {
    name: 'Sistangkwa',
    handle: '@sistangkwa',
    niche: 'Branding · Creator economy',
    style: 'sharp · มีอารมณ์ขัน · ตัดประโยคให้คม',
    rotation: -2,
  },
]

export function TopCreators() {
  return (
    <section
      className="rm-forest"
      style={{ padding: '120px 24px' }}
    >
      <div className="rm-container">
        <div className="text-center mx-auto mb-16" style={{ maxWidth: 760 }}>
          <h2
            style={{
              fontSize: 'clamp(34px, 4.4vw, 56px)',
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              textWrap: 'balance' as const,
            }}
          >
            top creator แต่ละคน
            <br />
            <span className="rm-serif-italic">เขียนคนละแบบ</span>
          </h2>
          <p
            className="mt-5 mx-auto text-[var(--rm-forest-muted)]"
            style={{ fontSize: 'clamp(15px, 1.3vw, 18px)', lineHeight: 1.6, maxWidth: 600 }}
          >
            Riff ไม่ทำให้ทุกคนพูดเหมือนกัน อ่านเสียงของคุณจาก post เก่า แล้วเขียนใหม่
            ในแบบเดียวกัน Match เฉลี่ย 91% คนอ่านแยกไม่ออก
          </p>
        </div>

        <div className="grid gap-6 voices-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {VOICES.map((v) => (
            <div
              key={v.handle}
              className="rm-polaroid"
              style={{
                transform: `rotate(${v.rotation}deg)`,
                padding: '14px 14px 18px',
              }}
            >
              {/* Portrait swatch */}
              <div
                style={{
                  aspectRatio: '4 / 5',
                  borderRadius: 2,
                  background:
                    'linear-gradient(135deg, #C99A6E 0%, #8B6B47 50%, #4A3D2A 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 6px, transparent 6px 12px)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 14,
                    left: 14,
                    right: 14,
                    color: '#FBF7EC',
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: '0.1em', fontWeight: 600 }}>
                    VOICE PROFILE
                  </div>
                </div>
              </div>

              {/* Caption */}
              <div className="mt-3.5">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1A2418' }}>
                    {v.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#5A5547', fontWeight: 500 }}>
                    {v.handle}
                  </div>
                </div>
                <div
                  className="mt-1"
                  style={{ fontSize: 12.5, color: '#5A5547', fontWeight: 500 }}
                >
                  {v.niche}
                </div>
                <div
                  className="mt-2 pt-2"
                  style={{
                    fontSize: 12.5,
                    color: '#1A2418',
                    lineHeight: 1.5,
                    borderTop: '1px dashed rgba(26,36,24,0.15)',
                  }}
                >
                  {v.style}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .voices-grid { grid-template-columns: 1fr !important; max-width: 360px; margin: 0 auto; }
        }
      `}</style>
    </section>
  )
}
