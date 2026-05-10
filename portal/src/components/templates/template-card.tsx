import Link from 'next/link'
import Image from 'next/image'
import { ImageIcon, Star } from 'lucide-react'
import type { CreativeStyleSummary } from '@/lib/types/creative-style'

const FORMAT_LABELS: Record<string, string> = {
  cover: 'FB Cover',
  carousel: 'IG Carousel',
  thumbnail: 'YT Thumbnail',
  reel: 'Reel',
}

export function TemplateCard({ style }: { style: CreativeStyleSummary }) {
  return (
    <Link
      href={`/templates/${style.id}`}
      className="group block rounded-[14px] border border-border-soft bg-card overflow-hidden hover:border-brand hover:shadow-md transition-all"
    >
      <div className="relative aspect-[4/5] bg-secondary">
        {style.thumbnail_url ? (
          <Image
            src={style.thumbnail_url}
            alt={style.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <ImageIcon size={32} strokeWidth={1.4} />
          </div>
        )}
        {style.is_default && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-brand text-white shadow-sm">
            <Star size={10} fill="currentColor" />
            Default
          </span>
        )}
        {style.reference_image_count > 1 && (
          <span className="absolute bottom-2 right-2 text-[10px] font-medium px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm">
            {style.reference_image_count} refs
          </span>
        )}
      </div>
      <div className="p-3.5">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <span className="text-sm font-semibold text-foreground truncate">
            {style.name}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0 uppercase tracking-wider">
            {FORMAT_LABELS[style.format_type] ?? style.format_type}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {new Date(style.updated_at).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>
    </Link>
  )
}
