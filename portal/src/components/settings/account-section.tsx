'use client'

import { useTransition } from 'react'
import { LogOut, Shield } from 'lucide-react'
import { signOut } from '@/lib/actions/settings'
import { SettingsCard } from './settings-card'

export function AccountSection({ email }: { email: string }) {
  const [pending, start] = useTransition()

  function handleSignOut() {
    if (!confirm(`Sign out ของ ${email} ?`)) return
    start(async () => {
      await signOut()
    })
  }

  return (
    <SettingsCard icon={Shield} title="Account">
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={pending}
          className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-red-600 disabled:opacity-50 px-3 py-2 rounded-[8px] hover:bg-red-50 transition-colors"
        >
          <LogOut size={13} />
          Sign out
        </button>
        <p className="text-[11px] text-muted-foreground">
          Export data + Delete account จะเปิดในรอบหน้า — ตอนนี้แจ้ง support เพื่อขอ
        </p>
      </div>
    </SettingsCard>
  )
}
