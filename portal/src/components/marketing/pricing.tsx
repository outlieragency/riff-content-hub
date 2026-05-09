/**
 * Pricing — Eden-style 3-tier card stack on cream paper.
 * Earth's planned pricing: Starter / Pro / Studio (THB).
 */
const TIERS = [
  {
    key: 'solo',
    name: 'Solo',
    tagline: 'ลองก่อน ลงสัปดาห์ละ 2-3 ชิ้น',
    price: '฿990',
    cadence: '/ เดือน',
    features: [
      'track 3 channel',
      'save idea ได้ 20 ชิ้น/เดือน',
      'recreate 20 ครั้ง/เดือน',
      'voice profile 1 ตัว',
      'output 1 platform',
      'push เข้า Notion',
    ],
    cta: 'เริ่มที่ Solo',
    highlight: false,
  },
  {
    key: 'daily',
    name: 'Daily',
    tagline: 'สำหรับคนที่ลงทุกวัน',
    price: '฿2,990',
    cadence: '/ เดือน',
    features: [
      'track 10 channel',
      'save idea ไม่จำกัด',
      'recreate 120 ครั้ง/เดือน',
      'voice profile 3 ตัว (ทดลองโทน)',
      'output 4 platform (FB · IG · Reels · YT)',
      'AI เรียน voice จาก post เก่าให้',
      'priority queue เร็วกว่า 3 เท่า',
    ],
    cta: 'เลือก Daily',
    highlight: true,
  },
  {
    key: 'studio',
    name: 'Studio',
    tagline: 'สำหรับ creator ที่มีทีม',
    price: '฿9,990',
    cadence: '/ เดือน',
    features: [
      'track ไม่จำกัด',
      'recreate ไม่จำกัด',
      'voice profile ไม่จำกัด',
      'multi-user สูงสุด 5 คน',
      'template ปกแบบ branded ของคุณเอง',
      'API access · webhook',
      'คุยกับ Earth 1 ชม./เดือน',
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
            จ่ายเท่าที่ใช้.
            <br />
            ยกเลิก <span className="rm-serif-italic">เดือนไหนก็ได้.</span>
          </h2>
          <p
            className="mt-5 mx-auto text-[var(--rm-muted)]"
            style={{ fontSize: 'clamp(15px, 1.3vw, 18px)', lineHeight: 1.7, maxWidth: 580 }}
          >
            ไม่มี free tier เพราะ Riff สำหรับคนที่ลงจริง ไม่ใช่คนทดลอง
            <br />
            <br />
            ราคา early lock ปีแรก ปกติเปิด public สูงกว่านี้ 50%
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
          style={{ fontSize: 13.5, lineHeight: 1.6 }}
        >
          ทุก plan ใช้ Claude Sonnet 4.6 + voice model ของคุณเอง
          <br />
          data ไม่ถูกเอาไป train shared model
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
