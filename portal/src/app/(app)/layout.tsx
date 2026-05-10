import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { RouteProgress } from '@/components/layout/route-progress'
import { ActiveJobsBanner } from '@/components/jobs/active-jobs-banner'
import { isFounderEmail } from '@/lib/auth/founder'
import { getOnboardingStatus } from '@/lib/actions/onboarding'

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

  // Force first-time users into onboarding before they land on Dashboard.
  // Returning users with onboarded_at skip past this check.
  const onboarding = await getOnboardingStatus()
  if (!onboarding.onboardedAt) {
    redirect('/onboarding')
  }

  // Inline voice query so layout = 2 round-trips (auth + voice) instead of 5.
  // Topbar VoicePicker stays populated with no client flash.
  const { data: voiceRows } = await supabase
    .from('voice_profiles')
    .select('id, name, is_active, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  const voiceProfiles = (voiceRows ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    is_active: p.is_active,
    updated_at: p.updated_at,
  }))

  return (
    <div className="flex h-screen bg-background">
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>
      <ActiveJobsBanner />
      <Sidebar isFounder={isFounderEmail(user.email)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar email={user.email ?? null} voiceProfiles={voiceProfiles} />
        <main id="main" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
