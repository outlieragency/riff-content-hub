/**
 * Cream section — 4 numbered steps with polaroid mockups (alternating L/R).
 * Mockups use foreign creators (Dan Koe, Ali Abdaal, Hormozi, etc.) since
 * Riff is positioned for Thai creators recreating from foreign content.
 */
import type { ReactNode } from 'react'

const FEATURES: {
  step: string
  key: string
  title: string
  body: string
  rotation: number
  mockup: ReactNode
}[] = [
  {
    step: '01',
    key: 'research',
    title: 'Research หาไอเดีย Content',
    body: 'คุณไม่ต้องเสียเวลานั่งดู YouTube เป็นชั่วโมง Riff เข้าไป scan content ใน niche ของคุณ และดึงขึ้นมาโชว์ให้ดูทุกวัน ทุกอัน proof แล้วว่า viral จริง ๆ',
    rotation: -2,
    mockup: <ResearchMock />,
  },
  {
    step: '02',
    key: 'organize',
    title: 'Organize บันทึกทุกไอเดียที่น่าสนใจไว้ในที่เดียว',
    body: 'เห็นปุ๊บ save ปั๊บ คุณบันทึกไอเดียที่สนใจไว้ใน Riff ได้ทันที ไม่ต้องเปลี่ยน app ไปมาให้ยุ่งยาก',
    rotation: 2,
    mockup: <OrganizeMock />,
  },
  {
    step: '03',
    key: 'decode',
    title: 'แกะโครงสร้างของคลิปที่ Viral',
    body: 'Riff ทำการอ่าน transcript ของ video แล้วสรุปเป็นภาษาไทยให้เข้าใจง่าย ๆ พร้อมกับวิเคราะห์โครงสร้างว่าทำไมคลิปนี้ถึง viral',
    rotation: -2,
    mockup: <DecodeMock />,
  },
  {
    step: '04',
    key: 'recreate',
    title: 'Recreate สร้าง Content ในสไตล์คุณจาก Video ที่ Viral',
    body: 'AI ghostwriter เขียน Facebook Post ในเสียงและสไตล์ของคุณ ใช้ FB cover template + writing prompt ที่คุณ upload ไว้',
    rotation: 2,
    mockup: <RecreateMock />,
  },
]

