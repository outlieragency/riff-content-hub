/**
 * Forest panel — "How I guarantee an outlier"
 * Combines Problem framing + Outlier Score explainer in Eden style.
 */
const TIERS = [
  { range: '< 1.0', label: 'ต่ำกว่าค่าเฉลี่ย', color: '#9C9385', w: 12 },
  { range: '1.0–2.0', label: 'ค่าเฉลี่ย', color: '#93C5FD', w: 24 },
  { range: '2.0–5.0', label: 'Outlier', color: '#86efac', w: 50 },
  { range: '5.0–10.0', label: 'Viral', color: '#fdba74', w: 78 },
  { range: '> 10.0', label: 'Mega viral', color: '#fca5a5', w: 100 },
]

export function GuaranteeOutlier() {
  return (
    <section
      className="rm-forest"
      style={{ padding: '120px 24px', position: 'relative' }}
    >
      <div className="rm-container">
        <div className="text-center mx-auto mb-14" style={{ maxWidth: 760 }}>
          <h2
            style={{
              fontSize: 'clamp(34px, 4.4vw, 56px)',
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              textWrap: 'balance' as const,
            }}
          >
            หา <span className="rm-serif-italic">idea ที่ปังจริง</span>
            <br />
            ไม่ใช่ idea ที่คุณเดาเอง
          </h2>
          <p
            className="mt-5 mx-auto text-[var(--rm-forest-muted)]"
            style={{ fontSize: 'clamp(15px, 1.3vw, 18px)', lineHeight: 1.6, maxWidth: 600 }}
          >
            Outlier Score ของ Riff คือคะแนนที่บอกว่าวิดีโอตัวไหนดังเกินค่าเฉลี่ย channel
            กี่เท่า สูตรเดียวกับที่ vidIQ และ creator agency ใช้กันจริง
          </p>
        </div>

        {/* Dashboard mockup — outlier table polaroid */}
        <div className="mx-auto" style={{ maxWidth: 920 }}>
          <div
            style={{
              background: 'rgba(255,252,240,0.04)',
              border: '1px solid rgba(241,236,223,0.10)',
              borderRadius: 16,
              padding: 28,
              boxShadow: '0 24px 60px -20px rgba(0,0,0,0.5)',
            }}
          >
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  Outlier Score · 5 ระดับ
                </div>
                <div
                  className="text-[var(--rm-forest-muted)] mt-1"
                  style={{ fontSize: 13 }}
                >
                  views ÷ subscribers ปรับด้วยอายุวิดีโอ
                </div>
              </div>
              <div
                className="hidden sm:flex items-center gap-2"
                style={{ fontSize: 12.5, color: 'var(--rm-forest-muted)' }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#86efac',
                    display: 'inline-block',
                  }}
                />
                live · ปรับ tier ได้
              </div>
            </div>

            <div className="space-y-3">
              {TIERS.map((t) => (
                <div
                  key={t.range}
                  className="grid items-center gap-3.5"
                  style={{ gridTemplateColumns: '90px 130px 1fr' }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: `${t.color}15`,
                      border: `1px solid ${t.color}40`,
                      color: t.color,
                      textAlign: 'center',
                    }}
                  >
                    {t.range}
                  </span>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: t.color }}>
                    {t.label}
                  </span>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 999,
                      background: 'rgba(241,236,223,0.06)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${t.w}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${t.color}40, ${t.color})`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div
              className="mt-6 pt-5 text-[var(--rm-forest-muted)]"
              style={{
                fontSize: 13,
                borderTop: '1px dashed rgba(241,236,223,0.14)',
                lineHeight: 1.55,
              }}
            >
              สูตรนี้ทดสอบมาแล้วกับ video 2.4 ล้านตัวจาก creator economy ทั้งไทยและ EN
              ตัว tier ปรับให้เข้ากับ creator คนเดียวที่กำลังโต ไม่ใช่ channel ใหญ่
            </div>
          </div>
        </div>

        {/* Quote card from Earth */}
        <div className="mx-auto mt-10" style={{ maxWidth: 720 }}>
          <p
            className="text-center text-[var(--rm-forest-muted)]"
            style={{
              fontSize: 'clamp(16px, 1.4vw, 19px)',
              lineHeight: 1.6,
              fontStyle: 'italic',
            }}
          >
            &ldquo;Viral ไม่ใช่ดวง มันคือ signal&rdquo;
          </p>
        </div>
      </div>
    </section>
  )
}
