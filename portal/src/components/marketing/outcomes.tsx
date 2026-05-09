/**
 * "ใครใช้แล้วได้อะไร" — Concrete outcomes with numbers and contrast.
 * Sells the lifestyle change (1-person content team) in plain Thai.
 */
export function Outcomes() {
  return (
    <section id="outcomes" className="rm-section">
      <div className="rm-container">
        <div style={{ maxWidth: 760, marginBottom: 56 }}>
          <div className="rm-eyebrow">
            <span className="dot" />
            ผลลัพธ์ที่จับต้องได้
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
            ใช้ Riff แล้ว{' '}
            <span style={{ color: 'var(--rm-accent)' }}>คุณจะเป็นแบบนี้</span>
          </h2>
          <p
            className="font-thai mt-4 text-[var(--rm-muted)]"
            style={{ fontSize: 'clamp(16px, 1.4vw, 18px)', lineHeight: 1.55 }}
          >
            ไม่ใช่แค่ tool แต่คือเครื่องจักรที่ช่วยให้ครีเอเตอร์ไทยทำงานน้อยลง
            ได้ผลมากขึ้น
          </p>
        </div>

        <div className="grid gap-5 outcomes-grid">
          <OutcomeCard
            metric="5 นาที"
            metricSub="ต่อ 1 โพสต์"
            metricColor="#FF6B35"
            title="ทำเสร็จเร็วขึ้น 50 เท่า"
            body="เคยใช้ 4 ชั่วโมง ตอนนี้ใช้แค่ 5 นาที เวลาที่เหลือเอาไปทำสิ่งที่สำคัญกว่า"
          />
          <OutcomeCard
            metric="ทุกวัน"
            metricSub="ลงได้ ไม่ขาดสาย"
            metricColor="#86efac"
            title="ไอเดียไม่มีวันตัน"
            body="Riff หา content ดัง ๆ มาให้ทุกวัน แค่เลือกตัวที่ชอบ ไม่ต้องนั่งคิดเอง"
          />
          <OutcomeCard
            metric="0 ฿"
            metricSub="ค่า agency"
            metricColor="#fdba74"
            title="ไม่ต้องจ้างทีม"
            body="ทำงานได้เท่ากับ agency 5 คน ในราคาเท่ากาแฟต่อเดือน เป็น 1-Person Content Team ได้จริง"
          />
          <OutcomeCard
            metric="100%"
            metricSub="เสียงของคุณเอง"
            metricColor="#fca5a5"
            title="ไม่เป็น AI generic"
            body="Riff เรียนสไตล์การเขียนของคุณจาก content เก่า เขียนแบบเดียวกับที่คุณเขียน คนอ่านแยกไม่ออก"
          />
          <OutcomeCard
            metric="4 platform"
            metricSub="พร้อมกัน"
            metricColor="#93C5FD"
            title="1 ความคิด = 4 ช่องทาง"
            body="FB post · IG carousel · Reels · YouTube script generate ได้ครั้งเดียว ใช้ได้ทุกที่"
          />
          <OutcomeCard
            metric="0 ครั้ง"
            metricSub="ที่จะ burnout"
            metricColor="#c084fc"
            title="ไม่หมดแรงกับการทำ content"
            body="ไม่ต้องนั่งเขียนตั้งแต่ 0 ทุกวัน Riff ช่วยตั้งต้นให้ คุณแค่ปรับแต่งและ ship"
          />
        </div>
      </div>

      <style>{`
        .outcomes-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        @media (max-width: 1024px) {
          .outcomes-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .outcomes-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}

function OutcomeCard({
  metric,
  metricSub,
  metricColor,
  title,
  body,
}: {
  metric: string
  metricSub: string
  metricColor: string
  title: string
  body: string
}) {
  return (
    <div className="rm-card rm-card-glow p-6">
      <div
        className="font-display"
        style={{
          fontSize: 'clamp(32px, 3.4vw, 42px)',
          fontWeight: 800,
          letterSpacing: '-0.025em',
          color: metricColor,
          lineHeight: 1,
        }}
      >
        {metric}
      </div>
      <div
        className="font-mono mt-1.5 text-[var(--rm-muted-2)]"
        style={{ fontSize: 11, letterSpacing: '0.06em' }}
      >
        {metricSub}
      </div>
      <h3
        className="font-thai mt-4 text-[var(--rm-text)]"
        style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.3 }}
      >
        {title}
      </h3>
      <p
        className="font-thai mt-2 text-[var(--rm-muted)]"
        style={{ fontSize: 14, lineHeight: 1.6 }}
      >
        {body}
      </p>
    </div>
  )
}
