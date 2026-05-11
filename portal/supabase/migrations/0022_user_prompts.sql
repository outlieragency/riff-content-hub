-- =====================================================================
-- 0022: user_prompts — per-user override for AI prompt files
--
-- Worker reads prompts (`recreate-fb-article.md`, `earth-rati-fb-style.md`,
-- etc.) from disk at request time. To make them editable without a deploy,
-- the worker's load_prompt() now checks this table first — if a row
-- exists for (user_id, key) AND is_active, it returns that content.
-- Otherwise it falls back to the on-disk file.
--
-- Earth edits via /settings/prompts in the portal; changes apply on the
-- next AI call (no redeploy, no worker restart).
-- =====================================================================

create table if not exists public.user_prompts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Matches the .md filename without extension, e.g.
  -- 'recreate-fb-article', 'earth-rati-fb-style', 'fb-hook-frameworks'.
  key text not null,
  content text not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, key)
);

create index if not exists user_prompts_user_idx on public.user_prompts(user_id);
create index if not exists user_prompts_key_idx on public.user_prompts(user_id, key) where is_active;

alter table public.user_prompts enable row level security;

drop policy if exists "user_prompts owner all" on public.user_prompts;
create policy "user_prompts owner all"
  on public.user_prompts for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists user_prompts_updated_at on public.user_prompts;
create trigger user_prompts_updated_at
  before update on public.user_prompts
  for each row execute function public.set_updated_at();

comment on table public.user_prompts is
  'Per-user override for worker prompt files. Worker load_prompt() reads here first, falls back to disk.';
comment on column public.user_prompts.key is
  'Prompt filename without .md extension (e.g. recreate-fb-article).';
