/**
 * Cream — "Become a top creator faster with AI"
 * Two-column feature checklist + AI summary preview.
 */
const FEATURES_LEFT = [
  {
    title: 'Channel Watchlist',
    body: 'ดู channel ใน niche คุณทุก channel ในที่เดียว Riff sync ทุก 24 ชั่วโมง',
  },
  {
    title: 'Outlier auto-detect',
    body: 'ทุก video ที่ขึ้น score >= 2.0 จะปรากฏใน feed คุณภายใน 30 นาที',
  },
  {
    title: 'Voice ที่เรียนจากคุณ',
    body: 'Riff อ่าน post 20+ ชิ้น เรียนจังหวะ คำที่ใช้ สไตล์ การ tail off ประโยค',
  },
  {
    title: 'Cover ปกที่จัด format ให้',
    body: 'Headliner template ใช้สีดำ ขาว แดง เหลือง ส้ม ทำปกแบบ scroll-stopping ให้อัตโนมัติ',
  },
]

const FEATURES_RIGHT = [
  {
    title: '4 formats พร้อมกัน',
    body: 'FB post, IG carousel (4–10 slides), Reels script (hook · body · CTA), YT script + 5 titles',
  },
  {
    title: 'Transcript ภาษาไทย',
    body: 'video ภาษาอังกฤษถอดเสียง แปลไทย สรุปประเด็น พร้อมใช้ตอน recreate',
  },
  {
    title: 'Idea Library + boards',
    body: 'จัด idea เป็น board ตาม theme ตาม series ตามรอบปล่อย ลากย้ายได้ฟรี',
  },
  {
    title: 'Push to Notion',
    body: 'export draft ตรงเข้า Notion DB ของคุณ พร้อม cover URL + tags + status',
  },
]

export function FasterWithAI() {
  return (
    <section
      className="rm-section"
      style={{ padding: '120px 24px' }}
    >
      <div className="rm-container">
        <div className="text-center mx-auto mb-16" style={{ maxWidth: 760 }}>
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
            เป็น top creator{' '}
            <span className="rm-serif-italic">เร็วขึ้น</span> ด้วย AI.
          </h2>
          <p
            className="mt-5 mx-auto text-[var(--rm-muted)]"
            style={{ fontSize: 'clamp(15px, 1.3vw, 18px)', lineHeight: 1.6, maxWidth: 580 }}
          >
            ทุกฟีเจอร์ที่ creator คนเดียวต้องการ ในเครื่องเดียว
          </p>
        </div>

        <div
          className="grid gap-x-14 gap-y-8 mx-auto"
          style={{ gridTemplateColumns: '1fr 1fr', maxWidth: 1080 }}
        >
          {FEATURES_LEFT.map((f) => (
            <FeatureItem key={f.title} title={f.title} body={f.body} />
          ))}
          {FEATURES_RIGHT.map((f) => (
            <FeatureItem key={f.title} title={f.title} body={f.body} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .rm-section .grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

function FeatureItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span
        className="flex-shrink-0 inline-flex items-center justify-center"
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'var(--rm-text)',
          color: 'var(--rm-bg)',
          fontSize: 12,
          fontWeight: 700,
          marginTop: 2,
        }}
      >
        ✓
      </span>
      <div>
        <h3
          style={{
            fontSize: 17,
            fontWeight: 600,
            lineHeight: 1.3,
            color: 'var(--rm-text)',
          }}
        >
          {title}
        </h3>
        <p
          className="mt-1.5 text-[var(--rm-muted)]"
          style={{ fontSize: 14.5, lineHeight: 1.55 }}
        >
          {body}
        </p>
      </div>
    </div>
  )
}
