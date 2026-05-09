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
  'YouTube sync',
  'Outlier scoring',
  'Transcript',
  'TH ↔ EN',
  'Voice rewrite',
  '4 formats',
  'Export',
]

export function Problem() {
  return (
    <section id="features" className="rm-section">
      <div className="rm-container">
        <div style={{ maxWidth: 760, marginBottom: 48 }}>
          <div className="rm-eyebrow">
            <span className="dot" />
            THE PAIN
          </div>
          <h2
            className="font-thai"
            style={{
              fontSize: 'clamp(32px, 4.4vw, 52px)',
              marginTop: 14,
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: '-0.025em',
              textWrap: 'balance' as const,
            }}
          >
            Content workflow ของคุณตอนนี้ดู{' '}
            <span style={{ color: 'var(--rm-accent)', fontStyle: 'italic' }}>
              messy
            </span>{' '}
            หรือเปล่า?
          </h2>
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
                ทุกวันนี้ — 6 tools, 4 hours, 1 post
              </div>
              <h3
                className="font-thai mt-2 mb-6 text-[var(--rm-muted)]"
                style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}
              >
                สลับ tab ไป-มา จนลืม voice ตัวเอง
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
                ⏱ avg. 4h 12m per post · 47 tab switches · 3 lost ideas
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
                ด้วย Riff — 1 tool, 12 minutes, 1 post
              </div>
              <h3
                className="font-thai mt-2 mb-6"
                style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}
              >
                One workflow.{' '}
                <span style={{ color: 'var(--rm-accent)' }}>Your voice.</span>
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
                      className="font-mono text-[var(--rm-muted)]"
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
                ⏱ avg. 12m per post · 0 tab switches · ideas saved automatically
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
