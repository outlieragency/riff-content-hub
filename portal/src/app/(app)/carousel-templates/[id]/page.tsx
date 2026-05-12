import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { CarouselTemplateEditor } from '@/components/carousel-templates/editor'
import { getCarouselTemplate } from '@/lib/actions/carousel-templates'

export const dynamic = 'force-dynamic'

export default async function CarouselTemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const template = await getCarouselTemplate(id)
  if (!template) notFound()

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-4">
      <div>
        <Link
          href="/carousel-templates"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={14} />
          Carousel templates
        </Link>
      </div>

      <CarouselTemplateEditor template={template} />
    </div>
  )
}
