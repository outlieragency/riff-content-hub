import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isFounderEmail } from '@/lib/auth/founder'
import { listWaitlistEntries } from '@/lib/actions/waitlist'
import { PageHeader } from '@/components/shared/page-header'
import { WaitlistTable } from '@/components/admin/waitlist-table'

export const dynamic = 'force-dynamic'

export default async function AdminWaitlistPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!isFounderEmail(user?.email)) notFound()

  const rows = await listWaitlistEntries()

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-6 space-y-6">
      <PageHeader
        title="Waitlist"
        description={`${rows.length} leads · ${rows.filter((r) => r.survey_completed_at).length} กรอก survey แล้ว`}
      />
      <WaitlistTable rows={rows} />
    </div>
  )
}
