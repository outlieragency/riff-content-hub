import { PageHeader } from '@/components/shared/page-header'
import { NewTemplateWizard } from '@/components/templates/new-template-wizard'

export const dynamic = 'force-dynamic'

export default function NewTemplatePage() {
  return (
    <div className="max-w-[860px] mx-auto px-6 py-6">
      <PageHeader
        title="สร้าง Template ใหม่"
        description="3 step — upload reference → AI วิเคราะห์สไตล์ → ตั้งชื่อ + บันทึก"
      />
      <NewTemplateWizard />
    </div>
  )
}
