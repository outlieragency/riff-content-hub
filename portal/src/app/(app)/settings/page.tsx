import { PageHeader } from '@/components/shared/page-header'
import { getUserSettings } from '@/lib/actions/settings'
import { ProfileSection } from '@/components/settings/profile-section'
import { AiProvidersSection } from '@/components/settings/ai-providers-section'
import { IntegrationsSection } from '@/components/settings/integrations-section'
import { PromptsSection } from '@/components/settings/prompts-section'
import { AccountSection } from '@/components/settings/account-section'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const settings = await getUserSettings()

  return (
    <div className="max-w-[860px] mx-auto px-6 py-8 space-y-6">
      <PageHeader
        title="Settings"
        description="Profile, AI providers, integrations, account"
      />

      <ProfileSection
        email={settings.email}
        displayName={settings.display_name}
        timezone={settings.timezone}
        language={settings.language}
      />

      <AiProvidersSection
        providers={settings.providers}
        taskModels={settings.task_models}
      />

      <IntegrationsSection notion={settings.notion} />

      <PromptsSection />

      <AccountSection email={settings.email} />
    </div>
  )
}
