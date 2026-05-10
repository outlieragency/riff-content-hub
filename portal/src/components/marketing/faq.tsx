'use client'

import { useState } from 'react'

const ITEMS = [
  {
    q: 'แล้วมันทำงานยังไงสั้น ๆ',
    a: 'ใส่ URL channel ที่อยาก follow ระบบ scan ให้ ตัวที่ดังเกินค่าเฉลี่ย channel จะขึ้น feed กด save ตัวที่ชอบ AI จะอ่าน transcript แปลไทย สรุปประเด็น แล้วเขียนใหม่เป็น FB/IG/Reels/YT ในเสียงของคุณ พร้อมทำปกให้',
  },
  {
    q: 'AI เขียนเหมือนผมจริง ๆ เหรอ',
    a: 'มันอ่าน post เก่าของคุณ จับจังหวะประโยค คำที่ใช้ซ้ำ วิธีปิดประโยค สไตล์เปิดเรื่อง แล้วเขียนใหม่ในแบบเดียวกัน ทุก draft แก้ได้ ออกแบบให้เป็น first draft ที่เกือบลงได้เลย ไม่ใช่ final draft',
  },
  {
    q: 'ผมไม่ใช่ creator ผมเป็น founder ใช้ได้ไหม',
    a: 'ใช่กลุ่มหลักเลย Riff ออกแบบให้ founder ที่ทำธุรกิจ digital product, course, coaching ใช้สร้าง content ทุกวัน เพื่อขายของ ไม่ใช่เพื่อเป็น influencer คุณไม่ต้องลงเอง ลงผ่าน team ก็ได้',
  },
  {
    q: 'รองรับภาษาอะไรบ้าง',
    a: 'ไทยกับอังกฤษเต็มรูปแบบ video EN แปลไทยได้ video TH เขียน EN ก็ได้ ภาษาอื่นยังไม่รองรับ',
  },
  {
    q: 'ทำไมเริ่มจาก YouTube',
    a: 'YouTube มี data ครบ subscriber, views, transcript ทำให้คำนวณ Outlier Score ได้แม่นพอ TikTok กับ IG ยังไม่เริ่มเพราะ data ฝั่งนั้นยังขลุกขลัก',
  },
  {
    q: 'ตอนนี้ใช้ฟรีหรือเปล่า',
    a: 'ช่วงนี้เปิดให้ founder ไทยทดลองใช้ฟรีก่อน เก็บ feedback ไปเรื่อย ๆ ราคาจะประกาศหลังเปิดให้ใช้กว้างขึ้น คนที่อยู่ใน waitlist ก่อน จะได้ early lock ที่ราคาดีที่สุดเสมอ',
  },
  {
    q: 'ข้อมูลผมปลอดภัยไหม',
    a: 'voice profile กับ draft ทุกตัว encrypt ไว้ ไม่ถูกเอาไป train shared model ถ้าลบ account ลบหมดภายใน 24 ชม.',
  },
  {
    q: 'Outlier Score คำนวณยังไง',
    a: 'views ÷ subscribers ปรับด้วยอายุของ video score 1.0 = ดังตามค่าเฉลี่ย channel ตัวเอง 5.0 ขึ้นไป = reach ออกนอกฐานแฟน 10+ คือ mega viral',
  },
  {
    q: 'ใช้กับทีมได้ไหม',
    a: 'Studio plan รองรับสูงสุด 5 คน Team workspace แบบเต็ม (share voice, แบ่ง role) จะมาช่วงกลางปีนี้ ใช้ waitlist เดียวกัน',
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
              fontSize: 'clamp(28px, 3.6vw, 40px)',
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              textWrap: 'balance' as const,
            }}
          >
            คำถามที่{' '}
            <span className="rm-serif-italic">คนถามผมบ่อย.</span>
          </h2>
          <p
            className="mt-3.5 text-[var(--rm-muted)]"
            style={{ fontSize: 15.5, lineHeight: 1.6 }}
          >
            ยังไม่ตรงคำถาม? ส่ง email มาที่{' '}
            <a
              href="mailto:hi@outlieragency.co"
              className="no-underline"
              style={{ color: 'var(--rm-accent)', fontWeight: 500 }}
            >
              hi@outlieragency.co
            </a>{' '}
            ผมตอบเอง
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