export function FeaturesGrid() {
  return (
    <section
      id="features"
      className="rm-section"
      style={{ padding: '120px 24px' }}
    >
      <div className="rm-container">
        <div className="text-center mx-auto mb-20" style={{ maxWidth: 760 }}>
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
            ทุก Step ที่ Content Team ทำ
            <br />
            <span className="rm-serif-italic">รวมไว้ใน Tool เดียว</span>
          </h2>
          <p
            className="mt-5 mx-auto text-[var(--rm-muted)]"
            style={{ fontSize: 'clamp(15px, 1.3vw, 18px)', lineHeight: 1.7, maxWidth: 560 }}
          >
            ตั้งแต่หา idea จนถึงโพสต์พร้อมลง
            <br />
            ไม่ต้องสร้างทีม ไม่ต้องจ้าง agency ไม่ต้องสลับ tab
          </p>
        </div>

        <div className="space-y-24">
          {FEATURES.map((f, i) => (
            <FeatureRow
              key={f.key}
              step={f.step}
              flip={i % 2 === 1}
              title={f.title}
              body={f.body}
              rotation={f.rotation}
              mockup={f.mockup}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureRow({
  step,
  flip,
  title,
  body,
  rotation,
  mockup,
}: {
  step: string
  flip: boolean
  title: string
  body: string
  rotation: number
  mockup: ReactNode
}) {
  return (
    <div className="grid gap-10 items-center feat-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <div style={{ order: flip ? 2 : 1 }}>
        <div
          className="rm-serif-italic"
          style={{
            fontSize: 'clamp(48px, 5vw, 72px)',
            color: 'var(--rm-accent)',
            lineHeight: 1,
            letterSpacing: '-0.04em',
            marginBottom: 12,
          }}
        >
          {step}
        </div>
        <h3
          style={{
            fontSize: 'clamp(24px, 2.6vw, 34px)',
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: '-0.025em',
            color: 'var(--rm-text)',
            textWrap: 'balance' as const,
          }}
        >
          {title}
        </h3>
        <p
          className="mt-4 text-[var(--rm-muted)]"
          style={{ fontSize: 'clamp(15px, 1.2vw, 17px)', lineHeight: 1.65, maxWidth: 460 }}
        >
          {body}
        </p>
      </div>
      <div style={{ order: flip ? 1 : 2 }}>
        <div className="rm-polaroid" style={{ transform: `rotate(${rotation}deg)` }}>
          {mockup}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .feat-row { grid-template-columns: 1fr !important; }
          .feat-row > div:first-child { order: 1 !important; }
          .feat-row > div:last-child { order: 2 !important; }
        }
      `}</style>
    </div>
  )
}

/* ===== mockup components — foreign creator content ===== */

function MockShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: '#1A2418',
        color: '#F1ECDF',
        borderRadius: 4,
        padding: 16,
        minHeight: 260,
        fontSize: 12.5,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  )
}

function MockHeader({ children }: { children: ReactNode }) {
  return (
    <div
      className="uppercase mb-3"
      style={{
        fontSize: 11,
        color: 'rgba(241,236,223,0.5)',
        letterSpacing: '0.1em',
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  )
}

function ResearchMock() {
  const items = [
    {
      handle: 'Alex Hormozi',
      t: 'The 5-step framework I used to scale to $100M',
      s: 11.7,
      c: '#fca5a5',
    },
    {
      handle: 'Dan Koe',
      t: 'Why most creators stay broke (and the 3 levels above)',
      s: 9.2,
      c: '#fdba74',
    },
    {
      handle: 'Ali Abdaal',
      t: "How I spent my first $100k as a YouTuber",
      s: 5.1,
      c: '#fdba74',
    },
    {
      handle: 'Hamza Ahmed',
      t: 'The art of self-discipline for solopreneurs',
      s: 3.7,
      c: '#86efac',
    },
  ]
  return (
    <MockShell>
      <MockHeader>Discover · Outliers</MockHeader>
      {items.map((r, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 py-2"
          style={{ borderTop: i ? '1px solid rgba(241,236,223,0.06)' : 'none' }}
        >
          <div
            style={{
              width: 50,
              height: 30,
              borderRadius: 3,
              background: 'rgba(241,236,223,0.08)',
              flexShrink: 0,
            }}
          />
          <div className="flex-1 min-w-0">
            <div
              className="truncate"
              style={{ fontSize: 12, fontWeight: 500 }}
            >
              {r.t}
            </div>
            <div
              style={{ fontSize: 10.5, color: 'rgba(241,236,223,0.5)', marginTop: 1 }}
            >
              {r.handle}
            </div>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 3,
              background: `${r.c}20`,
              color: r.c,
            }}
          >
            {r.s.toFixed(1)}×
          </span>
        </div>
      ))}
    </MockShell>
  )
}

function OrganizeMock() {
  const items = [
    { t: 'How I scaled to $100M (Hormozi)', tag: 'Money' },
    { t: '$100k YouTube spending (Ali Abdaal)', tag: 'Career' },
    { t: 'The 3 levels of creators (Dan Koe)', tag: 'Mindset' },
    { t: 'Self-discipline for solopreneurs', tag: 'Habit' },
    { t: 'Why your offer is broken', tag: 'Money' },
  ]
  return (
    <MockShell>
      <MockHeader>Idea Library · 24</MockHeader>
      {items.map((it, i) => (
        <div
          key={i}
          className="flex justify-between items-center py-2"
          style={{ borderTop: i ? '1px dashed rgba(241,236,223,0.10)' : 'none' }}
        >
          <span style={{ fontSize: 12, fontWeight: 500 }}>{it.t}</span>
          <span
            style={{
              fontSize: 10.5,
              padding: '2px 8px',
              borderRadius: 999,
              background: 'rgba(201,154,110,0.15)',
              color: '#C99A6E',
              fontWeight: 600,
            }}
          >
            {it.tag}
          </span>
        </div>
      ))}
    </MockShell>
  )
}

function DecodeMock() {
  return (
    <MockShell>
      <MockHeader>Transcript · summary</MockHeader>
      <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
        <p style={{ marginBottom: 10 }}>
          <strong>Hook (0:00 - 0:08):</strong>{' '}
          &ldquo;Most creators stay broke because they think like employees,
          not owners&rdquo;
        </p>
        <p style={{ color: 'rgba(241,236,223,0.65)', marginBottom: 10 }}>
          <strong style={{ color: 'rgba(241,236,223,0.85)' }}>Body:</strong>{' '}
          แบ่ง creator เป็น 3 ระดับ: employee mindset, freelancer, owner
          แต่ละระดับเปลี่ยน leverage ที่ใช้คนละแบบ
        </p>
        <p style={{ color: 'rgba(241,236,223,0.65)' }}>
          <strong style={{ color: 'rgba(241,236,223,0.85)' }}>CTA:</strong>{' '}
          subscribe + ดู free mini-course ที่ description
        </p>
      </div>
      <div
        className="mt-3.5 pt-3 flex gap-2 flex-wrap"
        style={{ borderTop: '1px dashed rgba(241,236,223,0.10)' }}
      >
        {['hook', '3-level structure', 'TH summary'].map((t) => (
          <span
            key={t}
            style={{
              fontSize: 10.5,
              padding: '3px 8px',
              borderRadius: 4,
              background: 'rgba(241,236,223,0.06)',
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </MockShell>
  )
}

function RecreateMock() {
  const formats = [
    { l: 'FB post', s: '800-1,500 คำ + cover', c: '#93C5FD' },
    { l: 'FB cover', s: 'ภาพปกสไตล์เดียวกัน', c: '#FCD68B' },
  ]
  return (
    <MockShell>
      <MockHeader>Facebook ghostwriter</MockHeader>
      <div
        style={{
          fontSize: 11.5,
          color: 'rgba(241,236,223,0.7)',
          marginBottom: 12,
          padding: '8px 10px',
          borderRadius: 4,
          background: 'rgba(255,107,53,0.10)',
          border: '1px solid rgba(255,107,53,0.20)',
        }}
      >
        source: <span style={{ color: '#FFB088', fontWeight: 600 }}>Dan Koe</span>{' '}
        · The 3 levels of creators
      </div>
      <div className="grid grid-cols-2 gap-2">
        {formats.map((b) => (
          <div
            key={b.l}
            style={{
              padding: 10,
              background: 'rgba(241,236,223,0.04)',
              borderRadius: 6,
              borderLeft: `2px solid ${b.c}`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: b.c }}>{b.l}</div>
            <div
              style={{ fontSize: 10.5, color: 'rgba(241,236,223,0.55)', marginTop: 2 }}
            >
              {b.s}
            </div>
          </div>
        ))}
      </div>
      <div
        className="mt-3 text-center"
        style={{ fontSize: 11, color: 'rgba(241,236,223,0.55)' }}
      >
        ในเสียงของคุณ พร้อมลงเลย
      </div>
    </MockShell>
  )
}
