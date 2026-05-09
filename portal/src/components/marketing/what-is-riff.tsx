/**
 * "Riff คืออะไร" — Mechanism explained with simple Thai + concrete metaphor.
 * Comes RIGHT after Hero so visitors immediately understand what the product is.
 */
export function WhatIsRiff() {
  return (
    <section
      id="what"
      className="rm-section relative"
      style={{
        background:
          'linear-gradient(180deg, transparent, rgba(255,107,53,0.025) 50%, transparent)',
      }}
    >
      <div className="rm-container">
        <div style={{ maxWidth: 760, marginBottom: 48 }}>
          <div className="rm-eyebrow">
            <span className="dot" />
            RIFF คืออะไร
          </div>
          <h2
            className="font-thai mt-3.5"
            style={{
              fontSize: 'clamp(28px, 4.4vw, 48px)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              textWrap: 'balance' as const,
            }}
          >
            คิดถึง Riff เหมือน <br className="show-mobile" />
            <span style={{ color: 'var(--rm-accent)', fontStyle: 'italic' }}>
              ผู้ช่วย content ส่วนตัว
            </span>{' '}
            ที่ทำงาน 24 ชม.
          </h2>
          <p
            className="font-thai mt-5 text-[var(--rm-muted)]"
            style={{ fontSize: 'clamp(16px, 1.4vw, 18px)', lineHeight: 1.6 }}
          >
            เคยใฝ่ฝันว่ามีทีม content เก่ง ๆ แต่จ้าง agency เดือนละ 30K-100K บาท?
            Riff = ทีมแบบนั้น ในราคาแค่ค่ากาแฟต่อเดือน.
          </p>
        </div>

        {/* 3-step engine */}
        <div className="grid gap-5 engine-grid">
          <EngineStep
            num="1"
            emoji="🔍"
            title="หา"
            subtitle="content ดัง ๆ ในนิชของคุณ"
            body="แค่เพิ่ม YouTube channel ที่คุณดูอยู่แล้ว Riff scan ทุก video ใน 90 วันที่ผ่านมา แล้วบอกตัวไหนคือ ‘ตัวที่ปังจริง’ ที่ดังเกิน fan base ของคนทำเอง"
            accent="#fdba74"
          />
          <EngineStep
            num="2"
            emoji="🎙"
            title="แปลง"
            subtitle="เป็นโพสต์ในเสียงคุณ"
            body="AI อ่าน transcript ของ video สรุปประเด็น เขียนใหม่ในแบบคุณ (ไม่ใช่ AI generic) เลือก format: FB post / IG carousel / Reels / YouTube script"
            accent="#FF6B35"
          />
          <EngineStep
            num="3"
            emoji="🚀"
            title="ลง"
            subtitle="ได้ภายใน 5 นาที"
            body="Edit นิดหน่อยแล้ว copy ไป post ลง social หรือ push ตรงเข้า Notion 1 ความคิด = 4 platform = ครอบคลุมทั้ง audience"
            accent="#86efac"
          />
        </div>

        {/* Bottom synth */}
        <div
          className="mt-10 rounded-[14px] p-6 text-center"
          style={{
            background: 'var(--rm-surface)',
            border: '1px solid var(--rm-border)',
          }}
        >
          <p
            className="font-thai text-[var(--rm-text)]"
            style={{ fontSize: 'clamp(16px, 1.4vw, 19px)', lineHeight: 1.55 }}
          >
            <span style={{ color: 'var(--rm-accent)' }}>เห็นภาพชัด:</span>{' '}
            เหมือนมี <strong>นักวิจัย</strong> หา trend ให้ +{' '}
            <strong>นักเขียน</strong> ที่เขียนเหมือนคุณ + <strong>designer</strong>{' '}
            ที่ทำ cover ให้ รวมเป็น tool เดียว
          </p>
          <p
            className="font-thai mt-2 text-[var(--rm-muted)]"
            style={{ fontSize: 14 }}
          >
            แทนที่จะใช้เวลา 4 ชม. ต่อ 1 โพสต์ ใช้แค่ 5 นาที ลงได้ทุกวัน
          </p>
        </div>
      </div>

      <style>{`
        .engine-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        @media (max-width: 900px) {
          .engine-grid { grid-template-columns: 1fr; }
        }
        .show-mobile { display: none; }
        @media (max-width: 640px) { .show-mobile { display: inline; } }
      `}</style>
    </section>
  )
}

function EngineStep({
  num,
  emoji,
  title,
  subtitle,
  body,
  accent,
}: {
  num: string
  emoji: string
  title: string
  subtitle: string
  body: string
  accent: string
}) {
  return (
    <div
      className="rm-card p-6"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center justify-center rounded-[10px]"
          style={{
            width: 44,
            height: 44,
            background: `${accent}15`,
            border: `1px solid ${accent}30`,
            fontSize: 22,
          }}
        >
          {emoji}
        </div>
        <div>
          <div
            className="font-mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              color: 'var(--rm-muted-2)',
            }}
          >
            ขั้นที่ {num}
          </div>
          <div
            className="font-display"
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--rm-text)',
            }}
          >
            {title}
            <span
              className="font-thai font-normal text-[var(--rm-muted)]"
              style={{ fontSize: 14, marginLeft: 8 }}
            >
              {subtitle}
            </span>
          </div>
        </div>
      </div>
      <p
        className="font-thai text-[var(--rm-muted)]"
        style={{ fontSize: 14.5, lineHeight: 1.6 }}
      >
        {body}
      </p>
    </div>
  )
}
