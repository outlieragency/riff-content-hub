import { WaitlistForm } from './waitlist-form'

export function FinalCTA({ count }: { count: number }) {
  return (
    <section
      className="rm-section relative overflow-hidden"
      style={{ paddingTop: 120, paddingBottom: 120 }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(255,107,53,0.16), transparent 50%)',
        }}
      />
      <div
        className="rm-container relative text-center"
        style={{ maxWidth: 820 }}
      >
        <div className="rm-eyebrow inline-flex justify-center">
          <span className="dot" />
          เปิดให้ใช้ batch ถัดไปสัปดาห์หน้า
        </div>
        <h2
          className="font-thai"
          style={{
            fontSize: 'clamp(32px, 6vw, 64px)',
            marginTop: 18,
            fontWeight: 800,
            textWrap: 'balance' as const,
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
          }}
        >
          เลิกเปิด tab 6 อัน<br />
          <span style={{ color: 'var(--rm-accent)' }}>
            ลงโพสต์ได้ทุกวัน
          </span>
        </h2>
        <p
          className="font-thai text-[var(--rm-muted)]"
          style={{ fontSize: 'clamp(16px, 1.6vw, 19px)', marginTop: 22, lineHeight: 1.55 }}
        >
          {count} ครีเอเตอร์รอใช้อยู่ ทยอยเปิดให้ใช้เป็น batch
        </p>
        <div className="mt-7 flex justify-center">
          <WaitlistForm size="lg" source="final-cta" />
        </div>
        <div
          className="font-mono mt-3.5 text-[var(--rm-muted-2)] flex justify-center gap-2 flex-wrap"
          style={{ fontSize: 11.5, letterSpacing: '0.06em' }}
        >
          <span>ไม่มี spam</span>
          <span>·</span>
          <span>ราคาเปิดเผย</span>
          <span>·</span>
          <span>ยกเลิก click เดียว</span>
        </div>
      </div>
    </section>
  )
}
