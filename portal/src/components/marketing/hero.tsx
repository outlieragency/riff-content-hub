import { WaitlistForm } from './waitlist-form'

const FORMAT_TABS = [
  { label: 'YouTube Script', emoji: '📺' },
  { label: 'Facebook Post', emoji: '📘' },
  { label: 'Reels Script', emoji: '📱' },
  { label: 'IG Carousel', emoji: '🎴' },
]

export function Hero({ count }: { count: number }) {
  return (
    <section
      id="top"
      className="rm-section relative"
      style={{ paddingTop: 132, paddingBottom: 96 }}
    >
      <div className="rm-container">
        <div
          className="text-center mx-auto"
          style={{ maxWidth: 760 }}
        >
          {/* Eyebrow chip */}
          <div
            className="inline-flex items-center gap-2 rounded-full"
            style={{
              padding: '6px 14px',
              background: '#FBF7EC',
              border: '1px solid rgba(26,36,24,0.08)',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--rm-muted)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--rm-accent)',
                display: 'inline-block',
              }}
            />
            สำหรับ Creator และ Founder ที่ทำ content คนเดียว
          </div>

          {/* Headline */}
          <h1
            className="mt-6"
            style={{
              fontSize: 'clamp(36px, 5.4vw, 64px)',
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              textWrap: 'balance' as const,
              color: 'var(--rm-text)',
            }}
          >
            ช่วยคุณมี Content ลงทุกวัน
            <br />
            ภายใน{' '}
            <span className="rm-serif-italic" style={{ color: 'var(--rm-text)' }}>
              7 นาที
            </span>
          </h1>

          <p
            className="mt-6 mx-auto"
            style={{
              fontSize: 'clamp(16px, 1.4vw, 19px)',
              color: 'var(--rm-muted)',
              maxWidth: 600,
              lineHeight: 1.65,
            }}
          >
            โดยไม่ต้องเหนื่อยกับการหาไอเดีย
            <br />
            และเขียน content จากกระดาษเปล่า
            <br />
            <br />
            Riff คือเครื่องมือที่ทำให้คุณลง content ต่อเนื่อง
            โดยไม่เสียเอกลักษณ์ของตัวเองไป
          </p>

          {/* Format tabs */}
          <div className="mt-8 flex justify-center gap-2 flex-wrap">
            {FORMAT_TABS.map((t) => (
              <span
                key={t.label}
                className="inline-flex items-center gap-1.5"
                style={{
                  padding: '8px 16px',
                  background: '#FBF7EC',
                  border: '1px solid rgba(26,36,24,0.08)',
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--rm-text)',
                }}
              >
                <span style={{ fontSize: 14 }}>{t.emoji}</span>
                {t.label}
              </span>
            ))}
          </div>

          {/* Waitlist CTA */}
          <div
            id="waitlist"
            className="mt-9 mx-auto"
            style={{ maxWidth: 480 }}
          >
            <WaitlistForm size="md" source="hero" />
          </div>

          <p
            className="mt-4 text-[var(--rm-muted-2)]"
            style={{ fontSize: 13.5 }}
          >
            <span style={{ color: 'var(--rm-accent)' }}>●</span> {count} creator
            อยู่ในคิวก่อนคุณ · ทดลองใช้ฟรีช่วง beta · ไม่ต้องใส่บัตร
          </p>
        </div>

        {/* Polaroid dashboard preview */}
        <div
          className="mt-16 mx-auto relative"
          style={{ maxWidth: 980 }}
        >
          <div
            className="rm-polaroid"
            style={{ transform: 'rotate(-1.5deg)' }}
          >
            <div
              className="rounded-[4px] overflow-hidden"
              style={{
                background: '#1A2418',
                aspectRatio: '16 / 10',
              }}
            >
              <DashboardPreview />
            </div>
            <div
              className="mt-3 text-center text-[var(--rm-muted)]"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              app.riff · discover what&rsquo;s working
            </div>
          </div>

          {/* Floating side stat polaroid */}
          <div
            className="absolute hidden lg:block rm-polaroid"
            style={{
              right: -20,
              top: -28,
              padding: '12px 16px 14px',
              transform: 'rotate(4deg)',
            }}
          >
            <div
              className="text-[var(--rm-muted-2)] uppercase"
              style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 600 }}
            >
              video ดังที่เจอ
            </div>
            <div
              style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, marginTop: 6 }}
            >
              87
              <span style={{ color: 'var(--rm-accent)' }}>↑</span>
            </div>
            <div
              className="text-[var(--rm-muted-2)] mt-1"
              style={{ fontSize: 11.5 }}
            >
              ใน 90 วันที่ผ่านมา
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function DashboardPreview() {
  // Stylized in-app preview — outlier list with thumbnails
  const ROWS = [
    { title: 'ทำไมคนรวยไม่บอกความจริงเรื่องการเงิน', score: 11.7, views: '2.1M', tone: '#fca5a5' },
    { title: 'I quit my $400K job in 3 minutes', score: 9.2, views: '1.8M', tone: '#fdba74' },
    { title: 'เลิก scroll TikTok ใน 30 วัน', score: 5.1, views: '612K', tone: '#fdba74' },
    { title: 'Why nobody talks about this gap…', score: 3.7, views: '420K', tone: '#86efac' },
  ]
  return (
    <div className="h-full flex" style={{ color: '#F1ECDF' }}>
      {/* Sidebar */}
      <div
        className="hidden md:flex flex-col"
        style={{
          width: 200,
          padding: '20px 14px',
          background: '#13191A',
          borderRight: '1px solid rgba(241,236,223,0.08)',
        }}
      >
        <div className="flex items-center gap-2 mb-6">
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: 'var(--rm-accent)',
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 700 }}>Riff</span>
        </div>
        {['Today', 'Discover', 'Outliers', 'Ideas', 'Recreated', 'Channels'].map(
          (l, i) => (
            <div
              key={l}
              className="rounded-md px-2.5 py-1.5"
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                marginBottom: 4,
                background: i === 1 ? 'rgba(255,107,53,0.12)' : 'transparent',
                color: i === 1 ? 'var(--rm-accent)' : 'rgba(241,236,223,0.7)',
              }}
            >
              {l}
            </div>
          ),
        )}
      </div>
      {/* Main */}
      <div className="flex-1 p-5 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Discover</div>
            <div
              style={{ fontSize: 11, color: 'rgba(241,236,223,0.5)', marginTop: 2 }}
            >
              วิดีโอที่ดังเกินค่าเฉลี่ย channel ใน 90 วันที่ผ่านมา
            </div>
          </div>
          <div
            className="hidden sm:flex gap-1.5"
            style={{ fontSize: 11, fontWeight: 500 }}
          >
            {['Outliers', 'Latest', 'All'].map((t, i) => (
              <span
                key={t}
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: i === 0 ? 'rgba(241,236,223,0.10)' : 'transparent',
                  color: 'rgba(241,236,223,0.85)',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {ROWS.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-md p-2"
              style={{
                background: i === 0 ? 'rgba(255,107,53,0.06)' : 'transparent',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 36,
                  borderRadius: 4,
                  background: 'rgba(241,236,223,0.08)',
                  flexShrink: 0,
                }}
              />
              <div className="flex-1 min-w-0">
                <div
                  className="truncate"
                  style={{ fontSize: 12.5, fontWeight: 500 }}
                >
                  {r.title}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: 'rgba(241,236,223,0.45)',
                    marginTop: 2,
                  }}
                >
                  {r.views} views
                </div>
              </div>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: `${r.tone}20`,
                  color: r.tone,
                }}
              >
                {r.score.toFixed(1)}×
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
