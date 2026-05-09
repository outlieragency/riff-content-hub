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
          เปิดให้ creator 100 คนแรก · batch ถัดไปสัปดาห์หน้า
        </div>
        <h2
          style={{
            fontSize: 'clamp(32px, 5.6vw, 60px)',
            marginTop: 18,
            fontWeight: 700,
            textWrap: 'balance' as const,
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
          }}
        >
          ปีนี้คุณจะลง content<br />
          <span style={{ color: 'var(--rm-accent)' }}>
            365 โพสต์ หรือ 12 โพสต์?
          </span>
        </h2>
        <p
          className="text-[var(--rm-muted)]"
          style={{ fontSize: 'clamp(16px, 1.6vw, 19px)', marginTop: 22, lineHeight: 1.55, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' }}
        >
          เข้า waitlist วันนี้ ล็อกราคา early-creator ถูกกว่าราคาเปิด 50% ตลอดปีแรก
          ({count} creator รอใช้อยู่)
        </p>
        <div className="mt-7 flex justify-center">
          <WaitlistForm size="lg" source="final-cta" />
        </div>
        <div
          className="mt-3.5 text-[var(--rm-muted-2)] flex justify-center gap-2 flex-wrap"
          style={{ fontSize: 13.5, letterSpacing: '0.04em' }}
        >
          <span>ไม่มี spam</span>
          <span>·</span>
          <span>ราคาเปิดเผยทั้งหมด</span>
          <span>·</span>
          <span>ยกเลิก click เดียว</span>
        </div>
      </div>
    </section>
  )
}
