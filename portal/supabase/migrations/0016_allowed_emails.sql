-- 0016_allowed_emails.sql
-- Email allowlist: only emails in this table can sign in.
-- Manual entry by founder; future: Stripe webhook auto-inserts on payment.

create table if not exists public.allowed_emails (
  email text primary key,
  granted_at timestamptz not null default now(),
  granted_by text,
  notes text,
  expires_at timestamptz,
  stripe_customer_id text,
  plan text
);

create index if not exists allowed_emails_expires_at_idx
  on public.allowed_emails (expires_at)
  where expires_at is not null;

-- Lock table down: only service_role + this function can read it.
alter table public.allowed_emails enable row level security;

-- (No policies = no client access. Only service_role + SECURITY DEFINER funcs can read.)

-- Public RPC: takes an email, returns whether it's currently allowed.
-- SECURITY DEFINER bypasses RLS so authed users can self-check.
create or replace function public.is_email_allowed(check_email text)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select exists(
    select 1
    from public.allowed_emails
    where lower(email) = lower(check_email)
      and (expires_at is null or expires_at > now())
  );
$$;

revoke all on function public.is_email_allowed(text) from public;
grant execute on function public.is_email_allowed(text) to anon, authenticated;

-- Bootstrap: Earth's emails always allowed.
insert into public.allowed_emails (email, granted_by, notes)
values
  ('ratipong.work@gmail.com', 'system', 'founder'),
  ('earthrati@gmail.com', 'system', 'founder'),
  ('earthrati@outlieragency.co', 'system', 'founder')
on conflict (email) do nothing;

comment on table public.allowed_emails is
  'Email allowlist for portal sign-in. Only emails listed here (with expires_at null or future) can complete login. Add rows manually or via Stripe webhook.';

comment on function public.is_email_allowed(text) is
  'Public-callable check used by /auth/callback and login-form to gate access.';
