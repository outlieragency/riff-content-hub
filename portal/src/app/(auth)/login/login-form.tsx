'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      return
    }
    router.push('/')
    router.refresh()
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
          A creator's instrument
        </p>
      </div>
    </main>
  )
}
