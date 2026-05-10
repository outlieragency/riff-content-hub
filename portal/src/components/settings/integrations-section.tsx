'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Share2,
  Loader2,
  Lock,
  Plug,
  Save,
  Trash2,
} from 'lucide-react'
import { updateNotionConfig } from '@/lib/actions/settings'
import { SettingsCard } from './settings-card'

type Props = {
  notion: {
    configured: boolean
    masked_token: string | null
    content_hub_dsid: string | null
    output_tracker_dsid: string | null
  }
}

export function IntegrationsSection({ notion }: Props) {
  return (
    <SettingsCard icon={Plug} title="Integrations">
      <div className="space-y-3">
        <NotionCard notion={notion} />
        <ComingSoonCard
          icon={Share2}
          name="Facebook Pages"
          description="Auto-post FB post ที่ generate จาก Riff ตรงเข้า Page"
        />
      </div>
    </SettingsCard>
  )
}

function NotionCard({ notion }: { notion: Props['notion'] }) {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [contentHub, setContentHub] = useState(notion.content_hub_dsid ?? '')
  const [outputTracker, setOutputTracker] = useState(
    notion.output_tracker_dsid ?? '',
  )
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [saving, start] = useTransition()

  const idsDirty =
    contentHub !== (notion.content_hub_dsid ?? '') ||
    outputTracker !== (notion.output_tracker_dsid ?? '')

  function save() {
    setError(null)
    setInfo(null)
    start(async () => {
      const res = await updateNotionConfig({
        token: editing && token.trim() ? token : undefined,
        content_hub_dsid: contentHub || null,
        output_tracker_dsid: outputTracker || null,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setInfo('บันทึกแล้ว')
      setEditing(false)
      setToken('')
      router.refresh()
    })
  }

  function clearToken() {
    if (!confirm('ลบ Notion token ?')) return
    start(async () => {
      const res = await updateNotionConfig({ token: null })
      if (!res.ok) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="rounded-[10px] border border-border-soft p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-foreground">Notion</span>
        {notion.configured ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            <CheckCircle2 size={9} />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
            Not configured
          </span>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
        Push draft FB post + cover ไปที่ Notion Content Hub + Output Tracker DB
      </p>

      <div className="space-y-2">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Integration Token
          </label>
          {editing ? (
            <input
              type="password"
              autoFocus
              placeholder="secret_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full h-9 px-3 rounded-[6px] border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
            />
          ) : (
            <div className="flex items-center gap-2 text-xs">
              {notion.masked_token ? (
                <span className="font-mono text-muted-foreground">
                  {notion.masked_token}
                </span>
              ) : (
                <span className="text-muted-foreground italic">ยังไม่ได้ตั้ง</span>
              )}
              <span className="ml-auto inline-flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-blue-600 hover:underline"
                >
                  {notion.masked_token ? 'Update' : 'Add token'}
                </button>
                {notion.masked_token && (
                  <button
                    type="button"
                    onClick={clearToken}
                    disabled={saving}
                    className="text-red-600 hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 size={11} />
                    Remove
                  </button>
                )}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Content Hub DSID (data source ID)
          </label>
          <input
            type="text"
            value={contentHub}
            onChange={(e) => setContentHub(e.target.value)}
            placeholder="data-source-..."
            className="w-full h-9 px-3 rounded-[6px] border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Output Tracker DSID
          </label>
          <input
            type="text"
            value={outputTracker}
            onChange={(e) => setOutputTracker(e.target.value)}
            placeholder="data-source-..."
            className="w-full h-9 px-3 rounded-[6px] border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      </div>

      {error && (
        <div className="mt-2 text-[11px] text-red-700">{error}</div>
      )}
      {info && (
        <div className="mt-2 text-[11px] text-emerald-700">{info}</div>
      )}

      <div className="flex justify-end mt-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || (!editing && !idsDirty)}
          className="inline-flex items-center gap-1 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-xs font-medium rounded-[6px] px-3 py-1.5"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={11} />
          ) : (
            <Save size={11} />
          )}
          Save Notion
        </button>
      </div>
    </div>
  )
}

function ComingSoonCard({
  icon: Icon,
  name,
  description,
}: {
  icon: typeof Share2
  name: string
  description: string
}) {
  return (
    <div className="rounded-[10px] border border-dashed border-border p-3 opacity-70">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">{name}</span>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
          <Lock size={9} />
          Coming soon
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}
