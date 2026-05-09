-- 0018_app_settings.sql
-- Founder-managed global app settings (key-value).
-- First use case: tutorial video URL shown on Dashboard.

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.app_settings enable row level security;

-- Public read for all authed users (dashboard reads tutorial video URL)
drop policy if exists "app_settings authed read" on public.app_settings;
create policy "app_settings authed read"
on public.app_settings for select
to authenticated
using (true);

-- Bootstrap: empty tutorial video record (founder fills in via /admin/settings)
insert into public.app_settings (key, value)
values ('tutorial_video', '{"url": null, "title": null}'::jsonb)
on conflict (key) do nothing;

comment on table public.app_settings is
  'Founder-managed global key-value config. Read by all authed users; write only via service role + isFounder check.';
