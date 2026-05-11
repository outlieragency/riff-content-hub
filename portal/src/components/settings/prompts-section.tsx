import Link from 'next/link'
import { ArrowRight, FileText } from 'lucide-react'
import { SettingsCard } from './settings-card'

export function PromptsSection() {
  return (
    <SettingsCard
      icon={FileText}
      title="Prompts"
      description="ปรับ prompt ที่ AI ใช้ generate content โดยไม่ต้อง deploy"
    >
      <Link
        href="/settings/prompts"
        className="flex items-center justify-between gap-3 rounded-[10px] border border-border-soft bg-background hover:bg-secondary/40 transition-colors px-4 py-3"
      >
        <div>
          <div className="text-sm font-medium text-foreground">
            แก้ไข prompt
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            FB long-form, Carousel, Reels, Voice wrapper และอื่น ๆ
          </div>
        </div>
        <ArrowRight size={16} className="text-muted-foreground" />
      </Link>
    </SettingsCard>
  )
}
