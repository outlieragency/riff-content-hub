import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Root — Riff v2 has no marketing page. Bounce based on auth state:
 *   logged in  → /generate (the only app surface)
 *   logged out → /login
 */
export default async function RootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  redirect(user ? '/generate' : '/login')
}
