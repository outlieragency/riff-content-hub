'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, User } from 'lucide-react'
import { updateProfile } from '@/lib/actions/settings'
import type { LanguagePref } from '@/lib/types/user-settings'
import { SettingsCard } from './settings-card'

const COMMON_TZ = [
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Manila',
  'Asia/Ho_Chi_Minh',
  'Asia/Kuala_Lumpur',
  'America/Los_Angeles',
  'America/New_York',
  'Europe/London',
  'UTC',
]

export function ProfileSection({
  email,
  displayName,
  timezone,
  language,
}: {
  email: string
  displayName: string | null
  timezone: string
  language: LanguagePref
}) {
  const router = useRouter()
  const [name, setName] = useState(displayName ?? '')
  const [tz, setTz] = useState(timezone)
  const [lang, setLang] = useState<LanguagePref>(language)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [saving, start] = useTransition()

  const dirty =
    name !== (displayName ?? '') || tz !== timezone || lang !== language

  function save() {
    setError(null)
    setInfo(null)
    start(async () => {
      const res = await updateProfile({
        display_name: name || null,
        timezone: tz,
        language: lang,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setInfo('บันทึกแล้ว')
      router.refresh()
    })
  }

  return (
    <SettingsCard icon={User} title="Profile">
      <div className="space-y-4">
        <Field label="Email">
          <div className="text-sm text-foreground">{email}</div>
        </Field>

        <Field label="Display name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น Earth Rati"
            maxLength={64}
            className="w-full h-10 px-3 rounded-[8px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </Field>

        <Field label="Timezone">
          <select
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="w-full h-10 px-3 rounded-[8px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {COMMON_TZ.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
            {!COMMON_TZ.includes(tz) && <option value={tz}>{tz}</option>}
          </select>
        </Field>

        <Field label="Language">
          <div className="flex gap-2">
            <LangButton
              active={lang === 'th'}
              onClick={() => setLang('th')}
              label="ไทย"
            />
            <LangButton
              active={lang === 'en'}
              onClick={() => setLang('en')}
              label="English"
            />
          </div>
        </Field>

        {error && <Notice tone="error" message={error} />}
        {info && <Notice tone="success" message={info} />}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium rounded-[8px] px-4 py-2"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save size={14} />
                Save profile
              </>
            )}
          </button>
        </div>
      </div>
    </SettingsCard>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function LangButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-foreground text-background'
          : 'bg-secondary text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}

function Notice({
  tone,
  message,
}: {
  tone: 'error' | 'success'
  message: string
}) {
  const cls =
    tone === 'error'
      ? 'bg-status-red-bg border-status-red-border text-status-red-text'
      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
  return (
    <div className={`text-sm rounded-[8px] border px-3 py-2 ${cls}`}>
      {message}
    </div>
  )
}
