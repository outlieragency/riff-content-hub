const VOICE_ROWS = [
  { k: 'โทน', v: 'ตรงไปตรงมา ไม่อ้อมค้อม' },
  { k: 'ประโยค', v: 'สั้น กระชับ เฉลี่ย 7 คำ' },
  {
    k: 'ลายเซ็น',
    v: 'ขึ้นต้นด้วยคำตอบ ไม่เกริ่น ใช้เว้นบรรทัดให้จังหวะ',
  },
  { k: 'คำที่ใช้บ่อย', v: 'outlier · signal · craft · ในเสียงคุณ' },
  { k: 'หลีกเลี่ยง', v: 'คำ corporate · ประโยคยาว · ขายของเกิน' },
]

const MATCH_BADGES = [
  'โทน 94%',
  'จังหวะ 91%',
  'คำศัพท์ 88%',
]

export function VoiceProfile() {
  return (
    <section
      className="rm-section"
      style={{
        background:
          'linear-gradient(180deg, transparent, rgba(255,107,53,0.025), transparent)',
      }}
    >
      <div className="rm-container grid gap-14 items-center voice-grid">
        <div>
          <div className="rm-eyebrow">
            <span className="dot" />
            ไม่ใช่ AI generic
          </div>
          <h2
            className="mt-3.5"
            style={{
              fontSize: 'clamp(28px, 4.4vw, 46px)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              textWrap: 'balance' as const,
            }}
          >
            AI ที่เขียนเหมือนคุณ{' '}
            <span style={{ color: 'var(--rm-accent)' }}>91%</span>{' '}
            (คนอ่านแยกไม่ออก)
          </h2>
          <p
            className="text-[var(--rm-muted)]"
            style={{ fontSize: 'clamp(15px, 1.4vw, 18px)', marginTop: 18, lineHeight: 1.6 }}
          >
            Riff อ่าน post เก่าของคุณ 20+ ชิ้น จับวิธีเขียน จังหวะประโยค
            คำที่คุณใช้บ่อย แล้วเขียนใหม่ในแบบเดียวกัน
            เหมือนคุณนั่งเขียนเอง แต่เร็วกว่า 50 เท่า
          </p>
          <p
            className="text-[var(--rm-muted-2)]"
            style={{ fontSize: 15, marginTop: 12, maxWidth: 480, fontStyle: 'italic' }}
          >
            &ldquo;AI ทั่วไปอ่านออกได้ทันทีว่าเป็น AI เสียงคุณอ่านไม่ออก&rdquo;
          </p>
          <div className="mt-7 flex gap-2.5 flex-wrap">
            {MATCH_BADGES.map((t) => (
              <span
                key={t}
                className="font-mono"
                style={{
                  fontSize: 11.5,
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(74,222,128,0.3)',
                  background: 'rgba(74,222,128,0.06)',
                  color: '#86efac',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="rm-card relative overflow-hidden p-6">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 70% 20%, rgba(255,107,53,0.08), transparent 60%)',
            }}
          />
          <div className="relative">
            <div className="flex justify-between items-center mb-4.5">
              <div
                className="font-mono uppercase text-[var(--rm-muted)]"
                style={{ fontSize: 12, letterSpacing: '0.14em' }}
              >
                เสียงของ @earthrati
              </div>
              <span
                className="font-mono"
                style={{ fontSize: 10.5, color: 'var(--rm-success)' }}
              >
                ● พร้อมใช้
              </span>
            </div>
            {VOICE_ROWS.map((row, i) => (
              <div
                key={row.k}
                className="grid gap-3.5 py-2.5 voice-row"
                style={{
                  gridTemplateColumns: '110px 1fr',
                  borderTop: i ? '1px dashed var(--rm-border-2)' : 'none',
                }}
              >
                <div
                  className="font-thai text-[var(--rm-muted-2)] pt-0.5"
                  style={{ fontSize: 12 }}
                >
                  {row.k}
                </div>
                <div className="font-thai text-[var(--rm-text)]" style={{ fontSize: 13.5 }}>
                  {row.v}
                </div>
              </div>
            ))}
            <div
              className="mt-4.5 p-3.5 rounded-[10px]"
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--rm-border-2)',
              }}
            >
              <div
                className="font-mono uppercase mb-2 text-[var(--rm-muted)]"
                style={{ fontSize: 10, letterSpacing: '0.14em' }}
              >
                ตัวอย่าง · ในเสียงคุณ
              </div>
              <div className="font-thai" style={{ fontSize: 14.5, lineHeight: 1.55 }}>
                <strong>Viral ไม่ใช่ดวง มันคือ signal.</strong>
                <br />
                ถ้าหา content แบบ random คุณก็พลาดทุกครั้ง.
                <br />
                <span className="text-[var(--rm-muted)]">
                  Outlier Score บอกว่า video ตัวไหน reach นอกฐานแฟน.
                </span>
                <br />
                หา signal ทำ craft ปล่อยที่เหลือ.
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .voice-grid { grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr); }
        @media (max-width: 900px) { .voice-grid { grid-template-columns: 1fr; } }
        @media (max-width: 480px) {
          .voice-row { grid-template-columns: 90px 1fr !important; gap: 12px !important; }
        }
      `}</style>
    </section>
  )
}
