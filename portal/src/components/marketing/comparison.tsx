/**
 * Riff vs alternatives — helps visitors who are evaluating against:
 *   1. Hire an agency (expensive + slow)
 *   2. DIY (burn out)
 *   3. Generic AI (sounds like robot)
 */
export function Comparison() {
  return (
    <section className="rm-section">
      <div className="rm-container">
        <div style={{ maxWidth: 760, marginBottom: 48 }}>
          <div className="rm-eyebrow">
            <span className="dot" />
            ทำไมต้อง Riff
          </div>
          <h2
            className="mt-3.5"
            style={{
              fontSize: 'clamp(28px, 4.4vw, 46px)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              textWrap: 'balance' as const,
            }}
          >
            ถูกกว่า agency 30 เท่า{' '}
            <span style={{ color: 'var(--rm-accent)' }}>
              เร็วกว่าทำเอง 48 เท่า
            </span>
          </h2>
          <p
            className="mt-4 text-[var(--rm-muted)]"
            style={{ fontSize: 'clamp(16px, 1.4vw, 18px)', lineHeight: 1.55 }}
          >
            มาดูกันว่าทำไมทางเลือกอื่นไม่ work สำหรับ creator คนเดียว
          </p>
        </div>

        <div className="grid gap-4 comparison-grid">
          {/* Hire agency */}
          <div className="rm-card p-6">
            <div
              className="font-mono uppercase"
              style={{
                fontSize: 13.5,
                letterSpacing: '0.14em',
                color: 'rgba(239,68,68,0.7)',
              }}
            >
              ทางเลือก A
            </div>
            <h3
              className="font-display mt-2"
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--rm-muted)',
                letterSpacing: '-0.02em',
              }}
            >
              จ้าง agency
            </h3>
            <ul className="mt-4 space-y-2.5" style={{ listStyle: 'none', padding: 0 }}>
              <PainPoint text="30,000-100,000 บาท/เดือน" />
              <PainPoint text="ทีม content ไม่เข้าใจ niche คุณ" />
              <PainPoint text="ใช้ voice ของ agency ไม่ใช่ของคุณ" />
              <PainPoint text="รอ feedback 2-3 รอบกว่าจะลงได้" />
              <PainPoint text="หยุดจ่าย = หยุดมี content" />
            </ul>
          </div>

          {/* DIY */}
          <div className="rm-card p-6">
            <div
              className="font-mono uppercase"
              style={{
                fontSize: 13.5,
                letterSpacing: '0.14em',
                color: 'rgba(245,158,11,0.7)',
              }}
            >
              ทางเลือก B
            </div>
            <h3
              className="font-display mt-2"
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--rm-muted)',
                letterSpacing: '-0.02em',
              }}
            >
              ทำเองทั้งหมด
            </h3>
            <ul className="mt-4 space-y-2.5" style={{ listStyle: 'none', padding: 0 }}>
              <PainPoint text="4 ชั่วโมง ต่อ 1 โพสต์" />
              <PainPoint text="สลับ tab 6 อย่าง (YouTube, Notion, ChatGPT, Canva...)" />
              <PainPoint text="ไอเดียตัน 2 อาทิตย์ก็เริ่มหมด" />
              <PainPoint text="Burnout จริง มีกี่คนทำได้นาน" />
              <PainPoint text="ไม่มีเวลาคุย sales ต่อ" />
            </ul>
          </div>

          {/* Generic AI */}
          <div className="rm-card p-6">
            <div
              className="font-mono uppercase"
              style={{
                fontSize: 13.5,
                letterSpacing: '0.14em',
                color: 'rgba(96,165,250,0.7)',
              }}
            >
              ทางเลือก C
            </div>
            <h3
              className="font-display mt-2"
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--rm-muted)',
                letterSpacing: '-0.02em',
              }}
            >
              ใช้ ChatGPT generic
            </h3>
            <ul className="mt-4 space-y-2.5" style={{ listStyle: 'none', padding: 0 }}>
              <PainPoint text="เขียนเหมือน AI คนอ่านดูออก" />
              <PainPoint text="ไม่มี idea source ต้องคิดเอง" />
              <PainPoint text="ไม่รู้ว่า content นี้จะปังไหม" />
              <PainPoint text="prompt ใหม่ทุกครั้ง เสียเวลา" />
              <PainPoint text="ไม่ render cover ไม่จัด format" />
            </ul>
          </div>

          {/* Riff */}
          <div
            className="rm-card rm-glow-accent p-6"
            style={{
              background: 'var(--rm-surface)',
              borderColor: 'rgba(255,107,53,0.4)',
            }}
          >
            <div
              className="font-mono uppercase"
              style={{
                fontSize: 13.5,
                letterSpacing: '0.14em',
                color: 'var(--rm-accent)',
              }}
            >
              ✓ คำตอบ
            </div>
            <h3
              className="font-display mt-2"
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--rm-text)',
                letterSpacing: '-0.02em',
              }}
            >
              Riff
            </h3>
            <ul className="mt-4 space-y-2.5" style={{ listStyle: 'none', padding: 0 }}>
              <Win text="ราคาไม่ถึง 1/30 ของ agency" />
              <Win text="หา idea ดัง ๆ ในนิชคุณให้อัตโนมัติ" />
              <Win text="เขียนในเสียงคุณ (ไม่ใช่ AI generic)" />
              <Win text="ใช้ 5 นาที ต่อ 1 โพสต์" />
              <Win text="ครอบคลุม FB / IG / Reels / YT" />
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        .comparison-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        @media (max-width: 1100px) { .comparison-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .comparison-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  )
}

function PainPoint({ text }: { text: string }) {
  return (
    <li
      className="font-thai flex items-start gap-2 text-[var(--rm-muted)]"
      style={{ fontSize: 15, lineHeight: 1.5 }}
    >
      <span style={{ color: 'rgba(239,68,68,0.7)', flexShrink: 0 }}>✗</span>
      <span>{text}</span>
    </li>
  )
}

function Win({ text }: { text: string }) {
  return (
    <li
      className="font-thai flex items-start gap-2"
      style={{
        fontSize: 15,
        lineHeight: 1.5,
        color: 'var(--rm-text)',
      }}
    >
      <span style={{ color: 'var(--rm-accent)', flexShrink: 0, fontWeight: 700 }}>
        ✓
      </span>
      <span>{text}</span>
    </li>
  )
}
