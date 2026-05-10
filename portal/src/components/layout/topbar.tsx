'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggleItem } from './theme-toggle'
import { VoicePicker } from './voice-picker'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import type { VoiceProfileSummary } from '@/lib/actions/voice'

export function Topbar({
  email,
  voiceProfiles,
}: {
  email: string | null
  voiceProfiles: VoiceProfileSummary[]
}) {
  const router = useRouter()
  const supabase = createClient()

  async function onSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = email ? getInitials(email.split('@')[0]) : 'U'

  return (
    <header className="h-14 shrink-0 bg-background flex items-center justify-end gap-3 px-6">
      <VoicePicker profiles={voiceProfiles} />

      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full focus:outline-none focus:ring-2 focus:ring-brand">
          <Avatar size="sm">
            <AvatarFallback className="bg-brand-soft text-brand">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {email}
          </div>
          <DropdownMenuSeparator />
          <ThemeToggleItem />
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSignOut} variant="destructive">
            <LogOut size={14} />
            ออกจากระบบ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
