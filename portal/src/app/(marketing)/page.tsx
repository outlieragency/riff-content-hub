import { MarketingNav } from '@/components/marketing/nav'
import { Hero } from '@/components/marketing/hero'
import { SocialProof } from '@/components/marketing/social-proof'
import { Problem } from '@/components/marketing/problem'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { OutlierScore } from '@/components/marketing/outlier-score'
import { Formats } from '@/components/marketing/formats'
import { VoiceProfile } from '@/components/marketing/voice-profile'
import { Founder } from '@/components/marketing/founder'
import { FAQ } from '@/components/marketing/faq'
import { FinalCTA } from '@/components/marketing/final-cta'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { getWaitlistCount } from '@/lib/actions/waitlist'

export const dynamic = 'force-dynamic'

export default async function MarketingHomePage() {
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
      <HowItWorks />
      <OutlierScore />
      <Formats />
      <VoiceProfile />
      <Founder />
      <FAQ />
      <FinalCTA count={count} />
      <MarketingFooter />
    </main>
  )
}
