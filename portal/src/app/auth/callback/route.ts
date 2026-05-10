import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * OAuth callback — Supabase redirects here with `?code=...` after the user
 * approves the Google (or future provider) consent screen.
 * Flow: exchange code → check email allowlist → bounce or signOut.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/today'
  const errorParam = searchParams.get('error_description')

  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorParam)}`,
    )
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    )
  }

  // Email allowlist gate — block anyone not paid/whitelisted.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email ?? null

  if (!email) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=no_email`)
  }

  const { data: allowed, error: rpcErr } = await supabase.rpc('is_email_allowed', {
    check_email: email,
  })
  if (rpcErr) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=allowlist_check_failed`)
  }
  if (!allowed) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=not_allowed`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
