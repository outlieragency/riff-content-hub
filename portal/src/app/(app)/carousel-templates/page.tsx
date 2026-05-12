import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { CarouselTemplateUploader } from '@/components/carousel-templates/uploader'
import { CarouselTemplateCard } from '@/components/carousel-templates/template-card'
import { listCarouselTemplates } from '@/lib/actions/carousel-templates'
import { ImagePlus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CarouselTemplatesPage() {
  const templates = await listCarouselTemplates()

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8 space-y-6">
      <PageHeader
        title="FB Templates"
        description="Upload screenshot ของ FB cover ที่ชอบ — AI วิเคราะห์ layout, สี, ฟอนต์ แล้วสร้างเป็น template ที่ใช้ generate post + cover ในสไตล์เดียวกันได้ทุกครั้ง"
        actions={<CarouselTemplateUploader />}
      />

      {templates.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-brand-soft text-brand flex items-center justify-center mb-3">
            <ImagePlus size={20} />
          </div>
          <h2 className="font-semibold text-foreground">
            ยังไม่มี FB template
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            กด "Upload template" ด้านบนเพื่อเลือกรูป FB cover ที่ชอบ —
            AI จะแปลง layout เป็น template ให้ใช้ generate FB post
            ในสไตล์เดียวกันได้ทุกครั้ง
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <Link
              key={t.id}
              href={`/carousel-templates/${t.id}`}
              className="block"
            >
              <CarouselTemplateCard template={t} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
