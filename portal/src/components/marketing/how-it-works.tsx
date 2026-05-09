const STEPS = [
  {
    n: '01',
    k: 'url',
    t: 'เพิ่ม channel',
    th: 'วาง YouTube URL ของ creator ที่อยากตาม Riff จะ scan ทุก video ให้',
  },
  {
    n: '02',
    k: 'outliers',
    t: 'หาตัวดัง',
    th: 'เห็นชัดว่า video ไหนคือตัวที่ปังเกินค่าเฉลี่ย จัดเรียงให้อัตโนมัติ',
  },
  {
    n: '03',
    k: 'save',
    t: 'เก็บไอเดีย',
    th: 'กด save video ที่ชอบ → เข้า Idea Library ของคุณ',
  },
  {
    n: '04',
    k: 'recreate',
    t: 'AI เขียนให้',
    th: 'AI ทำ transcript แปลไทย สรุป แล้วเขียนใหม่ในเสียงคุณ ภายใน 90 วินาที',
  },
  {
    n: '05',
    k: 'publish',
    t: 'ลงเลย',
    th: 'Copy ไป FB/IG/YT หรือ push เข้า Notion ได้เลย พร้อม cover ปก',
  },
] as const

function StepMock({ kind }: { kind: string }) {
  const wrap: React.CSSProperties = {
    width: '100%',
    borderRadius: 10,
    border: '1px solid var(--rm-border)',
    background: 'rgba(0,0,0,0.25)',
    padding: 12,
    fontSize: 13.5,
    color: 'var(--rm-muted)',
    minHeight: 130,
  }

  if (kind === 'url') {
    return (
      <div style={wrap}>
        <div
          className="font-mono uppercase mb-2 text-[var(--rm-muted)]"
          style={{ fontSize: 12, letterSpacing: '0.14em' }}
        >
          PASTE URL
        </div>
        <div className="rm-field" style={{ padding: 4 }}>
          <input
            readOnly
            value="youtube.com/@earthrati"
            style={{ height: 32, fontSize: 13.5 }}
          />
          <button
            className="rm-btn rm-btn-primary rm-btn-sm"
            style={{ height: 32, padding: '0 10px' }}
          >
            Sync
          </button>
        </div>
        <div
          className="font-mono mt-2.5 text-[var(--rm-muted-2)]"
          style={{ fontSize: 12 }}
        >
          ✓ 612 videos · 180.2K subs · synced
        </div>
      </div>
    )
  }
  if (kind === 'outliers') {
    return (
      <div style={wrap}>
        <div
          className="font-mono uppercase mb-2 text-[var(--rm-muted)]"
          style={{ fontSize: 12, letterSpacing: '0.14em' }}
        >
          SORT BY OUTLIER
        </div>
        {[
          { s: 11.7, c: '#fca5a5' },
          { s: 9.2, c: '#fdba74' },
          { s: 5.1, c: '#fdba74' },
          { s: 3.7, c: '#86efac' },
        ].map((row, i) => (
          <div key={i} className="flex items-center gap-2 py-1">
            <span
              className="rm-score-chip"
              style={{
                color: row.c,
                background: `${row.c}10`,
                borderColor: `${row.c}38`,
              }}
            >
              {row.s.toFixed(1)}×
            </span>
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <div
                className="h-full"
                style={{
                  width: `${Math.min(100, row.s * 8)}%`,
                  background: row.c,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (kind === 'save') {
    return (
      <div style={wrap}>
        <div
          className="font-mono uppercase mb-2 text-[var(--rm-muted)]"
          style={{ fontSize: 12, letterSpacing: '0.14em' }}
        >
          IDEA LIBRARY · 23
        </div>
        {['ทำไมคนรวยไม่บอก…', 'I quit my $400K…', 'เลิก scroll 30 วัน'].map(
          (t, i) => (
            <div
              key={i}
              className="flex justify-between items-center py-1.5"
              style={{
                borderBottom: i < 2 ? '1px dashed var(--rm-border)' : 'none',
              }}
            >
              <span className="font-thai text-[var(--rm-text)]" style={{ fontSize: 13 }}>
                {t}
              </span>
              <span style={{ color: 'var(--rm-accent)', fontSize: 13.5 }}>★</span>
            </div>
          ),
        )}
      </div>
    )
  }
  if (kind === 'recreate') {
    return (
      <div style={wrap}>
        <div
          className="font-mono uppercase mb-2 text-[var(--rm-muted)]"
          style={{ fontSize: 12, letterSpacing: '0.14em' }}
        >
          AI RECREATING…
        </div>
        <div className="rm-shimmer-line mb-1.5" />
        <div className="rm-shimmer-line mb-1.5" style={{ width: '85%' }} />
        <div className="rm-shimmer-line mb-2.5" style={{ width: '60%' }} />
        <div className="flex gap-1.5 flex-wrap">
          {['TH ↔ EN', 'voice: Earth', 'format: Reel'].map((t) => (
            <span
              key={t}
              className="font-mono text-[var(--rm-muted)]"
              style={{
                fontSize: 12,
                padding: '2px 6px',
                borderRadius: 4,
                border: '1px solid var(--rm-border-2)',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    )
  }
  if (kind === 'publish') {
    return (
      <div style={wrap}>
        <div
          className="font-mono uppercase mb-2 text-[var(--rm-muted)]"
          style={{ fontSize: 12, letterSpacing: '0.14em' }}
        >
          EXPORT TO
        </div>
        {[
          { i: '🅽', l: 'Notion', s: 'connected' },
          { i: '📋', l: 'Clipboard', s: 'ready' },
          { i: '📘', l: 'Facebook', s: 'draft saved' },
        ].map((x, i) => (
          <div
            key={i}
            className="flex justify-between items-center py-1"
            style={{ fontSize: 13.5 }}
          >
            <span className="text-[var(--rm-text)]">
              {x.i} {x.l}
            </span>
            <span className="font-mono" style={{ fontSize: 12, color: 'var(--rm-success)' }}>
              ✓ {x.s}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function HowItWorks() {
  return (
    <section
      id="how"
      className="rm-section"
      style={{
        background:
          'linear-gradient(180deg, transparent, rgba(255,107,53,0.02), transparent)',
      }}
    >
      <div className="rm-container">
        <div style={{ maxWidth: 760, marginBottom: 56 }}>
          <div className="rm-eyebrow">
            <span className="dot" />
            ใช้ยังไง
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
            5 click จาก URL ถึง{' '}
            <span style={{ color: 'var(--rm-accent)' }}>โพสต์พร้อมลง</span>
          </h2>
          <p
            className="mt-4 text-[var(--rm-muted)]"
            style={{ fontSize: 'clamp(16px, 1.4vw, 18px)', lineHeight: 1.55 }}
          >
            ไม่มี learning curve ดู 1 ครั้ง ใช้เป็นเลย
          </p>
        </div>

        <div className="grid gap-4 how-grid">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="rm-card rm-card-glow flex flex-col gap-2.5 p-4.5"
              style={{ padding: 18 }}
            >
              <div className="flex justify-between items-start">
                <div className="rm-step-num">{s.n}</div>
                <div
                  className="font-mono mt-2 text-[var(--rm-muted-2)]"
                  style={{ fontSize: 12 }}
                >
                  STEP {i + 1}/5
                </div>
              </div>
              <div
                className="font-display"
                style={{
                  fontWeight: 700,
                  fontSize: 19,
                  letterSpacing: '-0.02em',
                }}
              >
                {s.t}
              </div>
              <div
                className="font-thai text-[var(--rm-muted)]"
                style={{ fontSize: 14.5, lineHeight: 1.5, minHeight: 56 }}
              >
                {s.th}
              </div>
              <div className="mt-auto">
                <StepMock kind={s.k} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .how-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
        @media (max-width: 1100px) { .how-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .how-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  )
}
