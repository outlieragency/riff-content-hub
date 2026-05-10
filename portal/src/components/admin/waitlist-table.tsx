'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Copy, ExternalLink } from 'lucide-react'

type WaitlistRow = {
  id: string
  email: string
  name: string | null
  source: string | null
  niche: string | null
  primary_platforms: string[] | null
  follower_range: string | null
  posting_frequency: string | null
  pain: string | null
  contact_handle: string | null
  joined_at: string
  survey_completed_at: string | null
}

const FREQ_LABEL: Record<string, string> = {
  daily: 'ทุกวัน',
  weekly: 'สัปดาห์ละ 2-3',
  sometimes: 'นาน ๆ ที',
  never: 'ยังไม่เริ่ม',
}

export function WaitlistTable({ rows }: { rows: WaitlistRow[] }) {
  const [filter, setFilter] = useState('')
  const [showSurveyOnly, setShowSurveyOnly] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = rows.filter((r) => {
    if (showSurveyOnly && !r.survey_completed_at) return false
    if (!filter) return true
    const q = filter.toLowerCase()
    return (
      r.email.toLowerCase().includes(q) ||
      r.name?.toLowerCase().includes(q) ||
      r.niche?.toLowerCase().includes(q) ||
      r.pain?.toLowerCase().includes(q) ||
      r.contact_handle?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="ค้นหา email / ชื่อ / niche / pain"
          className="flex-1 min-w-[260px] h-9 px-3 rounded-[8px] bg-background border border-border-soft text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={showSurveyOnly}
            onChange={(e) => setShowSurveyOnly(e.target.checked)}
          />
          เฉพาะคนที่กรอก survey
        </label>
        <span className="text-xs text-muted-foreground">
          {filtered.length} / {rows.length}
        </span>
        <button
          type="button"
          onClick={() => copyEmailsToClipboard(filtered)}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] border border-border-soft text-foreground text-sm font-medium hover:bg-secondary/40 transition-colors"
        >
          <Copy size={13} strokeWidth={1.8} />
          copy emails
        </button>
      </div>

      <div className="surface-1 rounded-[14px] overflow-hidden">
        <div
          className="grid items-center gap-3 px-4 py-3 text-2xs uppercase tracking-wider text-muted-foreground font-medium"
          style={{
            gridTemplateColumns: '24px 2fr 1fr 1fr 1fr 100px',
            borderBottom: '1px solid var(--color-border-soft)',
          }}
        >
          <div></div>
          <div>Email / Name</div>
          <div>Niche</div>
          <div>Followers</div>
          <div>Frequency</div>
          <div className="text-right">Joined</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {rows.length === 0
              ? 'ยังไม่มีใครเข้า waitlist'
              : 'ไม่พบที่ตรงคำค้นหา'}
          </div>
        ) : (
          filtered.map((r) => (
            <Row
              key={r.id}
              row={r}
              expanded={expanded === r.id}
              onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function Row({
  row,
  expanded,
  onToggle,
}: {
  row: WaitlistRow
  expanded: boolean
  onToggle: () => void
}) {
  const hasDetail =
    row.pain || row.contact_handle || (row.primary_platforms?.length ?? 0) > 0

  return (
    <>
      <div
        className="grid items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/30 transition-colors"
        style={{
          gridTemplateColumns: '24px 2fr 1fr 1fr 1fr 100px',
          borderBottom: '1px solid var(--color-border-soft)',
        }}
        onClick={hasDetail ? onToggle : undefined}
      >
        <div className="text-muted-foreground">
          {hasDetail &&
            (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground truncate flex items-center gap-2">
            {row.email}
            {row.survey_completed_at && (
              <span
                className="text-2xs px-1.5 py-0.5 rounded uppercase tracking-wider"
                style={{
                  background: 'rgba(74,123,58,0.12)',
                  color: '#3D6A2D',
                  fontWeight: 600,
                  fontSize: 10,
                }}
              >
                survey
              </span>
            )}
          </div>
          <div className="text-2xs text-muted-foreground mt-0.5">
            {row.name ?? '—'}
            {row.source && <span className="ml-2 opacity-60">via {row.source}</span>}
          </div>
        </div>
        <div className="text-xs text-foreground truncate">
          {row.niche ?? <span className="text-muted-foreground">—</span>}
        </div>
        <div className="text-xs text-foreground">
          {row.follower_range ?? <span className="text-muted-foreground">—</span>}
        </div>
        <div className="text-xs text-foreground">
          {row.posting_frequency
            ? FREQ_LABEL[row.posting_frequency] ?? row.posting_frequency
            : <span className="text-muted-foreground">—</span>}
        </div>
        <div className="text-2xs text-muted-foreground text-right">
          {new Date(row.joined_at).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
          })}
        </div>
      </div>

      {expanded && hasDetail && (
        <div
          className="px-4 py-4 bg-secondary/30 space-y-3"
          style={{ borderBottom: '1px solid var(--color-border-soft)' }}
        >
          {(row.primary_platforms?.length ?? 0) > 0 && (
            <DetailRow label="Platforms">
              <div className="flex flex-wrap gap-1.5">
                {row.primary_platforms?.map((p) => (
                  <span
                    key={p}
                    className="text-2xs px-2 py-0.5 rounded bg-background text-foreground"
                    style={{ fontSize: 11, fontWeight: 500 }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </DetailRow>
          )}
          {row.pain && (
            <DetailRow label="Pain">
              <div className="text-sm text-foreground whitespace-pre-wrap">
                {row.pain}
              </div>
            </DetailRow>
          )}
          {row.contact_handle && (
            <DetailRow label="Contact">
              <div className="text-sm text-foreground flex items-center gap-1.5">
                {row.contact_handle}
                <a
                  href={resolveContactUrl(row.contact_handle)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-brand"
                  title="เปิดในแท็บใหม่"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </DetailRow>
          )}
          {row.survey_completed_at && (
            <DetailRow label="Survey">
              <div className="text-2xs text-muted-foreground">
                ส่งเมื่อ{' '}
                {new Date(row.survey_completed_at).toLocaleString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </DetailRow>
          )}
        </div>
      )}
    </>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: '90px 1fr' }}>
      <div className="text-2xs uppercase tracking-wider text-muted-foreground font-medium pt-0.5">
        {label}
      </div>
      <div>{children}</div>
    </div>
  )
}

function resolveContactUrl(handle: string): string {
  const h = handle.trim()
  if (h.startsWith('http')) return h
  if (h.startsWith('@')) return `https://instagram.com/${h.slice(1)}`
  return '#'
}

function copyEmailsToClipboard(rows: WaitlistRow[]) {
  if (rows.length === 0) return
  const emails = rows.map((r) => r.email).join(', ')
  navigator.clipboard.writeText(emails).then(
    () => alert(`copied ${rows.length} emails`),
    () => alert('copy ไม่สำเร็จ'),
  )
}
