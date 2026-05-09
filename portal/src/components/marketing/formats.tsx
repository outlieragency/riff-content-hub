'use client'

import { useState } from 'react'

type Format = {
  icon: string
  color: string
  name: string
  id: 'yt' | 'fb' | 'rl' | 'ig'
  desc: string
  sample: React.ReactNode
  tags: string[]
}

const FORMATS: Format[] = [
  {
    icon: '📺',
    color: '#ff4747',
    name: 'YouTube Script',
    id: 'yt',
    desc: 'Outline + script เต็ม + 5 title + brief ปก thumbnail',
    sample: (
      <div>
        <div
          className="font-mono text-[var(--rm-muted-2)]"
          style={{ fontSize: 10 }}
        >
          {'// 5 TITLES'}
        </div>
        <div className="font-thai mt-1" style={{ fontSize: 13 }}>
          1. ทำไมคนไทย 90% ตกหลุมพรางนี้
          <br />
          2. The 1 thing rich Thai families teach…
          <br />
          <span className="text-[var(--rm-muted-2)]">
            3. Why nobody talks about this gap…
          </span>
        </div>
        <div
          className="font-mono mt-2.5 text-[var(--rm-muted-2)]"
          style={{ fontSize: 10 }}
        >
          {'// HOOK (0:00–0:08)'}
        </div>
        <div className="font-thai mt-1 italic" style={{ fontSize: 13 }}>
          &ldquo;ถ้าคุณยัง scroll อยู่ตอนนี้ — มี 1
          ประโยคที่จะเปลี่ยนวิธีคิดของคุณภายใน 8 วินาที&rdquo;
        </div>
      </div>
    ),
    tags: ['Outline', 'Full script', '5 titles', 'Thumbnail brief'],
  },
  {
    icon: '📘',
    color: '#1577ff',
    name: 'Facebook Post',
    id: 'fb',
    desc: 'Post ยาว 800–1,500 คำ จังหวะภาษาไทยเป็นธรรมชาติ',
    sample: (
      <div>
        <div className="font-thai" style={{ fontSize: 13.5, lineHeight: 1.65 }}>
          <strong>Outlier = Reach beyond your fans.</strong>
          <br />
          <br />
          ผมเคยเชื่อว่า viral = lucky.
          <br />
          แต่หลังดู video 2,400 ตัว — มันไม่ใช่.
          <br />
          <br />
          มันคือ <em>signal</em> ที่บอกว่า creator คนนี้แตะถึงอะไรบางอย่างที่ใหญ่กว่า audience ของตัวเอง...
        </div>
        <div
          className="font-mono mt-2.5 text-[var(--rm-muted-2)]"
          style={{ fontSize: 10 }}
        >
          1,247 / 1,500 words
        </div>
      </div>
    ),
    tags: ['Hook', 'Body', 'CTA', 'Hashtags'],
  },
  {
    icon: '📱',
    color: '#e1306c',
    name: 'Reels Script',
    id: 'rl',
    desc: 'Hook 5 วิ + Body 30–50 วิ + CTA 5 วิ ระบุจังหวะให้ครบ',
    sample: (
      <div className="flex flex-col gap-2">
        {[
          { t: 'HOOK · 0–5s', c: 'ถ้าคุณคิดว่า viral = lucky — คุณคิดผิด', col: '#FF6B35' },
          { t: 'BODY · 5–35s', c: 'Outlier Score คือ formula ที่ agency ใช้จริง…', col: '#86efac' },
          { t: 'CTA · 35–40s', c: 'Save นี้ไว้ก่อนคุณลืม. Follow เพิ่มเติม.', col: '#fdba74' },
        ].map((b, i) => (
          <div key={i} style={{ borderLeft: `2px solid ${b.col}`, paddingLeft: 10 }}>
            <div
              className="font-mono text-[var(--rm-muted-2)]"
              style={{ fontSize: 9.5, letterSpacing: '0.1em' }}
            >
              {b.t}
            </div>
            <div className="font-thai mt-0.5" style={{ fontSize: 12.5 }}>
              {b.c}
            </div>
          </div>
        ))}
      </div>
    ),
    tags: ['Hook', 'Body', 'CTA', 'Captions'],
  },
  {
    icon: '🎴',
    color: '#7d2ae8',
    name: 'IG Carousel',
    id: 'ig',
    desc: 'Slide พร้อม copy ครบ ลากใส่ template ลงได้เลย',
    sample: (
      <div className="flex gap-1.5 overflow-hidden">
        {[
          { n: '01', t: 'หยุด scroll.', s: '1 fact คุณไม่เคยรู้' },
          { n: '02', t: 'Outlier =', s: 'Reach beyond your fans' },
          { n: '03', t: 'Formula', s: 'Views ÷ Subscribers' },
          { n: '04', t: 'Save this.', s: 'Follow @earthrati' },
        ].map((s, i) => (
          <div
            key={i}
            className="flex-1 rounded-md border flex flex-col justify-between p-1.5"
            style={{
              aspectRatio: '4 / 5',
              background: i === 0 ? 'var(--rm-accent)' : 'var(--rm-surface-2)',
              color: i === 0 ? '#1a0a04' : 'var(--rm-text)',
              borderColor: 'var(--rm-border-2)',
            }}
          >
            <div className="font-mono opacity-60" style={{ fontSize: 8 }}>
              {s.n}
            </div>
            <div>
              <div
                className="font-display"
                style={{ fontWeight: 700, fontSize: 11, lineHeight: 1.1 }}
              >
                {s.t}
              </div>
              <div
                className="font-thai opacity-75 mt-0.5"
                style={{ fontSize: 8.5 }}
              >
                {s.s}
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
    tags: ['4–10 slides', 'Cover hook', 'Body', 'CTA slide'],
  },
]

export function Formats() {
  const [active, setActive] = useState<Format['id']>('yt')

  return (
    <section className="rm-section">
      <div className="rm-container">
        <div style={{ maxWidth: 760, marginBottom: 48 }}>
          <div className="rm-eyebrow">
            <span className="dot" />
            ผลลัพธ์ที่ได้
          </div>
          <h2
            className="font-thai mt-3.5"
            style={{
              fontSize: 'clamp(28px, 4.4vw, 48px)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              textWrap: 'balance' as const,
            }}
          >
            1 video <span style={{ color: 'var(--rm-accent)' }}>= 4 โพสต์</span> ลงทุก platform
          </h2>
          <p
            className="font-thai mt-4 text-[var(--rm-muted)]"
            style={{ fontSize: 'clamp(15px, 1.4vw, 18px)', lineHeight: 1.55 }}
          >
            แต่ละ format Riff เขียนแยกตาม platform จริง ไม่ใช่แค่ตัด post ยาวให้สั้นลง
            FB ก็เป็น FB · Reels ก็เป็น Reels · YT ก็เป็น YT · IG ก็เป็น IG
          </p>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className="font-display"
              style={{
                cursor: 'pointer',
                border: '1px solid var(--rm-border-2)',
                background: active === f.id ? 'var(--rm-surface)' : 'transparent',
                color: active === f.id ? 'var(--rm-text)' : 'var(--rm-muted)',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: active === f.id ? '0 0 0 1px var(--rm-accent)' : 'none',
                transition: 'all .15s',
              }}
            >
              <span style={{ fontSize: 14 }}>{f.icon}</span> {f.name}
            </button>
          ))}
        </div>

        <div className="grid gap-4 format-grid">
          {FORMATS.map((f) => (
            <div
              key={f.id}
              className="rm-card rm-card-glow"
              style={{
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                borderColor:
                  active === f.id ? 'var(--rm-accent)' : 'var(--rm-border)',
                boxShadow:
                  active === f.id
                    ? '0 0 0 1px var(--rm-accent), 0 24px 60px -30px var(--rm-accent-glow)'
                    : 'none',
                transition: 'all .25s',
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="rounded-md inline-flex items-center justify-center"
                  style={{
                    width: 36,
                    height: 36,
                    fontSize: 18,
                    background: `${f.color}1a`,
                    border: `1px solid ${f.color}33`,
                  }}
                >
                  {f.icon}
                </span>
                <span
                  className="font-mono text-[var(--rm-muted-2)]"
                  style={{ fontSize: 10 }}
                >
                  {f.id.toUpperCase()}
                </span>
              </div>
              <div>
                <div
                  className="font-display"
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {f.name}
                </div>
                <div
                  className="font-thai mt-1 text-[var(--rm-muted)]"
                  style={{ fontSize: 12.5, lineHeight: 1.5 }}
                >
                  {f.desc}
                </div>
              </div>
              <div
                className="rounded-lg p-3 text-[var(--rm-muted)]"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--rm-border)',
                  minHeight: 180,
                  fontSize: 12.5,
                }}
              >
                {f.sample}
              </div>
              <div className="flex gap-1 flex-wrap">
                {f.tags.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[var(--rm-muted)]"
                    style={{
                      fontSize: 10,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.04)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .format-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        @media (max-width: 1100px) { .format-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .format-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  )
}
