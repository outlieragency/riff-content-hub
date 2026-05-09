import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // If user is already logged in, send them to the app dashboard
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/today')

  return (
    <div className="riff-marketing min-h-screen bg-[#0A0F0A] text-[#F5F5F0] antialiased">
      <div className="noise-overlay pointer-events-none fixed inset-0 z-0" />
      {children}
    </div>
  )
}
