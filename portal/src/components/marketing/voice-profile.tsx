const VOICE_ROWS = [
  { k: 'Tone', v: 'Direct, philosophical' },
  { k: 'Sentence length', v: 'Short, punchy (avg. 7 words)' },
  {
    k: 'Signature moves',
    v: 'Equation-style definitions, line breaks for rhythm',
  },
  { k: 'Frequent words', v: 'outlier · signal · break out · voice · craft' },
  { k: 'Avoids', v: 'corporate hype · long sentences · adverbs' },
]

const MATCH_BADGES = [
  'Tone match: 94%',
  'Cadence match: 91%',
  'Vocab match: 88%',
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
            NOT GENERIC AI
          </div>
          <h2
            className="font-thai mt-3.5"
            style={{
              fontSize: 'clamp(32px, 4.4vw, 52px)',
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: '-0.025em',
              textWrap: 'balance' as const,
            }}
          >
            AI ที่เขียน
            <span style={{ color: 'var(--rm-accent)' }}>เหมือนคุณจริงๆ</span>
          </h2>
          <p
            className="font-thai text-[var(--rm-muted)]"
            style={{ fontSize: 18, marginTop: 18, lineHeight: 1.55 }}
          >
            Riff เรียน voice ของคุณจาก content เก่า — sentence rhythm, signature
            moves, คำที่คุณใช้บ่อย — แล้วใช้ recreate ทุก post.
          </p>
          <p
            className="italic text-[var(--rm-muted-2)]"
            style={{ fontSize: 16, marginTop: 12, maxWidth: 480 }}
          >
            &ldquo;Generic AI slop has a tell. Your voice doesn&apos;t.&rdquo;
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
                VOICE PROFILE — @earthrati
              </div>
              <span
                className="font-mono"
                style={{ fontSize: 10.5, color: 'var(--rm-success)' }}
              >
                ● TRAINED
              </span>
            </div>
            {VOICE_ROWS.map((row, i) => (
              <div
                key={row.k}
                className="grid gap-3.5 py-2.5"
                style={{
                  gridTemplateColumns: '120px 1fr',
                  borderTop: i ? '1px dashed var(--rm-border-2)' : 'none',
                }}
              >
                <div
                  className="font-mono uppercase text-[var(--rm-muted-2)] pt-0.5"
                  style={{ fontSize: 11, letterSpacing: '0.08em' }}
                >
                  {row.k}
                </div>
                <div className="text-[var(--rm-text)]" style={{ fontSize: 13.5 }}>
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
                SAMPLE — IN YOUR VOICE
              </div>
              <div className="font-thai" style={{ fontSize: 14.5, lineHeight: 1.55 }}>
                <strong>Viral = signal, not luck.</strong>
                <br />
                ถ้าคุณยังหาแบบ random — คุณยัง miss อยู่.
                <br />
                <span className="text-[var(--rm-muted)]">
                  Outlier Score บอกว่า: video ตัวไหน reach ออกนอกฐานแฟน.
                </span>
                <br />
                หา signal. ทำ craft. ปล่อยที่เหลือ.
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .voice-grid { grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr); }
        @media (max-width: 900px) { .voice-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  )
}
