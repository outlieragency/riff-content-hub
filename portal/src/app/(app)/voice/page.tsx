import { PageHeader } from '@/components/shared/page-header'
import {
  getActiveVoiceProfile,
  listVoiceProfiles,
} from '@/lib/actions/voice'
import { VoiceEditor } from '@/components/voice/voice-editor'
import { VoiceProfileSwitcher } from '@/components/voice/voice-profile-switcher'

export const dynamic = 'force-dynamic'

export default async function VoicePage() {
  const [active, profiles] = await Promise.all([
    getActiveVoiceProfile(),
    listVoiceProfiles(),
  ])

  return (
    <div className="max-w-[860px] mx-auto px-6 py-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <PageHeader
          title="Voice Profile"
          description="โปรไฟล์เสียงของคุณ ใช้ตอน AI recreate ทุกชิ้น"
        />
        <VoiceProfileSwitcher activeId={active.id} profiles={profiles} />
      </div>
      <VoiceEditor initial={active} />
    </div>
  )
}
