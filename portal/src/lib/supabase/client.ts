import { createBrowserClient } from '@supabase/ssr'

const ONE_YEAR = 60 * 60 * 24 * 365

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Cookie options applied to ALL auth cookies set by Supabase JS in browser.
      // Without explicit maxAge, some browsers treat these as session cookies and
      // delete them when the user closes the tab — forcing re-login every time.
      cookieOptions: {
        maxAge: ONE_YEAR,
        sameSite: 'lax',
        // `secure` auto-applies on https; safe to omit so localhost dev still works
        path: '/',
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  )
}
