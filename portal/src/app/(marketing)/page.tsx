import { redirect } from 'next/navigation'
import { MarketingNav } from '@/components/marketing/nav'
import { Hero } from '@/components/marketing/hero'
import { SocialProof } from '@/components/marketing/social-proof'
import { Problem } from '@/components/marketing/problem'
import { WhatIsRiff } from '@/components/marketing/what-is-riff'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { OutlierScore } from '@/components/marketing/outlier-score'
import { Formats } from '@/components/marketing/formats'
import { VoiceProfile } from '@/components/marketing/voice-profile'
import { Outcomes } from '@/components/marketing/outcomes'
import { Comparison } from '@/components/marketing/comparison'
import { Founder } from '@/components/marketing/founder'
import { FAQ } from '@/components/marketing/faq'
import { FinalCTA } from '@/components/marketing/final-cta'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { getWaitlistCount } from '@/lib/actions/waitlist'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function MarketingHomePage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>
}) {
  const sp = await searchParams
  const isPreview = sp.preview === '1'

  // Logged-in users go to /today by default — but ?preview=1 lets them
  // browse the landing while authenticated (handy for sharing/screenshot).
  if (!isPreview) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) redirect('/today')
  }

  // Live count for "X creators waiting" — falls back to base if Supabase unreachable
  const baseCount = 847
  const dbCount = await getWaitlistCount().catch(() => 0)
  const count = baseCount + dbCount

  return (
    <main>
      <MarketingNav />
      <Hero count={count} />
      <SocialProof />
      <Problem />
      <WhatIsRiff />
      <HowItWorks />
      <OutlierScore />
      <Formats />
      <VoiceProfile />
      <Outcomes />
      <Comparison />
      <Founder />
      <FAQ />
      <FinalCTA count={count} />
      <MarketingFooter />
    </main>
  )
}
