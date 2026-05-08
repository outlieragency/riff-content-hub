-- 0001_init_schema.sql
-- Outlier Content Hub initial schema
-- ทุก table มี user_id + RLS-ready (RLS policies อยู่ใน 0002)

-- Extensions
create extension if not exists "uuid-ossp";

-- =========================================================
-- voice_profiles : Brand voice schema (reuse จาก Carousel SaaS SPEC §6)
-- 1 row per user ตอนนี้ (multi-profile ใน Phase 2)
-- =========================================================
create table if not exists public.voice_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Default voice',

  -- ทั้ง profile เก็บใน JSONB เพื่อความ flexible + ไม่ schema-migrate ทุกครั้งที่ปรับ shape
  -- shape อ้างอิง Operation/products/outlier-carousel/SPEC.md §6:
  -- {
  --   tone_words: string[],
  --   signature_phrases: string[],
  --   vocabulary: { thai_english_mix: number, register: string },
  --   sentence_rhythm: string,
  --   dos: string[],
  --   donts: string[],
  --   samples: { text, type, date }[]
  -- }
  voice_profile jsonb not null default '{}'::jsonb,

  -- เก็บ history ของการ re-extract เพื่อ rollback ได้
  history jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index voice_profiles_user_idx on public.voice_profiles(user_id);

-- =========================================================
-- channels : YouTube channels ที่ track
-- =========================================================
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

  -- channel_avg_views = MEDIAN ของ 30 long-form video ล่าสุด (exclude Shorts)
  -- ห้ามเปลี่ยนเป็น mean
  channel_avg_views numeric,
  channel_avg_views_recomputed_at timestamptz,

  last_synced_at timestamptz,
  sync_status text not null default 'idle',  -- idle | syncing | error
  sync_error text,

  created_at timestamptz not null default now(),

  unique (user_id, youtube_channel_id)
);

create index channels_user_idx on public.channels(user_id);

-- =========================================================
-- videos : Videos + denormalized outlier_score
-- =========================================================
create table if not exists public.videos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel_id uuid not null references public.channels(id) on delete cascade,

  youtube_video_id text not null,
  title text not null,
  description text,

  published_at timestamptz,
  duration_seconds int,
  is_short boolean not null default false,  -- duration < 60s

  view_count bigint,
  like_count bigint,
  comment_count bigint,
  thumbnail_url text,

  -- Denormalized score = view_count / channel.channel_avg_views
  outlier_score numeric,
  outlier_score_computed_at timestamptz,

  metrics_synced_at timestamptz,
  created_at timestamptz not null default now(),

  unique (user_id, youtube_video_id)
);

create index videos_user_score_idx on public.videos(user_id, outlier_score desc nulls last);
create index videos_user_published_idx on public.videos(user_id, published_at desc);
create index videos_channel_idx on public.videos(channel_id);

-- =========================================================
-- ideas : Saved outlier videos (อาจ link หรือไม่ link กับ video)
-- nullable video_id เพราะ Phase 2 จะมี "own topic" mode
-- =========================================================
create table if not exists public.ideas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid references public.videos(id) on delete set null,

  -- denormalized สำหรับ list view เร็ว ๆ
  title text not null,
  source_url text,
  thumbnail_url text,

  notes text,
  status text not null default 'idea',  -- idea | in_progress | recreated | archived

  saved_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ideas_user_status_idx on public.ideas(user_id, status, saved_at desc);

-- =========================================================
-- transcripts : แยก table เพราะ payload ใหญ่ + lazy fetch
-- =========================================================
create table if not exists public.transcripts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,

  language text,                    -- 'th' | 'en' | ...
  raw_segments jsonb,               -- youtube-transcript-api output
  plain_text text,
  translated_text text,             -- populated ถ้า language != 'th'

  -- Summary structure (จาก summarize.md prompt):
  -- { hook, body_sections: string[], cta, takeaways: string[] }
  summary jsonb,

  fetched_at timestamptz,
  summarized_at timestamptz,

  unique (user_id, video_id)
);

create index transcripts_video_idx on public.transcripts(video_id);

-- =========================================================
-- recreated_drafts : Polymorphic outputs
-- format-agnostic generic table ไม่ต้อง migration เมื่อเพิ่ม format ใหม่
-- =========================================================
create table if not exists public.recreated_drafts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_id uuid not null references public.ideas(id) on delete cascade,
  voice_profile_id uuid references public.voice_profiles(id) on delete set null,

  format text not null,  -- fb_article | yt_script | reels | carousel
  status text not null default 'queued',  -- queued | generating | ready | edited | published | error

  -- Snapshot ของ summary ที่ใช้ตอน generate (สำหรับ reproducibility)
  input_summary jsonb,

  -- Format-specific structured output ดู types/recreate-formats.ts
  output jsonb,

  -- Denormalized markdown สำหรับ editor + copy-paste
  output_markdown text,
  title text,

  -- Edit tracking
  edit_history jsonb not null default '[]'::jsonb,

  -- Metadata จาก Anthropic SDK
  -- { model, input_tokens, output_tokens, cache_read_input_tokens,
  --   cache_creation_input_tokens, latency_ms, cost_usd }
  generation_meta jsonb not null default '{}'::jsonb,

  error text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recreated_drafts_user_idx on public.recreated_drafts(user_id, created_at desc);
create index recreated_drafts_idea_idx on public.recreated_drafts(idea_id);

-- =========================================================
-- jobs : Generic worker queue (poll-based ใน MVP, ไม่ใช้ Redis)
-- =========================================================
create table if not exists public.jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,

  kind text not null,  -- sync_channel | sync_videos | fetch_transcript | recreate | extract_voice
  payload jsonb not null default '{}'::jsonb,

  status text not null default 'queued',  -- queued | running | done | error
  progress int not null default 0,         -- 0-100

  result jsonb,
  error text,
  attempts int not null default 0,

  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index jobs_user_status_idx on public.jobs(user_id, status, created_at desc);
create index jobs_status_idx on public.jobs(status, created_at);

-- =========================================================
-- updated_at trigger
-- =========================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger voice_profiles_updated_at
  before update on public.voice_profiles
  for each row execute function public.set_updated_at();

create trigger ideas_updated_at
  before update on public.ideas
  for each row execute function public.set_updated_at();

create trigger recreated_drafts_updated_at
  before update on public.recreated_drafts
  for each row execute function public.set_updated_at();
