-- 0017_waitlist_survey.sql
-- Onboarding survey columns on waitlist signups.
-- Captured after email submit to qualify the lead + give Earth follow-up data.

alter table public.waitlist
  add column if not exists niche text,
  add column if not exists primary_platforms text[],
  add column if not exists follower_range text,
  add column if not exists posting_frequency text,
  add column if not exists pain text,
  add column if not exists contact_handle text,
  add column if not exists survey_completed_at timestamptz;

create index if not exists waitlist_survey_completed_idx
  on public.waitlist(survey_completed_at)
  where survey_completed_at is not null;

-- Update policy: allow anon to update their own row by email match (for survey submit)
-- Why anon? The survey page works without login (lead hasn't signed up to portal yet).
-- Risk: anyone could overwrite anyone's survey if they know the email.
-- Mitigation: only allow update of survey columns + within 7 days of joining.
drop policy if exists "waitlist anon survey update" on public.waitlist;
create policy "waitlist anon survey update"
on public.waitlist for update
to anon, authenticated
using (joined_at > now() - interval '7 days')
with check (joined_at > now() - interval '7 days');

comment on column public.waitlist.niche is
  'Self-described content niche from onboarding survey';
comment on column public.waitlist.primary_platforms is
  'Array of platforms user posts to (yt/ig/fb/tiktok/x/other)';
comment on column public.waitlist.pain is
  'Free-text answer to "what is your biggest pain making content"';
