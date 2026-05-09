import { PageHeader } from '@/components/shared/page-header'
import { ToolCard } from '@/components/tools/tool-card'
import { ClipboardCheck, Search, Zap } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function ToolsPage() {
  return (
    <div className="max-w-[1080px] mx-auto px-6 py-8">
      <PageHeader
        title="AI Tools"
        description="Quick-fire AI assistant — paste แล้วได้ insight ทันที ไม่ต้อง generate full post"
      />

      <div className="space-y-4">
        <ToolCard
          tool="hook_doctor"
          icon={Search}
          title="Hook Doctor"
          tagline="วิเคราะห์ทำไม content นี้ปัง"
          description="paste post / hook / video title มาดู AI สรุป hook framework, ทำไม work, จุดอ่อน, แล้วเสนอ 3 template ให้ Earth นำไปใช้"
          inputLabel="Paste content (post, tweet, video title, hook ที่อยากวิเคราะห์)"
          inputPlaceholder='เช่น: "How I made $5,500/month with a 1-Person AI Business — without cold outreach"'
          inputRows={5}
        />

        <ToolCard
          tool="grade_draft"
          icon={ClipboardCheck}
          title="Grade My Draft"
          tagline="AI critique บน draft ที่เขียนเอง"
          description="paste draft FB post / Reels script ที่ Earth เขียนเอง — AI ให้ score 1-10 + จุดที่ work + จุดที่ต้องแก้ + quick rewrite ให้ดูเป็นตัวอย่าง"
          inputLabel="Paste draft ของคุณ"
          inputPlaceholder='วาง draft ทั้งหมดที่นี่ ยิ่งยาวยิ่งดี (max 8000 chars)'
          inputRows={10}
        />

        <ToolCard
          tool="niche_playbook"
          icon={Zap}
          title="Niche Playbook"
          tagline="สร้าง 8-10 hook templates สำหรับ niche"
          description="ระบุ niche / topic / audience → AI สร้าง playbook ของ hook templates ที่ใช้ได้ทันที พร้อม example fill-in"
          inputLabel="Niche / topic / audience description"
          inputPlaceholder='เช่น: "Solopreneur ไทยที่อยากใช้ AI สร้าง digital product ขายเอง audience: 100K+ followers ที่ค้นหา system + tool"'
          inputRows={4}
        />
      </div>
    </div>
  )
}
