-- 0015_waitlist.sql
-- Public waitlist signup table for Riff landing page.
--
-- Anonymous insert allowed (RLS policy below). Read restricted to service role.

create table if not exists public.waitlist (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  name text,
  source text,
  referrer text,
  metadata jsonb not null default '{}'::jsonb,
  joined_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists waitlist_email_idx on public.waitlist(email);
create index if not exists waitlist_joined_at_idx on public.waitlist(joined_at desc);

-- RLS: anyone (anon role) can INSERT; only service_role can SELECT/UPDATE/DELETE
alter table public.waitlist enable row level security;

drop policy if exists "waitlist anon insert" on public.waitlist;
drop policy if exists "waitlist service all" on public.waitlist;

create policy "waitlist anon insert"
on public.waitlist for insert
to anon, authenticated
with check (true);

-- service_role bypasses RLS by default; explicit policy is for clarity
create policy "waitlist service all"
on public.waitlist for all
to service_role
using (true)
with check (true);
