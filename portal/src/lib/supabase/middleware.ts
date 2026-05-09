import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ONE_YEAR = 60 * 60 * 24 * 365

function persistOptions(options: CookieOptions | undefined): CookieOptions {
  return {
    ...options,
    maxAge: options?.maxAge ?? ONE_YEAR,
    sameSite: options?.sameSite ?? 'lax',
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, persistOptions(options)),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes (no auth required)
  const publicRoutes = [
    '/login',
    '/forgot-password',
    '/reset-password',
  ]
  // Marketing routes — accessible to anyone (with or without auth)
  const marketingRoutes = ['/']
  const isPublicRoute =
    publicRoutes.some((r) => pathname.startsWith(r)) ||
    marketingRoutes.includes(pathname)
  const isApiRoute = pathname.startsWith('/api/')

  // Unauth user trying to access app routes → /login
  if (!user && !isPublicRoute && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Logged-in user on /login → /today (Dashboard)
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/today'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
