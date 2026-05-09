-- 0012_user_settings.sql
-- User-level settings: profile + AI provider keys + per-task model assignment
-- + integrations (Notion, future FB Pages, etc.)
--
-- Phase 1: single-tenant Earth + multi-tenant ready (BYOK design)
-- Phase 2: extend for team/workspace scope
--
-- Encryption: pgcrypto symmetric encrypt with `app.encryption_key` GUC
--   Set via Supabase Vault OR `app.encryption_key` config in DB (set per env)
--   Worker reads decrypted via service role + decrypt_secret() helper

-- =========================================================
-- pgcrypto extension
-- =========================================================
create extension if not exists pgcrypto;

-- =========================================================
-- Encrypt/decrypt helpers
-- =========================================================
-- These functions read `app.encryption_key` from Postgres GUC.
-- Set this once per environment:
--   alter database postgres set app.encryption_key = '<32-byte random>';
-- For local dev, .env app boot can run: SET app.encryption_key = '...';
--
-- If GUC unset, encrypt/decrypt will return NULL (callers should fallback).

create or replace function public.encrypt_secret(plaintext text)
returns text
language plpgsql
security definer
as $$
declare
  k text;
begin
  if plaintext is null or plaintext = '' then return null; end if;
  begin
    k := current_setting('app.encryption_key');
  exception when others then
    return null;
  end;
  if k is null or k = '' then return null; end if;
  return encode(pgp_sym_encrypt(plaintext, k), 'base64');
end;
$$;

create or replace function public.decrypt_secret(ciphertext text)
returns text
language plpgsql
security definer
as $$
declare
  k text;
begin
  if ciphertext is null or ciphertext = '' then return null; end if;
  begin
    k := current_setting('app.encryption_key');
  exception when others then
    return null;
  end;
  if k is null or k = '' then return null; end if;
  return pgp_sym_decrypt(decode(ciphertext, 'base64'), k);
exception when others then
  return null;
end;
$$;

revoke all on function public.encrypt_secret(text) from public;
revoke all on function public.decrypt_secret(text) from public;
grant execute on function public.encrypt_secret(text) to service_role;
grant execute on function public.decrypt_secret(text) to service_role;

-- =========================================================
-- user_settings table
-- =========================================================
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- Profile
  display_name text,
  timezone text not null default 'Asia/Bangkok',
  language text not null default 'th', -- 'th' | 'en'

  -- AI provider keys (encrypted via pgcrypto symmetric encrypt)
  -- Shape: { anthropic: "<encrypted>", openai: "<encrypted>", google: "<encrypted>", openrouter: "<encrypted>" }
  -- Read via decrypt_secret() in worker; never sent to browser
  provider_keys_encrypted jsonb not null default '{}'::jsonb,

  -- Per-task model selection
  -- Shape: { voice_extract: "claude-haiku-4-5", recreate: "claude-sonnet-4-6", ... }
  -- Allowed task_ids: voice_extract | transcript_translate | transcript_summarize | recreate_content | style_extract
  task_models jsonb not null default '{}'::jsonb,

  -- Integrations
  notion_token_encrypted text,
  notion_content_hub_dsid text,
  notion_output_tracker_dsid text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_settings_user_idx on public.user_settings(user_id);

-- =========================================================
-- RLS — owner only
-- =========================================================
alter table public.user_settings enable row level security;

drop policy if exists "user_settings owner select" on public.user_settings;
drop policy if exists "user_settings owner insert" on public.user_settings;
drop policy if exists "user_settings owner update" on public.user_settings;
drop policy if exists "user_settings owner delete" on public.user_settings;

create policy "user_settings owner select"
on public.user_settings for select
to authenticated
using (auth.uid() = user_id);

create policy "user_settings owner insert"
on public.user_settings for insert
to authenticated
with check (auth.uid() = user_id);

create policy "user_settings owner update"
on public.user_settings for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_settings owner delete"
on public.user_settings for delete
to authenticated
using (auth.uid() = user_id);

-- =========================================================
-- updated_at trigger
-- =========================================================
drop trigger if exists user_settings_updated_at on public.user_settings;
create trigger user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- =========================================================
-- Auto-create row on user signup (Supabase auth hook pattern)
-- =========================================================
create or replace function public.handle_new_user_settings()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_settings on auth.users;
create trigger on_auth_user_created_settings
  after insert on auth.users
  for each row execute function public.handle_new_user_settings();

-- =========================================================
-- Backfill: ensure existing users have a settings row
-- =========================================================
insert into public.user_settings (user_id)
select id from auth.users
on conflict (user_id) do nothing;
