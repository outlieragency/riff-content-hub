import { ImageIcon } from 'lucide-react'
import type { CarouselTemplateRow } from '@/lib/actions/carousel-templates'

export function CarouselTemplateCard({
  template,
}: {
  template: CarouselTemplateRow
}) {
  const previewUrl = template.thumbnail_url ?? template.source_image_url

  return (
    <div className="group rounded-[12px] border border-border-soft bg-card overflow-hidden hover:border-brand transition-colors">
      <div
        className="relative w-full bg-secondary"
        style={{
          aspectRatio: `${template.width} / ${template.height}`,
        }}
      >
        {previewUrl ? (
          // Source image preview — eslint-disable here because we don't
          // know the dimensions ahead of time and these are user uploads.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={template.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <ImageIcon size={32} />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-foreground text-sm truncate">
          {template.name}
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {template.schema.length} field{template.schema.length !== 1 && 's'} ·{' '}
          {template.width}×{template.height}
        </p>
      </div>
    </div>
  )
}
