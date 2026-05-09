import { OnboardingSurvey } from '@/components/marketing/onboarding-survey'

export const dynamic = 'force-dynamic'

export default async function WaitlistThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const sp = await searchParams
  const email = sp.email ?? ''

  return (
    <section
      className="rm-section"
      style={{ paddingTop: 132, paddingBottom: 96, minHeight: '100vh' }}
    >
      <div className="rm-container">
        <div className="text-center mx-auto" style={{ maxWidth: 680 }}>
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
                background: 'var(--rm-success)',
                display: 'inline-block',
              }}
            />
            email ถูกบันทึกแล้ว
          </div>

          <h1
            className="mt-6"
            style={{
              fontSize: 'clamp(34px, 4.6vw, 56px)',
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              color: 'var(--rm-text)',
              textWrap: 'balance' as const,
            }}
          >
            ขอบคุณที่สนใจ Riff
            <br />
            <span className="rm-serif-italic">บอกเรื่องคุณหน่อย</span>
          </h1>

          <p
            className="mt-5 mx-auto text-[var(--rm-muted)]"
            style={{
              fontSize: 'clamp(15px, 1.3vw, 18px)',
              lineHeight: 1.7,
              maxWidth: 520,
            }}
          >
            ใช้เวลาแค่ 1 นาที จะได้รู้ว่าคุณทำ content แบบไหน เจอปัญหาอะไร
            ผมจะได้เข้ามาตามคุยและจัดลำดับให้คุณได้ใช้ก่อน
          </p>
        </div>

        <div className="mx-auto mt-10" style={{ maxWidth: 640 }}>
          <OnboardingSurvey defaultEmail={email} />
        </div>
      </div>
    </section>
  )
}
