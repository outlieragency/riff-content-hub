import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isFounderEmail } from '@/lib/auth/founder'
import { getTutorialVideo } from '@/lib/actions/app-settings'
import { PageHeader } from '@/components/shared/page-header'
import { TutorialVideoForm } from '@/components/admin/tutorial-video-form'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!isFounderEmail(user?.email)) notFound()

  const tutorial = await getTutorialVideo()

  return (
    <div className="max-w-[820px] mx-auto px-6 py-6 space-y-6">
      <PageHeader
        title="App Settings"
        description="ตั้งค่าที่ user ทุกคนเห็นใน Dashboard ตอนนี้มี tutorial video"
      />

      <section className="surface-1 rounded-[14px] p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-foreground">
            Tutorial Video
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            แปะ YouTube URL ที่ user ทั่วไปจะเห็นใน Dashboard ลบทิ้งได้โดยส่ง URL ว่าง
          </p>
        </div>
        <TutorialVideoForm initial={tutorial} />
      </section>
    </div>
  )
}
