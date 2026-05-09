'use client'

import { useState } from 'react'

const ITEMS = [
  {
    q: 'Riff ใช้ AI ตัวไหน?',
    a: 'Riff ใช้ frontier models ผสมกัน (Claude สำหรับ rewriting, Whisper สำหรับ transcript, custom embedding model สำหรับ voice match). คุณไม่ต้องใส่ API key — รวมอยู่ใน subscription. หรือถ้าอยาก BYOK ก็ paste key ของตัวเองได้ใน Settings.',
  },
  {
    q: 'Voice ของผมจะเหมือนจริงแค่ไหน?',
    a: 'หลัง train ด้วย content เก่าของคุณ 20+ posts, average match score อยู่ที่ ~91%. แต่ output ทุกครั้งสามารถ edit ได้ใน vault — Riff ออกแบบมาเป็น first draft ที่เกือบ ship ได้ ไม่ใช่ final draft.',
  },
  {
    q: 'รองรับภาษาอะไรบ้าง?',
    a: 'ตอน MVP รองรับ Thai ↔ English เต็มรูปแบบ (input + output ทั้ง 2 ทิศทาง). ภาษาอื่น (ID, VI, JA) อยู่ใน roadmap Q3 2026.',
  },
  {
    q: 'ทำไมถึงเป็น YouTube only ตอนเริ่ม?',
    a: 'YouTube มี structured metadata (subs, views, transcripts) ที่ทำให้ Outlier Score คำนวณได้แม่น. TikTok + IG มีเร็วๆ นี้ แต่จะไม่มี transcript-level recreation จนกว่า platform API จะเปิด.',
  },
  {
    q: 'Pricing เท่าไหร่ตอน launch?',
    a: 'Public pricing ยังไม่ประกาศ. Waitlist members lock ใน early-creator rate (~50% ถูกกว่า public price) ตลอด first year. ไม่มี free tier — Riff สำหรับ creator ที่ ship จริง.',
  },
  {
    q: 'Data ของผมปลอดภัยไหม?',
    a: 'Voice profile + drafts ของคุณ encrypt at rest. ไม่ถูกใช้ train shared models. Delete account = hard delete ทุก data ภายใน 24 ชม.',
  },
  {
    q: 'Outlier Score คำนวณยังไง?',
    a: 'Views ÷ Subscribers, ปรับด้วย video age curve (video ใหม่ score คำนวณกับ projected views, ไม่ใช่ current). 5 tiers: <1 (below avg) → >10 (mega viral).',
  },
  {
    q: 'ใช้ได้กับ team ไหม?',
    a: 'Solo plan ตอน launch. Team workspace (shared voice profiles, role-based access, billing) coming Q2 2026 — บน same waitlist.',
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
            FAQ
          </div>
          <h2
            className="font-display mt-3.5"
            style={{
              fontSize: 'clamp(28px, 3.6vw, 44px)',
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: '-0.025em',
              textWrap: 'balance' as const,
            }}
          >
            Questions,{' '}
            <span style={{ color: 'var(--rm-accent)' }}>answered.</span>
          </h2>
          <p
            className="font-thai mt-3.5 text-[var(--rm-muted)]"
            style={{ fontSize: 15.5, lineHeight: 1.55 }}
          >
            ยังไม่เจอคำตอบ? ส่ง email มาที่{' '}
            <a
              href="mailto:hi@outlieragency.co"
              className="no-underline"
              style={{ color: 'var(--rm-accent)' }}
            >
              hi@outlieragency.co
            </a>{' '}
            — Earth ตอบเอง.
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
                  maxHeight: open === i ? 300 : 0,
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
