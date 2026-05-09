import { redirect } from 'next/navigation'
import { MarketingNav } from '@/components/marketing/nav'
import { Hero } from '@/components/marketing/hero'
import { GuaranteeOutlier } from '@/components/marketing/guarantee-outlier'
import { FeaturesGrid } from '@/components/marketing/features-grid'
import { TopCreators } from '@/components/marketing/top-creators'
import { SpotTrend } from '@/components/marketing/spot-trend'
import { Founder } from '@/components/marketing/founder'
import { FasterWithAI } from '@/components/marketing/faster-with-ai'
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

  if (!isPreview) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) redirect('/today')
  }

  const baseCount = 847
  const dbCount = await getWaitlistCount().catch(() => 0)
  const count = baseCount + dbCount

  return (
    <main>
      <MarketingNav />
      <Hero count={count} />
      <GuaranteeOutlier />
      <FeaturesGrid />
      <TopCreators />
      <SpotTrend />
      <Founder />
      <FasterWithAI />
      <FAQ />
      <FinalCTA count={count} />
      <MarketingFooter />
    </main>
  )
}
