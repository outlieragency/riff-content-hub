/**
 * Stylized dashboard preview for hero — pure CSS/SVG mock so we don't ship
 * heavy screenshots. Swap for a real `app.riff` screenshot when launch.
 */

const MOCK_VIDEOS = [
  { title: 'ทำไมคนรวยถึงไม่บอกเรื่องนี้กับลูก', views: '2.1M', subs: '180K', score: 11.7, dur: '12:04', tone: 1 },
  { title: "I quit my $400K job. Here's what I learned.", views: '847K', subs: '92K', score: 9.2, dur: '08:51', tone: 0 },
  { title: 'เลิก scroll TikTok ใน 30 วัน — ผลที่ได้', views: '612K', subs: '120K', score: 5.1, dur: '14:22', tone: 2 },
  { title: 'Why nobody talks about the obvious thing', views: '289K', subs: '78K', score: 3.7, dur: '06:18', tone: 0 },
  { title: '1 หนังสือที่เปลี่ยนชีวิตผมในปีนี้', views: '184K', subs: '120K', score: 1.5, dur: '09:44', tone: 1 },
  { title: 'How creators actually make money in 2026', views: '98K', subs: '92K', score: 1.1, dur: '11:30', tone: 0 },
]

function scoreTier(s: number) {
  if (s < 1) return { color: '#9aa39a' }
  if (s < 2) return { color: '#93C5FD' }
  if (s < 5) return { color: '#86efac' }
  if (s < 10) return { color: '#fdba74' }
  return { color: '#fca5a5' }
}

function ScoreChip({ score }: { score: number }) {
  const t = scoreTier(score)
  return (
    <span
      className="rm-score-chip"
      style={{ color: t.color, background: `${t.color}10`, borderColor: `${t.color}38` }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: t.color,
          boxShadow: `0 0 8px ${t.color}`,
        }}
      />
      {score.toFixed(score >= 10 ? 0 : 1)}×
    </span>
  )
}

function VideoThumb({
  tone = 0,
  score,
  dur,
}: {
  tone?: number
  score: number
  dur: string
}) {
  const palettes = [
    ['#1d2a1f', '#0e1a14', '#23311e'],
    ['#2a1d18', '#180e0c', '#3b231a'],
    ['#1a1a2a', '#0e0e18', '#1c2030'],
  ]
  const p = palettes[tone % palettes.length]
  return (
    <div
      className="relative border border-[var(--rm-border)] rounded-lg overflow-hidden"
      style={{
        aspectRatio: '16 / 9',
        background: `linear-gradient(135deg, ${p[0]}, ${p[1]} 60%, ${p[2]})`,
      }}
    >
      <div className="absolute left-2 top-2">
        <ScoreChip score={score} />
      </div>
      <div
        className="absolute right-1.5 bottom-1.5 font-mono"
        style={{
          background: 'rgba(0,0,0,0.7)',
          color: '#e8eee8',
          fontSize: 10.5,
          padding: '2px 5px',
          borderRadius: 4,
        }}
      >
        {dur}
      </div>
      <svg
        viewBox="0 0 100 56"
        className="absolute inset-0 w-full h-full opacity-45"
      >
        <circle
          cx={tone === 1 ? 70 : 25}
          cy="28"
          r="14"
          fill="rgba(255,255,255,0.05)"
        />
        <rect x="0" y="40" width="100" height="16" fill="rgba(0,0,0,0.35)" />
      </svg>
    </div>
  )
}

