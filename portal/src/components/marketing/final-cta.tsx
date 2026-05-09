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
          batch ถัดไปเปิดสัปดาห์หน้า · 100 คนแรก
        </div>

        <h2
          className="mt-6"
          style={{
            fontSize: 'clamp(40px, 5.6vw, 72px)',
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: '-0.035em',
            color: 'var(--rm-text)',
            textWrap: 'balance' as const,
          }}
        >
          ลงต่อเนื่อง 90 วัน
          <br />
          <span className="rm-serif-italic">moat ของคุณก็เริ่ม.</span>
        </h2>

        <p
          className="mt-6 mx-auto text-[var(--rm-muted)]"
          style={{
            fontSize: 'clamp(16px, 1.4vw, 19px)',
            lineHeight: 1.7,
            maxWidth: 540,
          }}
        >
          เข้า waitlist ก่อน
          <br />
          ราคา early lock 1 ปี ปกติเปิด public สูงกว่านี้ 50%
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
          {count} creator อยู่ในคิว · ไม่มี spam · ยกเลิกเดือนไหนก็ได้
        </p>
      </div>
    </section>
  )
}
