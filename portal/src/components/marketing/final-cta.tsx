import { WaitlistForm } from './waitlist-form'

export function FinalCTA({ count }: { count: number }) {
  return (
    <section
      className="rm-section relative"
      style={{
        padding: '140px 24px',
        background: 'linear-gradient(180deg, transparent, rgba(201,154,110,0.10) 60%, transparent)',
      }}
    >
      <div
        className="rm-container text-center mx-auto"
        style={{ maxWidth: 760 }}
      >
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
          เปิดให้ creator ทดลองใช้ฟรีช่วง beta
        </div>

        <h2
          className="mt-6"
          style={{
            fontSize: 'clamp(36px, 5.4vw, 64px)',
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            color: 'var(--rm-text)',
            textWrap: 'balance' as const,
          }}
        >
          เริ่มลง content ทุกวัน
          <br />
          <span className="rm-serif-italic">ตั้งแต่วันนี้</span>
        </h2>

        <p
          className="mt-6 mx-auto text-[var(--rm-muted)]"
          style={{
            fontSize: 'clamp(16px, 1.4vw, 19px)',
            lineHeight: 1.7,
            maxWidth: 540,
          }}
        >
          ใส่ email เข้า waitlist ก่อน
          <br />
          เปิดให้ใช้เป็น batch · คุณจะได้ใช้ก่อนใคร
        </p>

        <div
          className="mt-9 mx-auto"
          style={{ maxWidth: 480 }}
        >
          <WaitlistForm size="lg" source="final-cta" />
        </div>

        <p
          className="mt-4 text-[var(--rm-muted-2)]"
          style={{ fontSize: 13 }}
        >
          {count} creator อยู่ในคิว · ไม่มี spam · ไม่ต้องใส่บัตร
        </p>
      </div>
    </section>
  )
}
