/**
 * Cream — "Become a top creator faster with AI"
 * Two-column feature checklist + AI summary preview.
 */
const FEATURES_LEFT = [
  {
    title: 'Channel Watchlist',
    body: 'ใส่ YouTube channel ที่คุณอยาก track ระบบ sync ทุก 24 ชม. ไม่ต้องเปิดดูเอง',
  },
  {
    title: 'Outlier auto-detect',
    body: 'video ไหน score ขึ้นถึง 2.0 ระบบจะ flag ขึ้นมาให้คุณเอง ไม่ต้องไล่ดูทีละ channel',
  },
  {
    title: 'Voice ของคุณเอง',
    body: 'Riff อ่าน post เก่าของคุณ จับจังหวะประโยค คำที่ใช้ซ้ำ วิธีปิดประโยค แล้วเขียนตามนั้น',
  },
  {
    title: 'Cover ปกแบบ scroll-stopping',
    body: 'template ปกที่ทำเสร็จให้พร้อม ดำ-ขาว-แดง-เหลือง-ส้ม สูตรเดียวจบ ไม่ต้องเปิด Canva เลย',
  },
]

const FEATURES_RIGHT = [
  {
    title: 'FB Post + IG Carousel จาก video เดียว',
    body: 'paste YT URL → AI เขียน FB Post 800-1,500 คำ + IG Carousel 3-9 slides ในเสียงและสไตล์ของคุณ ครบในนั่งเดียว',
  },
  {
    title: 'Transcript ไทย-อังกฤษ',
    body: 'video EN ถอดเสียง แปลไทย สรุปประเด็นให้คุณ พร้อมใช้ ไม่ต้อง copy ไป ChatGPT เอง',
  },
  {
    title: 'Idea Library + boards',
    body: 'idea ที่คุณ save ไว้ จัดเป็น board ตาม series ตาม theme ตามรอบปล่อย ไม่ต้องใช้ Notion แยก',
  },
  {
    title: 'Push to Notion ตรง',
    body: 'export ตรงเข้า Notion DB ของคุณ พร้อม cover · tags · status ไม่ต้อง copy ทีละ field',
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
            ทุก Tab ที่คุณต้องเปิดทำเอง
            <br />
            <span className="rm-serif-italic">ตอนนี้ไม่จำเป็นแล้ว</span>
          </h2>
          <p
            className="mt-5 mx-auto text-[var(--rm-muted)]"
            style={{ fontSize: 'clamp(15px, 1.3vw, 18px)', lineHeight: 1.7, maxWidth: 540 }}
          >
            YouTube · Notion · ChatGPT · Canva
            <br />
            รวมไว้ใน Riff จบในที่เดียว
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
