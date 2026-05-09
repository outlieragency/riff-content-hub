import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { RouteProgress } from '@/components/layout/route-progress'
import { ActiveJobsBanner } from '@/components/jobs/active-jobs-banner'
import { listVoiceProfiles } from '@/lib/actions/voice'
import { ensureHeadlinerDefault } from '@/lib/actions/creative-styles'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetched here so Topbar VoicePicker is always populated (no client-side
  // loading flash + works on every route)
  const voiceProfiles = await listVoiceProfiles()

  // Auto-seed the Headliner default creative_style for fb_article covers
  // (idempotent — does nothing after first visit). Backfills existing drafts.
  await ensureHeadlinerDefault().catch(() => null)

  return (
    <div className="flex h-screen bg-background">
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>
      <ActiveJobsBanner />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar email={user.email ?? null} voiceProfiles={voiceProfiles} />
        <main id="main" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
