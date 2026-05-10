-- 0019_user_onboarding.sql
-- Eden-style onboarding: track user interests + onboarding completion.
-- Extends user_settings with interests array + onboarded_at timestamp.

alter table public.user_settings
  add column if not exists interests text[],
  add column if not exists onboarded_at timestamptz;

create index if not exists user_settings_onboarded_idx
  on public.user_settings(onboarded_at)
  where onboarded_at is not null;

comment on column public.user_settings.interests is
  'Topic tags user picked during onboarding. Used to filter Discover feed and prioritize creator suggestions.';
comment on column public.user_settings.onboarded_at is
  'When user completed onboarding flow. NULL = should be redirected to /onboarding.';
