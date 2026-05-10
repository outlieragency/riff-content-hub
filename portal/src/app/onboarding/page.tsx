import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingStatus } from '@/lib/actions/onboarding'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const status = await getOnboardingStatus()

  // Already onboarded → bounce to dashboard
  if (status.onboardedAt) {
    redirect('/today')
  }

  return <OnboardingFlow userEmail={user.email ?? ''} />
}
