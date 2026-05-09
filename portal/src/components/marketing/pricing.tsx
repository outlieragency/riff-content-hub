/**
 * Pricing — Eden-style 3-tier card stack on cream paper.
 * Earth's planned pricing: Starter / Pro / Studio (THB).
 */
const TIERS = [
  {
    key: 'starter',
    name: 'Starter',
    tagline: 'พอลงเริ่ม 1 platform',
    price: '฿990',
    cadence: '/ เดือน',
    features: [
      '3 channel ใน watchlist',
      '20 idea / เดือน',
      '20 recreate / เดือน',
      '1 voice profile',
      '1 platform output',
      'export ไป Notion',
    ],
    cta: 'เริ่มที่ Starter',
    highlight: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    tagline: 'สำหรับ creator คนเดียวที่ลงทุกวัน',
    price: '฿2,990',
    cadence: '/ เดือน',
    features: [
      '10 channel ใน watchlist',
      'idea ไม่จำกัด',
      '120 recreate / เดือน',
      '3 voice profiles (ทดลองโทน)',
      '4 platform output (FB · IG · Reels · YT)',
      'AI voice extraction จาก post เก่า',
      'priority queue · เร็วกว่า 3 เท่า',
    ],
    cta: 'เลือก Pro',
    highlight: true,
  },
  {
    key: 'studio',
    name: 'Studio',
    tagline: 'สำหรับ creator + ทีม content',
    price: '฿9,990',
    cadence: '/ เดือน',
    features: [
      'channel ไม่จำกัด',
      'recreate ไม่จำกัด',
      'voice profiles ไม่จำกัด',
      'multi-user (สูงสุด 5 ทีม)',
      'creative templates (custom branded)',
      'API access · webhook',
      'รับเทรนกับ Earth 1 ชั่วโมง/เดือน',
    ],
    cta: 'คุยกับเรา',
    highlight: false,
  },
]

export function Pricing() {
  return (
    <section
      id="pricing"
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
            หมดยุค{' '}
            <span className="rm-serif-italic">post-and-pray.</span>
          </h2>
          <p
            className="mt-5 mx-auto text-[var(--rm-muted)]"
            style={{ fontSize: 'clamp(15px, 1.3vw, 18px)', lineHeight: 1.6, maxWidth: 600 }}
          >
            จ่ายตามที่ใช้จริง ยกเลิกได้ทุกเดือน early-creator ล็อกราคานี้ตลอดปีแรก
            ปกติ public เปิดราคาสูงกว่านี้ 50%
          </p>
        </div>

        <div
          className="grid gap-5 mx-auto pricing-grid"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            maxWidth: 1100,
            alignItems: 'stretch',
          }}
        >
          {TIERS.map((t) => (
            <PricingCard key={t.key} tier={t} />
          ))}
        </div>

        <p
          className="mt-10 text-center text-[var(--rm-muted-2)]"
          style={{ fontSize: 13.5 }}
        >
          ทุก plan ใช้ Anthropic Claude + custom voice model · ไม่มี data ของคุณ
          ถูกใช้ train shared model
        </p>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .pricing-grid { grid-template-columns: 1fr !important; max-width: 420px !important; }
        }
      `}</style>
    </section>
  )
}

function PricingCard({ tier }: { tier: (typeof TIERS)[number] }) {
  return (
    <div
      className="rm-soft-card flex flex-col"
      style={{
        padding: 28,
        background: tier.highlight ? 'var(--rm-forest-bg)' : '#FBF7EC',
        color: tier.highlight ? 'var(--rm-forest-text)' : 'var(--rm-text)',
        boxShadow: tier.highlight
          ? '0 24px 60px -16px rgba(26,36,24,0.30)'
          : '0 4px 12px -4px rgba(26,36,24,0.08)',
        position: 'relative',
        transform: tier.highlight ? 'translateY(-8px)' : 'none',
      }}
    >
      {tier.highlight && (
        <div
          className="absolute"
          style={{
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--rm-accent)',
            color: '#1a0a04',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            padding: '5px 12px',
            borderRadius: 999,
            textTransform: 'uppercase',
          }}
        >
          แนะนำ
        </div>
      )}

      <div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
          {tier.name}
        </div>
        <div
          className="mt-1"
          style={{
            fontSize: 13.5,
            color: tier.highlight ? 'var(--rm-forest-muted)' : 'var(--rm-muted)',
          }}
        >
          {tier.tagline}
        </div>
      </div>

      <div className="mt-5 mb-5 flex items-baseline gap-1">
        <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {tier.price}
        </span>
        <span
          style={{
            fontSize: 14,
            color: tier.highlight ? 'var(--rm-forest-muted)' : 'var(--rm-muted)',
          }}
        >
          {tier.cadence}
        </span>
      </div>

      <ul
        className="space-y-2.5 mb-7 flex-1"
        style={{ listStyle: 'none', padding: 0 }}
      >
        {tier.features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2.5"
            style={{ fontSize: 14, lineHeight: 1.5 }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                flexShrink: 0,
                marginTop: 3,
                color: tier.highlight ? 'var(--rm-accent)' : 'var(--rm-text)',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              ✓
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <a
        href="#waitlist"
        className="rm-btn rm-btn-primary"
        style={{
          background: tier.highlight ? 'var(--rm-accent)' : 'var(--rm-forest-bg)',
          color: tier.highlight ? '#1a0a04' : 'var(--rm-forest-text)',
          width: '100%',
        }}
      >
        {tier.cta}
      </a>
    </div>
  )
}
