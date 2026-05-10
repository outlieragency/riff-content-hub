-- ============================================================
-- Restore Riff v1 schema — re-create tables that 0020_strip_v2
-- dropped. Run in Supabase SQL Editor for project
-- kwwsmpsnneakribwkake. Idempotent (CREATE IF NOT EXISTS, DROP
-- POLICY IF EXISTS, etc.) so safe to run twice.
-- ============================================================

-- channels ------------------------------------------------
create table if not exists public.channels (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  youtube_channel_id text not null,
  handle text,
  title text not null,
  description text,
  thumbnail_url text,
  subscriber_count bigint,
  total_video_count int,
  channel_avg_views numeric,
  channel_avg_views_recomputed_at timestamptz,
  last_synced_at timestamptz,
  sync_status text not null default 'idle',
  sync_error text,
  created_at timestamptz not null default now(),
  unique (user_id, youtube_channel_id)
);
create index if not exists channels_user_idx on public.channels(user_id);

-- videos --------------------------------------------------
create table if not exists public.videos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel_id uuid not null references public.channels(id) on delete cascade,
  youtube_video_id text not null,
  title text not null,
  description text,
  published_at timestamptz,
  duration_seconds int,
  is_short boolean not null default false,
  view_count bigint,
  like_count bigint,
  comment_count bigint,
  thumbnail_url text,
  outlier_score numeric,
  outlier_score_computed_at timestamptz,
  metrics_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, youtube_video_id)
);
create index if not exists videos_user_score_idx
  on public.videos(user_id, outlier_score desc nulls last);
create index if not exists videos_user_published_idx
  on public.videos(user_id, published_at desc);
create index if not exists videos_channel_idx on public.videos(channel_id);

-- ideas ---------------------------------------------------
create table if not exists public.ideas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid references public.videos(id) on delete set null,
  title text not null,
  source_url text,
  thumbnail_url text,
  notes text,
  status text not null default 'idea',
  saved_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ideas_user_status_idx
  on public.ideas(user_id, status, saved_at desc);

-- transcripts --------------------------------------------
create table if not exists public.transcripts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  language text,
  raw_segments jsonb,
  plain_text text,
  translated_text text,
  summary jsonb,
  fetched_at timestamptz,
  summarized_at timestamptz,
  unique (user_id, video_id)
);
create index if not exists transcripts_video_idx on public.transcripts(video_id);

-- creative_styles (0011) ---------------------------------
create table if not exists public.creative_styles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  format_type text not null,
  reference_images jsonb not null default '[]'::jsonb,
  style_guide_md text not null default '',
  renderer_config jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists creative_styles_user_format_idx
  on public.creative_styles(user_id, format_type);
create unique index if not exists creative_styles_default_unique
  on public.creative_styles(user_id, format_type)
  where is_default = true;

-- boards (0014) ------------------------------------------
create table if not exists public.boards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default 'slate',
  icon text,
  sort_order int not null default 0,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists boards_user_idx on public.boards(user_id);
create index if not exists boards_user_sort_idx on public.boards(user_id, sort_order);

-- board_ideas junction ------------------------------------
create table if not exists public.board_ideas (
  board_id uuid not null references public.boards(id) on delete cascade,
  idea_id uuid not null references public.ideas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (board_id, idea_id)
);
create index if not exists board_ideas_idea_idx on public.board_ideas(idea_id);
create index if not exists board_ideas_user_idx on public.board_ideas(user_id);

-- waitlist (0015 + 0017 survey columns) -------------------
create table if not exists public.waitlist (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  name text,
  source text,
  referrer text,
  metadata jsonb not null default '{}'::jsonb,
  joined_at timestamptz not null default now(),
  confirmed_at timestamptz,
  niche text,
  primary_platforms text[],
  follower_range text,
  posting_frequency text,
  pain text,
  contact_handle text,
  survey_completed_at timestamptz
);
create index if not exists waitlist_email_idx on public.waitlist(email);
create index if not exists waitlist_joined_at_idx on public.waitlist(joined_at desc);
create index if not exists waitlist_survey_completed_idx
  on public.waitlist(survey_completed_at)
  where survey_completed_at is not null;

-- ============================================================
-- RLS — owner-only on all per-user tables; waitlist is open insert
-- ============================================================
alter table public.channels         enable row level security;
alter table public.videos           enable row level security;
alter table public.ideas            enable row level security;
alter table public.transcripts      enable row level security;
alter table public.creative_styles  enable row level security;
alter table public.boards           enable row level security;
alter table public.board_ideas      enable row level security;
alter table public.waitlist         enable row level security;

-- per-user owner policies
do $$ begin
  for tbl in select unnest(array['channels','videos','ideas','transcripts','creative_styles','boards','board_ideas']) loop
    execute format('drop policy if exists "%s owner all" on public.%I', tbl, tbl);
    execute format(
      'create policy "%s owner all" on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      tbl, tbl
    );
  end loop;
end $$;

-- waitlist: anon insert, anon survey-update within 7d
drop policy if exists "waitlist anon insert" on public.waitlist;
create policy "waitlist anon insert"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);

drop policy if exists "waitlist anon survey update" on public.waitlist;
create policy "waitlist anon survey update"
  on public.waitlist for update
  to anon, authenticated
  using (joined_at > now() - interval '7 days')
  with check (joined_at > now() - interval '7 days');

-- ============================================================
-- updated_at triggers (only where v1 had them)
-- ============================================================
drop trigger if exists ideas_updated_at on public.ideas;
create trigger ideas_updated_at
  before update on public.ideas
  for each row execute function public.set_updated_at();

drop trigger if exists creative_styles_updated_at on public.creative_styles;
create trigger creative_styles_updated_at
  before update on public.creative_styles
  for each row execute function public.set_updated_at();

drop trigger if exists boards_updated_at on public.boards;
create trigger boards_updated_at
  before update on public.boards
  for each row execute function public.set_updated_at();

-- ============================================================
-- recreated_drafts: restore the FK + NOT NULL the strip migration
-- relaxed in Slice 4. Safe — current rows all have idea_id (the
-- v2 /generate test row was already deleted).
-- ============================================================
alter table public.recreated_drafts
  drop constraint if exists recreated_drafts_idea_id_fkey;
alter table public.recreated_drafts
  add constraint recreated_drafts_idea_id_fkey
  foreign key (idea_id) references public.ideas(id) on delete cascade
  not valid;
-- VALIDATE only after data restore — see notice in restore steps. The
-- VALIDATE step fails if any recreated_drafts.idea_id points to an
-- idea row that hasn't been re-INSERTed yet.
