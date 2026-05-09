import { RiffMark } from './logo'

const TOOLS = [
  { n: 'YouTube', c: '#ff4747' },
  { n: 'Notion', c: '#ffffff' },
  { n: 'ChatGPT', c: '#10a37f' },
  { n: 'DeepL', c: '#1577ff' },
  { n: 'Canva', c: '#7d2ae8' },
  { n: 'Buffer', c: '#168eea' },
]

const TOOL_POSITIONS = [
  { x: 0, y: 10 },
  { x: 50, y: 0 },
  { x: 30, y: 80 },
  { x: 70, y: 90 },
  { x: 5, y: 160 },
  { x: 60, y: 170 },
]

const ARROWS = [
  'M40,40 C90,80 140,20 180,30',
  'M210,40 C240,90 220,130 150,120',
  'M150,140 C100,180 60,160 30,200',
  'M70,210 C160,200 240,210 280,210',
  'M290,210 C320,160 280,90 250,40',
  'M250,40 C200,40 70,80 40,40',
]

const CAPABILITIES = [
  'หา outlier',
  'transcript',
  'แปล TH/EN',
  'voice ของคุณ',
  '4 formats',
  'cover ปก',
  'export',
]

export function Problem() {
  return (
    <section id="features" className="rm-section">
      <div className="rm-container">
        <div style={{ maxWidth: 760, marginBottom: 48 }}>
          <div className="rm-eyebrow">
            <span className="dot" />
            ปัญหาที่คุณเจออยู่
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
            ทำ content คนเดียว{' '}
            <span style={{ color: 'var(--rm-accent)', fontStyle: 'italic' }}>
              เหนื่อยจน burn out
            </span>{' '}
            ใช่ไหม?
          </h2>
          <p
            className="font-thai mt-4 text-[var(--rm-muted)]"
            style={{ fontSize: 'clamp(16px, 1.4vw, 18px)', lineHeight: 1.55 }}
          >
            อยากลง content ทุกวันเพื่อโต — แต่เปิด tab 6 อย่าง คิดไอเดีย 1
            ชั่วโมง เขียน 2 ชั่วโมง ทำภาพอีก 30 นาที. กว่าจะลง 1 โพสต์ =
            ครึ่งวัน. ทำ 1 อาทิตย์ก็หมดแรง.
          </p>
        </div>

        <div className="grid gap-6 problem-grid">
          {/* Messy */}
          <div className="rm-card relative overflow-hidden p-7">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, rgba(239,68,68,0.06), transparent 60%)',
              }}
            />
            <div className="relative">
              <div
                className="font-mono uppercase"
                style={{
                  color: 'rgba(239,68,68,0.7)',
                  fontSize: 12,
                  letterSpacing: '0.14em',
                }}
              >
                ทุกวันนี้ — 6 tools, 4 ชั่วโมง, 1 โพสต์
              </div>
              <h3
                className="font-thai mt-2 mb-6 text-[var(--rm-muted)]"
                style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}
              >
                สลับ tab ไปมา จนลืมว่าตัวเองเขียนยังไง
              </h3>

              <div className="relative" style={{ height: 240 }}>
                {TOOLS.map((t, i) => {
                  const p = TOOL_POSITIONS[i]
                  return (
                    <div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${p.x}%`,
                        top: p.y,
                        transform: `rotate(${(i % 2 ? 1 : -1) * (i + 2)}deg)`,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: `1px solid ${t.c}33`,
                        background: 'var(--rm-surface-2)',
                        fontFamily: 'Inter Tight, sans-serif',
                        fontSize: 13,
                        fontWeight: 600,
                        color: t.c,
                        boxShadow: '0 8px 24px -10px rgba(0,0,0,0.6)',
                      }}
                    >
                      {t.n}
                    </div>
                  )
                })}
                <svg
                  viewBox="0 0 400 240"
                  className="absolute inset-0 w-full h-full"
                  style={{ opacity: 0.35 }}
                >
                  <defs>
                    <marker
                      id="arr"
                      markerWidth="6"
                      markerHeight="6"
                      refX="5"
                      refY="3"
                      orient="auto"
                    >
                      <path d="M0,0 L0,6 L6,3 z" fill="#8a938a" />
                    </marker>
                  </defs>
                  {ARROWS.map((d, i) => (
                    <path
                      key={i}
                      d={d}
                      stroke="#8a938a"
                      strokeWidth="1.2"
                      fill="none"
                      strokeDasharray="2 4"
                      markerEnd="url(#arr)"
                    />
                  ))}
                </svg>
              </div>

              <div
                className="font-mono mt-2 pt-3.5 border-t border-dashed text-[var(--rm-muted-2)]"
                style={{ fontSize: 12, borderColor: 'var(--rm-border-2)' }}
              >
                ⏱ เฉลี่ย 4 ชม./โพสต์ · สลับ tab 47 ครั้ง · ลืมไอเดียไป 3 อย่าง
              </div>
            </div>
          </div>

          {/* Clean */}
          <div className="rm-card rm-glow-accent relative overflow-hidden p-7">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, rgba(255,107,53,0.08), transparent 60%)',
              }}
            />
            <div className="relative">
              <div
                className="font-mono uppercase"
                style={{
                  color: 'var(--rm-accent)',
                  fontSize: 12,
                  letterSpacing: '0.14em',
                }}
              >
                ใช้ Riff — 1 tool, 5 นาที, 1 โพสต์
              </div>
              <h3
                className="font-thai mt-2 mb-6"
                style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}
              >
                เห็น idea, click, ได้ post —{' '}
                <span style={{ color: 'var(--rm-accent)' }}>ในเสียงคุณ</span>
              </h3>

              <div
                className="flex flex-col items-center justify-center gap-5"
                style={{ height: 240 }}
              >
                <div
                  className="rounded-[22px] flex items-center justify-center overflow-hidden"
                  style={{
                    width: 96,
                    height: 96,
                    boxShadow:
                      '0 0 0 1px rgba(255,107,53,0.3), 0 0 80px var(--rm-accent-glow)',
                  }}
                >
                  <RiffMark size={96} />
                </div>
                <div className="flex gap-2 flex-wrap justify-center" style={{ maxWidth: 320 }}>
                  {CAPABILITIES.map((t) => (
                    <span
                      key={t}
                      className="font-thai font-mono text-[var(--rm-muted)]"
                      style={{
                        fontSize: 11,
                        padding: '4px 9px',
                        borderRadius: 999,
                        border: '1px solid var(--rm-border-2)',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className="font-mono mt-2 pt-3.5 border-t border-dashed text-[var(--rm-muted-2)]"
                style={{ fontSize: 12, borderColor: 'var(--rm-border-2)' }}
              >
                ⏱ 5 นาที/โพสต์ · ไม่ต้องสลับ tab · ไอเดียบันทึกอัตโนมัติ
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .problem-grid { grid-template-columns: 1fr 1fr; }
        @media (max-width: 900px) { .problem-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  )
}
