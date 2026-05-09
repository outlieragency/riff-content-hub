import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import {
  ensureHeadlinerDefault,
  listCreativeStyles,
} from '@/lib/actions/creative-styles'
import { TemplateCard } from '@/components/templates/template-card'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  // Auto-seed the Headliner default + backfill existing drafts (idempotent).
  await ensureHeadlinerDefault()
  const styles = await listCreativeStyles()

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-6">
      <PageHeader
        title="Creative Templates"
        description="Style guide สำหรับภาพ — upload reference cover/carousel ที่ชอบ AI จะเรียนสไตล์แล้วใช้ตอน generate"
        actions={
          <Link
            href="/templates/new"
            className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-sm font-medium rounded-[8px] px-3.5 py-2"
          >
            <Plus size={14} strokeWidth={1.8} />
            สร้าง Template
          </Link>
        }
      />

      {styles.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {styles.map((s) => (
            <TemplateCard key={s.id} style={s} />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[14px] border border-dashed border-border p-10 text-center">
      <p className="text-sm text-muted-foreground mb-4">
        ยังไม่มี template — upload reference cover ที่ชอบ AI จะเรียนสไตล์ให้
      </p>
      <Link
        href="/templates/new"
        className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-sm font-medium rounded-[8px] px-4 py-2"
      >
        <Plus size={14} strokeWidth={1.8} />
        สร้าง template แรก
      </Link>
    </div>
  )
}
