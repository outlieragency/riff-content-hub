'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, CheckCircle2, Lock, Loader2, Save, X, Zap } from 'lucide-react'
import {
  clearProviderApiKey,
  setProviderApiKey,
  testProviderApiKey,
  updateTaskModels,
} from '@/lib/actions/settings'
import {
  PROVIDER_MODELS,
  TASK_LABELS,
  TASK_DESCRIPTIONS,
  type ProviderInfo,
  type TaskKind,
} from '@/lib/types/user-settings'
import { SettingsCard } from './settings-card'

export function AiProvidersSection({
  providers,
  taskModels,
}: {
  providers: ProviderInfo[]
  taskModels: Record<TaskKind, string>
}) {
  const [models, setModels] = useState(taskModels)
  const [savingModels, startSavingModels] = useTransition()
  const [modelError, setModelError] = useState<string | null>(null)
  const [modelInfo, setModelInfo] = useState<string | null>(null)
  const router = useRouter()

  const dirty =
    JSON.stringify(models) !== JSON.stringify(taskModels)

  function saveModels() {
    setModelError(null)
    setModelInfo(null)
    startSavingModels(async () => {
      const res = await updateTaskModels(models)
      if (!res.ok) {
        setModelError(res.error)
        return
      }
      setModelInfo('Model assignment บันทึกแล้ว')
      router.refresh()
    })
  }

  // Build available models list (only from providers that are available + configured)
  const availableModelOptions = providers
    .filter((p) => p.available)
    .flatMap((p) => PROVIDER_MODELS[p.id])
    .filter((m) => m.available)

  return (
    <SettingsCard icon={Bot} title="AI Providers">
      <div className="space-y-3">
        {providers.map((p) => (
          <ProviderCard key={p.id} provider={p} onChanged={() => router.refresh()} />
        ))}
      </div>

      <div className="mt-6 pt-5 border-t border-border-soft">
        <h3 className="text-sm font-semibold text-foreground mb-1 inline-flex items-center gap-1.5">
          <Zap size={13} className="text-brand" />
          Model assignment
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          เลือก model ที่ใช้สำหรับแต่ละ task — ใช้ default ของ Riff (Anthropic) ก็ได้
        </p>

        <div className="space-y-3">
          {(Object.keys(TASK_LABELS) as TaskKind[]).map((task) => (
            <TaskRow
              key={task}
              task={task}
              currentModel={models[task]}
              options={availableModelOptions}
              onChange={(m) =>
                setModels((cur) => ({ ...cur, [task]: m }))
              }
            />
          ))}
        </div>

        {modelError && (
          <div className="mt-3 text-sm bg-status-red-bg border border-status-red-border text-status-red-text rounded-[8px] px-3 py-2">
            {modelError}
          </div>
        )}
        {modelInfo && (
          <div className="mt-3 text-sm bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-[8px] px-3 py-2">
            {modelInfo}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={saveModels}
            disabled={!dirty || savingModels}
            className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium rounded-[8px] px-4 py-2"
          >
            {savingModels ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Save size={14} />
            )}
            Save model assignment
          </button>
        </div>
      </div>
    </SettingsCard>
  )
}

function ProviderCard({
  provider,
  onChanged,
}: {
  provider: ProviderInfo
  onChanged: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)

  async function save() {
    setError(null)
    setTestResult(null)
    setBusy(true)
    try {
      const res = await setProviderApiKey(provider.id, keyInput)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setKeyInput('')
      setEditing(false)
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  async function clear() {
    if (!confirm(`ลบ API key ของ ${provider.name} ?`)) return
    setBusy(true)
    setError(null)
    try {
      const res = await clearProviderApiKey(provider.id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  async function test() {
    setBusy(true)
    setTestResult(null)
    setError(null)
    try {
      const res = await testProviderApiKey(provider.id)
      if (res.ok) setTestResult(res.message)
      else setError(res.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={`rounded-[10px] border p-3 ${
        provider.available ? 'border-border-soft' : 'border-dashed border-border opacity-70'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-foreground">
              {provider.name}
            </span>
            {provider.available ? (
              <StatusBadge status={provider.status} />
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                <Lock size={9} />
                Coming soon
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {provider.description}
          </p>
        </div>
      </div>

      {provider.available && (
        <>
          {editing ? (
            <div className="flex flex-col gap-2 mt-2">
              <input
                type="password"
                autoFocus
                placeholder={
                  provider.id === 'anthropic'
                    ? 'sk-ant-...'
                    : provider.id === 'openai'
                      ? 'sk-...'
                      : 'API key'
                }
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                disabled={busy}
                className="w-full h-9 px-3 rounded-[6px] border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false)
                    setKeyInput('')
                    setError(null)
                  }}
                  disabled={busy}
                  className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={busy || !keyInput.trim()}
                  className="inline-flex items-center gap-1 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-xs font-medium rounded-[6px] px-3 py-1.5"
                >
                  {busy ? <Loader2 className="animate-spin" size={11} /> : <Save size={11} />}
                  Save key
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2 text-xs">
              {provider.maskedKey ? (
                <span className="font-mono text-muted-foreground">
                  {provider.maskedKey}
                </span>
              ) : (
                <span className="text-muted-foreground italic">
                  ยังไม่ได้ตั้ง API key
                </span>
              )}
              <span className="ml-auto inline-flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  disabled={busy}
                  className="text-blue-600 hover:underline"
                >
                  {provider.maskedKey ? 'Update' : 'Add key'}
                </button>
                {provider.maskedKey && (
                  <>
                    <button
                      type="button"
                      onClick={test}
                      disabled={busy}
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      {busy ? (
                        <Loader2 className="animate-spin" size={10} />
                      ) : null}
                      Test
                    </button>
                    <button
                      type="button"
                      onClick={clear}
                      disabled={busy}
                      className="text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </>
                )}
              </span>
            </div>
          )}

          {testResult && (
            <div className="mt-2 text-[11px] text-emerald-700 inline-flex items-center gap-1">
              <CheckCircle2 size={11} />
              {testResult}
            </div>
          )}
          {error && (
            <div className="mt-2 text-[11px] text-red-700 inline-flex items-center gap-1">
              <X size={11} />
              {error}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: ProviderInfo['status'] }) {
  if (status === 'configured') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
        <CheckCircle2 size={9} />
        Active
      </span>
    )
  }
  if (status === 'invalid') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-800">
        <X size={9} />
        Invalid
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
      Not configured
    </span>
  )
}

function TaskRow({
  task,
  currentModel,
  options,
  onChange,
}: {
  task: TaskKind
  currentModel: string
  options: { id: string; label: string; available: boolean }[]
  onChange: (modelId: string) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-2 items-center">
      <div>
        <div className="text-sm font-medium text-foreground">
          {TASK_LABELS[task]}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {TASK_DESCRIPTIONS[task]}
        </p>
      </div>
      <select
        value={currentModel}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 px-2 rounded-[6px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
      >
        {options.map((m) => (
          <option key={m.id} value={m.id} disabled={!m.available}>
            {m.label}
          </option>
        ))}
        {/* If currentModel not in available options (e.g. legacy), show as unavailable */}
        {!options.find((o) => o.id === currentModel) && (
          <option value={currentModel} disabled>
            {currentModel} (unavailable)
          </option>
        )}
      </select>
    </div>
  )
}