export function DashboardMock() {
  return (
    <div
      className="rounded-[14px] overflow-hidden border border-[var(--rm-border-2)] bg-[var(--rm-surface)]"
      style={{
        boxShadow:
          '0 30px 80px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.02)',
      }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--rm-border)]"
        style={{ background: 'rgba(0,0,0,0.25)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#4d2a23' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#4a3d1a' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#1f3a23' }} />
          </div>
          <span className="font-mono text-[var(--rm-muted)]" style={{ fontSize: 11 }}>
            app.riff.so / channels / @earthrati
          </span>
        </div>
        <div className="font-mono rm-hide-md text-[var(--rm-muted-2)]" style={{ fontSize: 11 }}>
          ⌘K
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '180px 1fr', minHeight: 480 }}>
        {/* Sidebar */}
        <aside
          className="border-r border-[var(--rm-border)] p-3"
          style={{ background: 'rgba(0,0,0,0.15)' }}
        >
          <div
            className="font-mono uppercase text-[var(--rm-muted)] tracking-[0.14em]"
            style={{ fontSize: 10, padding: '8px 8px 6px' }}
          >
            WORKSPACE
          </div>
          {[
            { icon: '📡', label: 'Channels', n: 14, active: true },
            { icon: '✨', label: 'Outliers', n: 87 },
            { icon: '📑', label: 'Idea Library', n: 23 },
            { icon: '📝', label: 'Recreated', n: 11 },
            { icon: '🎙', label: 'Voice Profile' },
          ].map((it, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-2 py-[7px] rounded-md mb-0.5"
              style={{
                background: it.active ? 'rgba(255,107,53,0.08)' : 'transparent',
                color: it.active ? 'var(--rm-text)' : 'var(--rm-muted)',
                fontSize: 13,
                borderLeft: it.active
                  ? '2px solid var(--rm-accent)'
                  : '2px solid transparent',
              }}
            >
              <span className="inline-flex gap-2 items-center">
                <span className="w-3.5 text-center" style={{ fontSize: 11 }}>
                  {it.icon}
                </span>
                {it.label}
              </span>
              {it.n != null && (
                <span className="font-mono text-[var(--rm-muted-2)]" style={{ fontSize: 10.5 }}>
                  {it.n}
                </span>
              )}
            </div>
          ))}
          <div className="mt-4">
            <div
              className="font-mono uppercase text-[var(--rm-muted)]"
              style={{ fontSize: 10, padding: '8px 8px 6px', letterSpacing: '0.14em' }}
            >
              RECENT
            </div>
            {['@aliabdaal', '@jaykim', '@hormozi', '@earthrati'].map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1 text-[var(--rm-muted)]"
                style={{ fontSize: 12.5 }}
              >
                <span
                  className="rounded-full"
                  style={{
                    width: 16,
                    height: 16,
                    background: ['#3b2a1a', '#1a3b2a', '#2a1a3b', '#FF6B35'][i % 4],
                  }}
                />
                {c}
              </div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3.5 gap-2 flex-wrap">
            <div className="flex gap-2 items-center">
              <span
                className="rounded-full inline-block"
                style={{
                  width: 28,
                  height: 28,
                  background: 'linear-gradient(135deg,#FF6B35,#7a1a04)',
                }}
              />
              <div className="leading-[1.15]">
                <div className="font-semibold" style={{ fontSize: 14 }}>Earth Rati</div>
                <div className="font-mono text-[var(--rm-muted-2)]" style={{ fontSize: 10.5 }}>
                  180.2K subscribers · 612 videos
                </div>
              </div>
            </div>
            <div className="flex gap-1.5 items-center">
              <span
                className="rm-score-chip"
                style={{
                  color: 'var(--rm-muted)',
                  borderColor: 'var(--rm-border-2)',
                  background: 'transparent',
                }}
              >
                Sort: Outlier ↓
              </span>
              <span
                className="rm-score-chip"
                style={{
                  color: 'var(--rm-muted)',
                  borderColor: 'var(--rm-border-2)',
                  background: 'transparent',
                }}
              >
                Last 90 days
              </span>
            </div>
          </div>

          <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {MOCK_VIDEOS.map((v, i) => (
              <div
                key={i}
                className="rounded-[10px] p-1.5 border border-transparent transition-colors hover:border-[rgba(255,107,53,0.25)]"
              >
                <VideoThumb tone={v.tone} score={v.score} dur={v.dur} />
                <div className="mt-2">
                  <div
                    className="font-thai font-medium leading-tight text-[var(--rm-text)]"
                    style={{
                      fontSize: 12.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {v.title}
                  </div>
                  <div
                    className="font-mono text-[var(--rm-muted-2)] mt-0.5 flex justify-between"
                    style={{ fontSize: 10.5 }}
                  >
                    <span>{v.views} views</span>
                    <span>
                      {v.score.toFixed(1)}× / {v.subs}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-3.5 px-2.5 py-2 border-t border-dashed border-[var(--rm-border-2)] flex justify-between font-mono text-[var(--rm-muted-2)]"
            style={{ fontSize: 10.5 }}
          >
            <span>87 outliers found · 5 mega-viral · synced 3m ago</span>
            <span>RIFF v0.4.1</span>
          </div>
        </div>
      </div>
    </div>
  )
}
