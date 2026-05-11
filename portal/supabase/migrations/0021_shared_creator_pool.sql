-- =====================================================================
-- 0021: shared creator pool — pre-synced curated creators visible to all
-- users on /discover so the feed doesn't loop the same tracked channels.
--
-- shape mirrors channels + videos (so worker sync logic stays the same)
-- but without user_id — these rows are shared. RLS = readable by every
-- authenticated user; writes restricted to service_role (cron + admin).
-- =====================================================================

create table if not exists public.shared_channels (
  id uuid primary key default uuid_generate_v4(),
  youtube_channel_id text not null unique,
  handle text,
  title text not null,
  description text,
  thumbnail_url text,
  subscriber_count bigint,
  total_video_count int,
  channel_avg_views numeric,
  channel_avg_views_recomputed_at timestamptz,
  niches text[] not null default '{}'::text[],
  last_synced_at timestamptz,
  sync_status text not null default 'idle',
  sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shared_channels_niches_gin
  on public.shared_channels using gin (niches);
create index if not exists shared_channels_synced_idx
  on public.shared_channels (last_synced_at desc);

create table if not exists public.shared_videos (
  id uuid primary key default uuid_generate_v4(),
  shared_channel_id uuid not null references public.shared_channels(id) on delete cascade,
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
  unique (shared_channel_id, youtube_video_id)
);
create index if not exists shared_videos_score_idx
  on public.shared_videos (outlier_score desc nulls last);
create index if not exists shared_videos_published_idx
  on public.shared_videos (published_at desc);
create index if not exists shared_videos_channel_idx
  on public.shared_videos (shared_channel_id);

-- updated_at trigger on shared_channels (reuse set_updated_at fn)
drop trigger if exists shared_channels_updated_at on public.shared_channels;
create trigger shared_channels_updated_at
  before update on public.shared_channels
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS — read for any authenticated user. Writes happen via the
-- service-role key from the worker; no policy needed for that.
-- ============================================================
alter table public.shared_channels enable row level security;
alter table public.shared_videos   enable row level security;

drop policy if exists "shared_channels read" on public.shared_channels;
create policy "shared_channels read"
  on public.shared_channels for select
  to authenticated
  using (true);

drop policy if exists "shared_videos read" on public.shared_videos;
create policy "shared_videos read"
  on public.shared_videos for select
  to authenticated
  using (true);

comment on table public.shared_channels is
  'Curated creator pool — pre-synced by the worker, visible to every user on /discover.';
comment on table public.shared_videos is
  'Videos from the curated creator pool. Joined to shared_channels for niche filter on /discover.';
