/**
 * Cream section — "Never write from a blank page again"
 * 6 feature blocks with polaroid screenshot mockups, alternating left/right.
 * Eden style: each block is a heading + body + tilted polaroid.
 */
import type { ReactNode } from 'react'

const FEATURES: {
  key: string
  title: string
  body: string
  rotation: number
  mockup: ReactNode
}[] = [
  {
    key: 'discover',
    title: 'ผมไม่ดู YouTube เป็นชั่วโมงอีกแล้ว',
    body: 'Riff scan ทุก channel ที่ผม track แล้วเอาเฉพาะตัวที่ดังเกินค่าเฉลี่ย channel มาให้ดู ที่เหลือไม่ต้องเสียเวลา',
    rotation: -2,
    mockup: <DiscoverMock />,
  },
  {
    key: 'creator-look',
    title: 'ดูที่ outlier — ไม่ใช่ที่ followers',
    body: 'channel 10K subs ที่มี video 1M views คือสิ่งน่าเรียน ไม่ใช่ channel 1M subs ที่ video ละ 50K Outlier Score แยกให้ในแก้บเดียว',
    rotation: 2,
    mockup: <CreatorLookMock />,
  },
  {
    key: 'save',
    title: 'เห็นปุ๊บ save ปุ๊บ',
    body: 'idea ดี ๆ ผ่านมาทุกวัน ถ้าไม่เก็บก็ลืม กด save ครั้งเดียวเข้า Idea Library จัดเป็น board ตามชุด content ที่จะปล่อย',
    rotation: -2,
    mockup: <SaveMock />,
  },
  {
    key: 'chat',
    title: 'อ่าน transcript ก่อนเริ่มเขียน',
    body: 'ก่อนจะ recreate ผมต้องเข้าใจก่อนว่า video นั้นใช้ hook แบบไหน structure อะไร Riff ถอดเสียง แปลไทย สรุปประเด็นไว้พร้อม ไม่ต้องเปิด ChatGPT แยก',
    rotation: 2,
    mockup: <ChatMock />,
  },
  {
    key: 'voice',
    title: 'AI ที่ไม่ทำให้คุณกลายเป็น AI',
    body: 'Riff อ่าน post เก่าของคุณ จับจังหวะประโยค คำที่ใช้ซ้ำ วิธี tail off ประโยค แล้วเขียนใหม่ในแบบเดียวกัน ไม่ใช่ ChatGPT generic ที่ทุกคนพูดเหมือนกัน',
    rotation: -2,
    mockup: <VoiceMock />,
  },
  {
    key: 'stack',
    title: '1 video → 4 platform ในนั่งเดียว',
    body: 'แทนที่จะเปิด tab 6 อันมาเขียนทีละ post, Riff generate FB · IG carousel · Reels · YT script ครบทั้ง 4 จาก video เดียว เวลาที่เหลือเอาไปทำของ',
    rotation: 2,
    mockup: <StackMock />,
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
            ทุก step ที่ผมเคยทำเอง.
            <br />
            <span className="rm-serif-italic">รวมในเครื่องเดียว.</span>
          </h2>
          <p
            className="mt-5 mx-auto text-[var(--rm-muted)]"
            style={{ fontSize: 'clamp(15px, 1.3vw, 18px)', lineHeight: 1.7, maxWidth: 560 }}
          >
            ตั้งแต่หา idea จนถึงโพสต์พร้อมลง
            <br />
            ไม่ต้องสลับ tab ไม่ต้องเปิด ChatGPT แยก ไม่ต้อง copy-paste
          </p>
        </div>

        <div className="space-y-24">
          {FEATURES.map((f, i) => (
            <FeatureRow
              key={f.key}
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
  flip,
  title,
  body,
  rotation,
  mockup,
}: {
  flip: boolean
  title: string
  body: string
  rotation: number
  mockup: ReactNode
}) {
  return (
    <div className="grid gap-10 items-center feat-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <div style={{ order: flip ? 2 : 1 }}>
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

/* ===== mockup components ===== */

function MockShell({ children, dark = true }: { children: ReactNode; dark?: boolean }) {
  return (
    <div
      style={{
        background: dark ? '#1A2418' : '#FBF7EC',
        color: dark ? '#F1ECDF' : '#1A2418',
        borderRadius: 4,
        padding: 16,
        minHeight: 240,
        fontSize: 12.5,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  )
}

function DiscoverMock() {
  return (
    <MockShell>
      <div
        style={{ fontSize: 11, color: 'rgba(241,236,223,0.5)', letterSpacing: '0.1em', fontWeight: 600 }}
        className="uppercase mb-3"
      >
        Discover · Outliers
      </div>
      {[
        { t: 'ทำไมคนรวยไม่บอกความจริงเรื่องการเงิน', s: 11.7, c: '#fca5a5' },
        { t: 'I quit my $400K job in 3 minutes', s: 9.2, c: '#fdba74' },
        { t: 'เลิก scroll TikTok 30 วัน', s: 5.1, c: '#fdba74' },
        { t: 'The money trap nobody talks about', s: 3.7, c: '#86efac' },
      ].map((r, i) => (
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
          <span className="flex-1 truncate" style={{ fontSize: 12, fontWeight: 500 }}>
            {r.t}
          </span>
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

function CreatorLookMock() {
  return (
    <MockShell>
      <div
        className="uppercase mb-3"
        style={{ fontSize: 11, color: 'rgba(241,236,223,0.5)', letterSpacing: '0.1em', fontWeight: 600 }}
      >
        Channels · ติดตาม
      </div>
      {[
        { n: '@earthrati', sub: '180K subs', score: 11.7 },
        { n: '@arnunbenz', sub: '420K subs', score: 5.1 },
        { n: '@iamnattha', sub: '2.1M subs', score: 3.7 },
      ].map((c, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-2.5"
          style={{ borderTop: i ? '1px solid rgba(241,236,223,0.06)' : 'none' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF6B35, #C99A6E)',
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{c.n}</div>
              <div style={{ fontSize: 10.5, color: 'rgba(241,236,223,0.5)' }}>
                {c.sub}
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 4,
              background: 'rgba(252,165,165,0.15)',
              color: '#fca5a5',
            }}
          >
            {c.score}×
          </span>
        </div>
      ))}
    </MockShell>
  )
}

function SaveMock() {
  return (
    <MockShell>
      <div
        className="uppercase mb-3"
        style={{ fontSize: 11, color: 'rgba(241,236,223,0.5)', letterSpacing: '0.1em', fontWeight: 600 }}
      >
        Idea Library · 23
      </div>
      {[
        { t: 'ทำไมคนรวยไม่บอกความจริง', tag: 'Money' },
        { t: 'I quit my $400K job', tag: 'Career' },
        { t: 'เลิก scroll 30 วัน', tag: 'Habit' },
        { t: 'The 1 thing rich families teach', tag: 'Money' },
      ].map((it, i) => (
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

function ChatMock() {
  return (
    <MockShell>
      <div
        className="uppercase mb-3"
        style={{ fontSize: 11, color: 'rgba(241,236,223,0.5)', letterSpacing: '0.1em', fontWeight: 600 }}
      >
        Transcript · summary
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.6 }}>
        <p style={{ marginBottom: 10 }}>
          <strong>Hook (0:00–0:08):</strong>{' '}
          &ldquo;ถ้าคุณยังคิดว่า viral = ดวง คุณกำลังพลาดสิ่งสำคัญ&rdquo;
        </p>
        <p style={{ color: 'rgba(241,236,223,0.6)', marginBottom: 10 }}>
          Body: เล่าตัวอย่าง 3 video ที่ดังด้วย structure เดียวกัน
        </p>
        <p style={{ color: 'rgba(241,236,223,0.6)' }}>
          CTA: subscribe + ดูตัวเต็มในคำอธิบายใต้คลิป
        </p>
      </div>
      <div
        className="mt-3.5 pt-3 flex gap-2 flex-wrap"
        style={{ borderTop: '1px dashed rgba(241,236,223,0.10)' }}
      >
        {['hook', 'structure', 'TH ↔ EN'].map((t) => (
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

function VoiceMock() {
  return (
    <MockShell>
      <div
        className="uppercase mb-3"
        style={{ fontSize: 11, color: 'rgba(241,236,223,0.5)', letterSpacing: '0.1em', fontWeight: 600 }}
      >
        Voice profile · @earthrati
      </div>
      {[
        ['โทน', 'ตรงไปตรงมา ไม่อ้อม'],
        ['ประโยค', 'สั้น เฉลี่ย 7 คำ'],
        ['คำถี่', 'outlier · signal · craft'],
        ['เลี่ยง', 'corporate · ขายของเกิน'],
      ].map(([k, v], i) => (
        <div
          key={i}
          className="grid gap-3 py-2"
          style={{
            gridTemplateColumns: '90px 1fr',
            borderTop: i ? '1px dashed rgba(241,236,223,0.10)' : 'none',
          }}
        >
          <div style={{ fontSize: 11.5, color: 'rgba(241,236,223,0.55)' }}>{k}</div>
          <div style={{ fontSize: 12.5, fontWeight: 500 }}>{v}</div>
        </div>
      ))}
      <div
        className="mt-3 flex gap-2 flex-wrap"
        style={{ paddingTop: 10, borderTop: '1px solid rgba(241,236,223,0.06)' }}
      >
        {['โทน 94%', 'จังหวะ 91%', 'คำศัพท์ 88%'].map((t) => (
          <span
            key={t}
            style={{
              fontSize: 10.5,
              padding: '2px 8px',
              borderRadius: 999,
              background: 'rgba(134,239,172,0.10)',
              color: '#86efac',
              border: '1px solid rgba(134,239,172,0.25)',
              fontWeight: 600,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </MockShell>
  )
}

function StackMock() {
  return (
    <MockShell>
      <div
        className="uppercase mb-3"
        style={{ fontSize: 11, color: 'rgba(241,236,223,0.5)', letterSpacing: '0.1em', fontWeight: 600 }}
      >
        4 formats · ครั้งเดียว
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { l: 'YT script', s: 'outline + 5 titles', c: '#fca5a5' },
          { l: 'FB post', s: '800–1,500 คำ', c: '#93C5FD' },
          { l: 'Reels', s: 'hook · body · CTA', c: '#fdba74' },
          { l: 'IG carousel', s: '4–10 slides', c: '#C9A6FF' },
        ].map((b) => (
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
        เสร็จใน 90 วินาที พร้อมลงเลย
      </div>
    </MockShell>
  )
}
