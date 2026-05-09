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
            Riff คืออะไร
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
            ทีม content 5 คน{' '}
            <span style={{ color: 'var(--rm-accent)' }}>
              ในราคา 990 บาท/เดือน
            </span>
          </h2>
          <p
            className="mt-5 text-[var(--rm-muted)]"
            style={{ fontSize: 'clamp(16px, 1.4vw, 18px)', lineHeight: 1.6 }}
          >
            agency ดี ๆ คิด 30,000-100,000 บาท/เดือน Riff = ทุกอย่างที่ agency ทำ
            (หา idea, เขียน, แปล, ทำปก, จัด format) รวมในเครื่องเดียว
            ราคาเท่ากาแฟวันละแก้ว ทำงานให้ 24 ชั่วโมงไม่หยุด
          </p>
        </div>

        {/* 3-step engine */}
        <div className="grid gap-5 engine-grid">
          <EngineStep
            num="1"
            emoji="🔍"
            title="หา"
            subtitle="วิดีโอที่ดังจริงในนิชคุณ"
            body="แค่วาง URL channel ที่คุณดูอยู่แล้ว Riff scan ทุก video ใน 90 วันที่ผ่านมา จัดเรียงให้ตาม Outlier Score แล้วบอกตัวไหนคือ ‘ตัวที่ปัง’ จริง ๆ ไม่ต้องเดาเอง"
            accent="#fdba74"
          />
          <EngineStep
            num="2"
            emoji="🎙"
            title="แปลง"
            subtitle="เป็นโพสต์ในเสียงคุณ"
            body="AI อ่าน transcript สรุปประเด็น เขียนใหม่ในเสียงคุณ (เรียนจาก post เก่าของคุณ) เลือกได้ FB post / IG carousel / Reels script / YT script ใช้เวลา 90 วินาที"
            accent="#FF6B35"
          />
          <EngineStep
            num="3"
            emoji="🚀"
            title="ลง"
            subtitle="พร้อมลงทันที"
            body="Edit นิดหน่อย copy ไปลง social หรือ push เข้า Notion 1 video = 4 โพสต์ ลงครบทุก platform ในวันเดียว"
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
            className="text-[var(--rm-text)]"
            style={{ fontSize: 'clamp(16px, 1.4vw, 19px)', lineHeight: 1.55, fontWeight: 500 }}
          >
            <span style={{ color: 'var(--rm-accent)' }}>เห็นภาพชัด:</span>{' '}
            มี <strong>นักวิจัย</strong> หา trend ให้ +{' '}
            <strong>นักเขียน</strong> ที่เขียนเหมือนคุณ +{' '}
            <strong>designer</strong> ที่ทำปกให้ รวมในเครื่องเดียว
          </p>
          <p
            className="mt-2 text-[var(--rm-muted)]"
            style={{ fontSize: 14 }}
          >
            จาก 4 ชั่วโมง/โพสต์ เหลือ 5 นาที ลงได้ทุกวัน ตลอดทั้งปี
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
