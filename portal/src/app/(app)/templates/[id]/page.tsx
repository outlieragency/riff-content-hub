import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { getCreativeStyle } from '@/lib/actions/creative-styles'
import { TemplateEditor } from '@/components/templates/template-editor'

export const dynamic = 'force-dynamic'

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const style = await getCreativeStyle(id)
  if (!style) notFound()

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-6">
      <Link
        href="/templates"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
      >
        <ChevronLeft size={12} />
        Templates
      </Link>
      <PageHeader
        title={style.name}
        description={`${style.format_type} · ${style.reference_images.length} reference images`}
      />
      <TemplateEditor initial={style} />
    </div>
  )
}
