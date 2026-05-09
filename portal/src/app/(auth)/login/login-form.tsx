'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NOT_ALLOWED_MSG =
  'อีเมลนี้ยังไม่ได้รับสิทธิ์ใช้งาน — เข้า waitlist ที่ riff.outlieragency.co หรือทักผมที่ hi@outlieragency.co'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Surface ?error=... from OAuth callback (e.g. not_allowed)
  useEffect(() => {
    const e = searchParams.get('error')
    if (!e) return
    if (e === 'not_allowed' || e === 'no_email') setError(NOT_ALLOWED_MSG)
    else if (e === 'allowlist_check_failed')
      setError('ตรวจสิทธิ์ไม่สำเร็จ ลองใหม่อีกครั้ง')
    else setError('เข้าระบบไม่สำเร็จ ลองใหม่อีกครั้ง')
  }, [searchParams])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (signInErr) {
      setLoading(false)
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      return
    }
    // Allowlist gate — same check as OAuth callback.
    const { data: allowed, error: rpcErr } = await supabase.rpc(
      'is_email_allowed',
      { check_email: email },
    )
    if (rpcErr) {
      await supabase.auth.signOut()
      setLoading(false)
      setError('ตรวจสิทธิ์ไม่สำเร็จ ลองใหม่อีกครั้ง')
      return
    }
    if (!allowed) {
      await supabase.auth.signOut()
      setLoading(false)
      setError(NOT_ALLOWED_MSG)
      return
    }
    setLoading(false)
    router.push('/today')
    router.refresh()
  }

  async function signInWithGoogle() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/today`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) {
      setLoading(false)
      setError('เข้าผ่าน Google ไม่สำเร็จ ลองใหม่อีกครั้ง')
    }
    // On success Supabase redirects away, so no further state work here.
  }

  return (
    <main
      id="main"
      className="relative min-h-screen scene-forest flex items-center justify-center px-4 overflow-hidden"
    >
      {/* Decorative polaroids — scattered Eden-style */}
      <div
        aria-hidden
        className="polaroid absolute hidden md:block"
        style={{
          top: '15%',
          left: '10%',
          width: 130,
          transform: 'rotate(-8deg)',
        }}
      >
        <div
          className="w-full aspect-[4/5] rounded-[2px]"
          style={{
            background:
              'linear-gradient(135deg, #C99A6E 0%, #8B6B47 50%, #4A3D2A 100%)',
          }}
        />
      </div>
      <div
        aria-hidden
        className="polaroid absolute hidden md:block"
        style={{
          top: '60%',
          left: '8%',
          width: 110,
          transform: 'rotate(5deg)',
        }}
      >
        <div
          className="w-full aspect-square rounded-[2px]"
          style={{
            background:
              'linear-gradient(160deg, #A0826D 0%, #6B5B47 100%)',
          }}
        />
      </div>
      <div
        aria-hidden
        className="polaroid absolute hidden md:block"
        style={{
          top: '20%',
          right: '12%',
          width: 120,
          transform: 'rotate(7deg)',
        }}
      >
        <div
          className="w-full aspect-[4/5] rounded-[2px]"
          style={{
            background:
              'linear-gradient(180deg, #2D4030 0%, #5A6B4D 100%)',
          }}
        />
      </div>
      <div
        aria-hidden
        className="polaroid absolute hidden md:block"
        style={{
          top: '65%',
          right: '10%',
          width: 130,
          transform: 'rotate(-4deg)',
        }}
      >
        <div
          className="w-full aspect-[4/3] rounded-[2px]"
          style={{
            background:
              'linear-gradient(135deg, #D4A574 0%, #8B6F4D 100%)',
          }}
        />
      </div>

      <div className="relative w-full max-w-md text-center z-10">
        <p className="text-2xs tracking-[0.3em] uppercase text-[#9C9385] mb-6">
          Riff · by Outlier
        </p>

        <h1 className="font-serif-display text-4xl sm:text-5xl text-[#F5F1E5] leading-[1.05] mb-3">
          Turn on. <span className="font-serif-italic">Tune in.</span>
          <br />
          Drop out.
        </h1>

        <p className="text-sm text-[#9C9385] mb-10 max-w-sm mx-auto leading-relaxed">
          หยิบ outlier ของคนอื่น มา riff ในเสียงคุณเอง ไม่ copy
        </p>

        <form
          onSubmit={onSubmit}
          className="bg-[#FBF7EC] rounded-[18px] p-7 space-y-4 text-left shadow-[0_24px_64px_-24px_rgba(0,0,0,0.4),0_0_0_1px_rgba(26,36,24,0.06)]"
        >
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full h-11 rounded-[10px] bg-white hover:bg-[#F5F0E5] text-[#1A2418] font-medium text-[15px] flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50"
            style={{ border: '1px solid rgba(26,36,24,0.14)' }}
          >
            <GoogleIcon />
            เข้าด้วย Google
          </button>

          <div className="relative flex items-center py-1">
            <div className="flex-1 h-px bg-[#E4DFD2]" />
            <span className="px-3 text-[11px] text-[#8A8170] tracking-[0.16em] uppercase">
              หรือ
            </span>
            <div className="flex-1 h-px bg-[#E4DFD2]" />
          </div>

          <div>
            <label className="block text-2xs font-medium text-[#5A5547] mb-1.5 tracking-[0.1em] uppercase">
              อีเมล
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3.5 rounded-[10px] bg-[#F5F0E5] text-[#1A2418] text-base placeholder:text-[#8A8170] focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="you@outlieragency.co"
            />
          </div>
          <div>
            <label className="block text-2xs font-medium text-[#5A5547] mb-1.5 tracking-[0.1em] uppercase">
              รหัสผ่าน
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3.5 rounded-[10px] bg-[#F5F0E5] text-[#1A2418] text-base focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {error && (
            <div className="text-sm text-[#9F2A18] bg-[#FBEBE6] rounded-[8px] px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-[10px] bg-[#1A2418] hover:bg-[#243024] text-[#F5F1E5] font-medium text-base disabled:opacity-50 transition-colors"
          >
            {loading ? 'กำลังเข้าสู่ระบบ' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="text-2xs text-[#7A8275] mt-8 tracking-[0.2em] uppercase">
          A creator&apos;s instrument
        </p>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  )
}
