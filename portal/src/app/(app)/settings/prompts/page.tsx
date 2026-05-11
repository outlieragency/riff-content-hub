import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft, FileText } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { PromptEditor } from '@/components/settings/prompt-editor'
import {
  getPromptDetail,
  listEditablePrompts,
  type PromptListItemView,
} from '@/lib/actions/prompts'

export const dynamic = 'force-dynamic'

export default async function PromptsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const params = await searchParams
  const list = await listEditablePrompts()

  if (list.length === 0) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 py-8 space-y-6">
        <PageHeader title="Prompts" description="ไม่มี prompt ให้แก้ไข" />
      </div>
    )
  }

  const selectedKey = params.key ?? list[0].key

  // Verify selected key exists in whitelist; else fall back to first
  const safeKey = list.find((p) => p.key === selectedKey)
    ? selectedKey
    : list[0].key

  if (safeKey !== selectedKey) {
    redirect(`/settings/prompts?key=${encodeURIComponent(safeKey)}`)
  }

  const detail = await getPromptDetail(safeKey)

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8 space-y-5">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={14} />
          Settings
        </Link>
      </div>

      <PageHeader
        title="Prompts"
        description="แก้ไข prompt ที่ใช้ generate content. การแก้ไขจะ apply กับการ generate ครั้งต่อไป (ไม่ต้อง redeploy)"
      />

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5">
        <PromptListSidebar items={list} selectedKey={safeKey} />

        {'error' in detail ? (
          <div className="rounded-[12px] border border-status-red-border bg-status-red-bg p-5 text-sm text-status-red-text">
            โหลด prompt ไม่ได้: {detail.error}
          </div>
        ) : (
          <PromptEditor
            key={detail.key}
            promptKey={detail.key}
            label={detail.label}
            group={detail.group}
            description={detail.description}
            defaultContent={detail.default_content}
            userContent={detail.user_content}
            overridden={detail.overridden}
            updatedAt={detail.updated_at}
          />
        )}
      </div>
    </div>
  )
}

function PromptListSidebar({
  items,
  selectedKey,
}: {
  items: PromptListItemView[]
  selectedKey: string
}) {
  // Group items by `group` key
  const groups = new Map<string, PromptListItemView[]>()
  for (const item of items) {
    const arr = groups.get(item.group) ?? []
    arr.push(item)
    groups.set(item.group, arr)
  }

  return (
    <aside className="rounded-[12px] border border-border-soft bg-card p-2 md:p-3 h-fit sticky top-4">
      <nav className="space-y-3">
        {Array.from(groups.entries()).map(([groupName, groupItems]) => (
          <div key={groupName}>
            <div className="px-2 pt-1 pb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              {groupName}
            </div>
            <div className="space-y-0.5">
              {groupItems.map((p) => {
                const active = p.key === selectedKey
                return (
                  <Link
                    key={p.key}
                    href={`/settings/prompts?key=${encodeURIComponent(p.key)}`}
                    className={`block px-2.5 py-2 rounded-[8px] text-sm transition-colors ${
                      active
                        ? 'bg-brand-soft text-brand font-medium'
                        : 'text-foreground hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText
                        size={13}
                        className={
                          active ? 'text-brand' : 'text-muted-foreground'
                        }
                      />
                      <span className="flex-1 truncate">{p.label}</span>
                      {p.overridden && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
