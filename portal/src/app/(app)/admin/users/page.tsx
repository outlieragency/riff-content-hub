import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isFounderEmail } from '@/lib/auth/founder'
import { listAllowedEmails } from '@/lib/actions/admin-users'
import { PageHeader } from '@/components/shared/page-header'
import { AdminUsersPanel } from '@/components/admin/admin-users-panel'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  // Server-side founder gate. Non-founders get 404 (don't leak the route exists)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!isFounderEmail(user?.email)) notFound()

  const rows = await listAllowedEmails()

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-6 space-y-6">
      <PageHeader
        title="Users"
        description="ใครได้สิทธิ์ใช้ Riff บ้าง — เพิ่ม/ถอน/ขยาย trial ได้จากที่นี่"
      />
      <AdminUsersPanel rows={rows} currentEmail={user?.email ?? null} />
    </div>
  )
}
