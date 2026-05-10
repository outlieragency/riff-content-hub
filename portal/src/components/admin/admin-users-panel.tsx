'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, Check, X, Clock, Infinity as InfinityIcon } from 'lucide-react'
import {
  inviteUser,
  revokeUser,
  extendUser,
  makePermanent,
  type AllowedEmailRow,
} from '@/lib/actions/admin-users'

const PLAN_OPTIONS = [
  { value: '', label: 'ไม่ระบุ' },
  { value: 'beta', label: 'Beta (ฟรี)' },
  { value: 'solo', label: 'Solo' },
  { value: 'daily', label: 'Daily' },
  { value: 'studio', label: 'Studio' },
  { value: 'comp', label: 'Comp (ฟรีถาวร)' },
]

const TRIAL_PRESETS = [
  { value: 0, label: 'ไม่หมดอายุ' },
  { value: 7, label: '7 วัน' },
  { value: 14, label: '14 วัน' },
  { value: 30, label: '30 วัน' },
  { value: 90, label: '90 วัน' },
]

export function AdminUsersPanel({
  rows,
  currentEmail,
}: {
  rows: AllowedEmailRow[]
  currentEmail: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState('beta')
  const [trialDays, setTrialDays] = useState(14)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const filtered = filter
    ? rows.filter(
        (r) =>
          r.email.toLowerCase().includes(filter.toLowerCase()) ||
          r.notes?.toLowerCase().includes(filter.toLowerCase()) ||
          r.plan?.toLowerCase().includes(filter.toLowerCase()),
      )
    : rows

  function reset() {
    setEmail('')
    setPlan('beta')
    setTrialDays(14)
    setNotes('')
    setError(null)
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await inviteUser({
        email,
        plan: plan || undefined,
        trialDays: trialDays || undefined,
        notes: notes || undefined,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      reset()
      setShowAdd(false)
      router.refresh()
    })
  }

  async function onRevoke(targetEmail: string) {
    if (!confirm(`ถอนสิทธิ์ของ ${targetEmail}?`)) return
    startTransition(async () => {
      const res = await revokeUser(targetEmail)
      if (!res.ok) alert(res.error)
      router.refresh()
    })
  }

  async function onExtend(targetEmail: string, days: number) {
    startTransition(async () => {
      const res = await extendUser(targetEmail, days)
      if (!res.ok) alert(res.error)
      router.refresh()
    })
  }

  async function onMakePermanent(targetEmail: string) {
    startTransition(async () => {
      const res = await makePermanent(targetEmail)
      if (!res.ok) alert(res.error)
      router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      {/* Stats + Add button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-2xl font-semibold text-foreground tabular-nums">
              {rows.length}
            </div>
            <div className="text-2xs text-muted-foreground uppercase tracking-wider">
              users ทั้งหมด
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-foreground tabular-nums">
              {rows.filter((r) => !r.expires_at || new Date(r.expires_at) > new Date()).length}
            </div>
            <div className="text-2xs text-muted-foreground uppercase tracking-wider">
              active ตอนนี้
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAdd((s) => !s)
            if (!showAdd) reset()
          }}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-colors"
        >
          <Plus size={14} strokeWidth={1.8} />
          เชิญ user ใหม่
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form
          onSubmit={onAdd}
          className="surface-1 rounded-[14px] p-5 space-y-4"
          style={{ borderColor: 'rgba(255,107,53,0.3)' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-2xs uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
                อีเมล
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full h-10 px-3 rounded-[8px] bg-background border border-border-soft text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-2xs uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
                Plan
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full h-10 px-3 rounded-[8px] bg-background border border-border-soft text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {PLAN_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-2xs uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
                ระยะเวลา
              </label>
              <select
                value={trialDays}
                onChange={(e) => setTrialDays(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-[8px] bg-background border border-border-soft text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {TRIAL_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-2xs uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
                Notes (optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น เพื่อน · paid 2026-05-09 · case study"
                className="w-full h-10 px-3 rounded-[8px] bg-background border border-border-soft text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 rounded-[8px] px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] bg-brand hover:bg-brand-hover text-white text-sm font-medium disabled:opacity-50"
            >
              <Check size={14} strokeWidth={1.8} />
              {pending ? 'กำลังเพิ่ม...' : 'เพิ่ม user'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false)
                reset()
              }}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] border border-border-soft text-foreground text-sm font-medium hover:bg-secondary/40"
            >
              <X size={14} strokeWidth={1.8} />
              ยกเลิก
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="ค้นหา email / plan / notes"
          className="flex-1 h-9 px-3 rounded-[8px] bg-background border border-border-soft text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <span className="text-xs text-muted-foreground">
          {filtered.length} / {rows.length}
        </span>
      </div>

      {/* List */}
      <div className="surface-1 rounded-[14px] overflow-hidden">
        <div
          className="grid items-center gap-4 px-4 py-3 text-2xs uppercase tracking-wider text-muted-foreground font-medium"
          style={{
            gridTemplateColumns: 'minmax(220px,2fr) 100px 140px 1fr 140px',
            borderBottom: '1px solid var(--color-border-soft)',
          }}
        >
          <div>Email</div>
          <div>Plan</div>
          <div>หมดอายุ</div>
          <div>Notes</div>
          <div className="text-right">Actions</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {rows.length === 0
              ? 'ยังไม่มี user — กดเชิญใครสักคนข้างบน'
              : 'ไม่พบที่ตรงกับคำค้นหา'}
          </div>
        ) : (
          filtered.map((r) => (
            <UserRow
              key={r.email}
              row={r}
              isSelf={r.email.toLowerCase() === currentEmail?.toLowerCase()}
              pending={pending}
              onRevoke={onRevoke}
              onExtend={onExtend}
              onMakePermanent={onMakePermanent}
            />
          ))
        )}
      </div>
    </div>
  )
}

function UserRow({
  row,
  isSelf,
  pending,
  onRevoke,
  onExtend,
  onMakePermanent,
}: {
  row: AllowedEmailRow
  isSelf: boolean
  pending: boolean
  onRevoke: (email: string) => void
  onExtend: (email: string, days: number) => void
  onMakePermanent: (email: string) => void
}) {
  const expired = row.expires_at && new Date(row.expires_at) < new Date()
  const expiresText = !row.expires_at
    ? 'ไม่หมดอายุ'
    : expired
      ? 'หมดอายุแล้ว'
      : new Date(row.expires_at).toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short',
          year: '2-digit',
        })

  return (
    <div
      className="grid items-center gap-4 px-4 py-3"
      style={{
        gridTemplateColumns: 'minmax(220px,2fr) 100px 140px 1fr 140px',
        borderBottom: '1px solid var(--color-border-soft)',
        opacity: expired ? 0.55 : 1,
      }}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground truncate">
          {row.email}
          {isSelf && (
            <span className="ml-2 text-2xs px-1.5 py-0.5 rounded bg-brand-soft text-brand font-medium uppercase tracking-wider">
              คุณ
            </span>
          )}
        </div>
        <div className="text-2xs text-muted-foreground mt-0.5">
          เพิ่มเมื่อ{' '}
          {new Date(row.granted_at).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: '2-digit',
          })}
        </div>
      </div>

      <div className="text-xs">
        {row.plan ? (
          <span
            className="inline-block px-2 py-0.5 rounded bg-secondary text-foreground font-medium"
            style={{ fontSize: 11 }}
          >
            {row.plan}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>

      <div className="text-xs flex items-center gap-1.5">
        {!row.expires_at ? (
          <InfinityIcon size={13} className="text-muted-foreground" />
        ) : (
          <Clock
            size={13}
            className={expired ? 'text-red-600' : 'text-muted-foreground'}
          />
        )}
        <span className={expired ? 'text-red-700 font-medium' : 'text-foreground'}>
          {expiresText}
        </span>
      </div>

      <div className="text-xs text-muted-foreground truncate">
        {row.notes || ''}
      </div>

      <div className="flex justify-end gap-1">
        {row.expires_at && (
          <button
            type="button"
            onClick={() => onMakePermanent(row.email)}
            disabled={pending}
            title="ทำให้ไม่หมดอายุ"
            className="h-7 w-7 inline-flex items-center justify-center rounded-[6px] hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            <InfinityIcon size={13} strokeWidth={1.8} />
          </button>
        )}
        <button
          type="button"
          onClick={() => onExtend(row.email, 30)}
          disabled={pending}
          title="ต่อ 30 วัน"
          className="h-7 px-2 inline-flex items-center justify-center rounded-[6px] hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          +30d
        </button>
        {!isSelf && (
          <button
            type="button"
            onClick={() => onRevoke(row.email)}
            disabled={pending}
            title="ถอนสิทธิ์"
            className="h-7 w-7 inline-flex items-center justify-center rounded-[6px] hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-40"
          >
            <Trash2 size={13} strokeWidth={1.8} />
          </button>
        )}
      </div>
    </div>
  )
}
