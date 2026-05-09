'use client'

import { useState } from 'react'

const ITEMS = [
  {
    q: 'Riff ทำงานยังไง สั้นๆ',
    a: 'คุณวาง URL channel YouTube ที่อยาก follow Riff scan ทุก video หา outlier ที่ดังเกินค่าเฉลี่ย คุณกด save video ที่ชอบ AI จะอ่าน transcript แปลไทย สรุป แล้วเขียนใหม่เป็น FB/IG/Reels/YT ในเสียงของคุณ ภายใน 90 วินาที',
  },
  {
    q: 'AI จะเขียนเหมือนผมจริงๆ ไหม',
    a: 'Riff อ่าน post เก่าของคุณ 20+ ชิ้น แล้วเรียนวิธีเขียน จังหวะประโยค คำที่คุณใช้บ่อย match เฉลี่ย 91%. ทุก draft แก้ได้ ออกแบบให้เป็น first draft ที่เกือบลงได้เลย ไม่ใช่ final draft',
  },
  {
    q: 'รองรับภาษาอะไร',
    a: 'ตอนนี้รองรับไทย กับ อังกฤษ เต็มรูปแบบ video EN ก็แปลเป็น TH ได้ video TH ก็เขียน EN ได้',
  },
  {
    q: 'ทำไมเริ่มจาก YouTube ก่อน',
    a: 'YouTube มี data ครบ subscriber count, views, transcript ทำให้คำนวณ Outlier Score ได้แม่น TikTok กับ IG มาตามทีหลัง',
  },
  {
    q: 'ราคาเท่าไหร่',
    a: 'ยังไม่เปิด public pricing คนใน waitlist จะได้ early-creator rate ถูกกว่า public ~50% ตลอดปีแรก ไม่มี free tier เพราะออกแบบให้คนทำ content จริงๆ ใช้',
  },
  {
    q: 'ข้อมูลผมปลอดภัยไหม',
    a: 'Voice profile กับ draft ของคุณ encrypt ไม่เอาไป train shared model ลบ account = ลบทุกอย่างภายใน 24 ชม',
  },
  {
    q: 'Outlier Score คำนวณยังไง',
    a: 'เอา views หาร subscribers ปรับด้วยอายุ video score 1.0 = ดังตามค่าเฉลี่ย channel score 5.0 ขึ้นไป = video ที่ reach ออกนอกฐานแฟนชัดเจน',
  },
  {
    q: 'ใช้กับทีมได้ไหม',
    a: 'ตอนนี้ solo plan ก่อน Team workspace (share voice profile, แบ่ง role) มาช่วงกลางปี 2026 ใช้ waitlist เดียวกัน',
  },
]

export function FAQ() {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className="rm-section">
      <div className="rm-container grid gap-16 faq-grid">
        <div>
          <div className="rm-eyebrow">
            <span className="dot" />
            คำถามที่พบบ่อย
          </div>
          <h2
            className="mt-3.5"
            style={{
              fontSize: 'clamp(26px, 3.6vw, 38px)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              textWrap: 'balance' as const,
            }}
          >
            ก่อนตัดสินใจ{' '}
            <span style={{ color: 'var(--rm-accent)' }}>เช็คให้ชัวร์</span>
          </h2>
          <p
            className="font-thai mt-3.5 text-[var(--rm-muted)]"
            style={{ fontSize: 15.5, lineHeight: 1.55 }}
          >
            ยังไม่เจอคำตอบที่ตรงใจ? ส่ง email มาที่{' '}
            <a
              href="mailto:hi@outlieragency.co"
              className="no-underline"
              style={{ color: 'var(--rm-accent)' }}
            >
              hi@outlieragency.co
            </a>{' '}
            ตอบเองทุกฉบับ
          </p>
        </div>

        <div>
          {ITEMS.map((it, i) => (
            <div
              key={i}
              style={{
                borderTop: i === 0 ? '1px solid var(--rm-border)' : 'none',
                borderBottom: '1px solid var(--rm-border)',
              }}
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full flex justify-between items-center text-left"
                style={{
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  padding: '20px 4px',
                  color: 'var(--rm-text)',
                }}
              >
                <span
                  className="font-thai"
                  style={{ fontSize: 17, fontWeight: 500 }}
                >
                  {it.q}
                </span>
                <span
                  className="font-mono"
                  style={{
                    color: 'var(--rm-accent)',
                    fontSize: 18,
                    transition: 'transform .25s',
                    transform: open === i ? 'rotate(45deg)' : 'rotate(0)',
                  }}
                >
                  +
                </span>
              </button>
              <div
                style={{
                  maxHeight: open === i ? 500 : 0,
                  overflow: 'hidden',
                  transition: 'max-height .3s ease',
                }}
              >
                <div
                  className="font-thai text-[var(--rm-muted)]"
                  style={{
                    padding: '0 4px 22px',
                    fontSize: 15,
                    lineHeight: 1.6,
                    maxWidth: 640,
                  }}
                >
                  {it.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .faq-grid { grid-template-columns: minmax(0, 320px) minmax(0, 1fr); }
        @media (max-width: 900px) { .faq-grid { grid-template-columns: 1fr; gap: 24px; } }
      `}</style>
    </section>
  )
}
