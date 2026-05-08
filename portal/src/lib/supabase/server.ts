import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const ONE_YEAR = 60 * 60 * 24 * 365

function persistOptions(options: CookieOptions | undefined): CookieOptions {
  return {
    ...options,
    maxAge: options?.maxAge ?? ONE_YEAR,
    sameSite: options?.sameSite ?? 'lax',
  }
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, persistOptions(options)),
            )
          } catch {}
        },
      },
    },
  )
}

/**
 * Service-role client. Bypasses RLS — use only for trusted server-side
 * operations (backfill jobs, webhooks, admin actions). Intentionally
 * does NOT read cookies: the @supabase/ssr `createServerClient` would
 * forward the user's auth JWT alongside the service-role apikey, which
 * makes Supabase auth-as-the-user and RLS *applies*. Using the plain
 * @supabase/supabase-js client with no cookies and no session keeps
 * the service role intact.
 */
export async function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
