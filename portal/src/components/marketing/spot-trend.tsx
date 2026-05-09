/**
 * Cream section — "Never be the last to spot a trend"
 * Replaces the old Outcomes grid with an Eden-style trending list mockup.
 */
const TRENDING = [
  { rank: 1, title: 'การเงินส่วนบุคคล Gen Z', heat: 'ร้อน', delta: '+342%', tone: '#C9522F' },
  { rank: 2, title: 'AI tool stack สำหรับ solo founder', heat: 'ร้อน', delta: '+218%', tone: '#C9522F' },
  { rank: 3, title: 'เลิก scroll · habit reset', heat: 'กำลังขึ้น', delta: '+156%', tone: '#B8782A' },
  { rank: 4, title: 'Notion templates สำหรับ creator', heat: 'กำลังขึ้น', delta: '+98%', tone: '#B8782A' },
  { rank: 5, title: '1-Person Content Marketing', heat: 'นิ่ง', delta: '+24%', tone: '#5A7B3A' },
]

export function SpotTrend() {
  return (
    <section
      className="rm-section"
      style={{ padding: '120px 24px' }}
    >
      <div className="rm-container">
        <div className="text-center mx-auto mb-14" style={{ maxWidth: 760 }}>
          <h2
            style={{
              fontSize: 'clamp(34px, 4.4vw, 56px)',
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: 'var(--rm-text)',
              textWrap: 'balance' as const,
            }}
          >
            ตอนคุณเห็น trend ใน feed.
            <br />
            <span className="rm-serif-italic">ก็สายไปแล้ว.</span>
          </h2>
          <p
            className="mt-5 mx-auto text-[var(--rm-muted)]"
            style={{ fontSize: 'clamp(15px, 1.3vw, 18px)', lineHeight: 1.7, maxWidth: 560 }}
          >
            Riff scan video ใหม่ทุก 24 ชม. ใน niche ของคุณ
            <br />
            แสดงสิ่งที่กำลังขึ้น ก่อน feed คนอื่นจะเต็มไปด้วยมัน
          </p>
        </div>

        <div className="mx-auto" style={{ maxWidth: 720 }}>
          <div
            className="rm-soft-card"
            style={{
              padding: '8px 8px',
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(26,36,24,0.06)' }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rm-text)' }}>
                เทรนด์ใน niche ของคุณ · สดใหม่
              </div>
              <div
                className="text-[var(--rm-muted-2)]"
                style={{ fontSize: 12 }}
              >
                อัปเดตเมื่อ 8 นาทีที่แล้ว
              </div>
            </div>

            {TRENDING.map((t, i) => (
              <div
                key={t.rank}
                className="flex items-center gap-4 px-4 py-3.5"
                style={{
                  borderBottom: i < TRENDING.length - 1 ? '1px solid rgba(26,36,24,0.05)' : 'none',
                }}
              >
                <span
                  style={{
                    width: 28,
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--rm-muted-2)',
                    textAlign: 'center',
                    flexShrink: 0,
                  }}
                >
                  {String(t.rank).padStart(2, '0')}
                </span>
                <span
                  className="flex-1"
                  style={{ fontSize: 15, fontWeight: 500, color: 'var(--rm-text)' }}
                >
                  {t.title}
                </span>
                <span
                  className="hidden sm:inline-flex"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: `${t.tone}15`,
                    color: t.tone,
                    border: `1px solid ${t.tone}30`,
                  }}
                >
                  {t.heat}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: t.tone,
                    width: 60,
                    textAlign: 'right',
                  }}
                >
                  {t.delta}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
