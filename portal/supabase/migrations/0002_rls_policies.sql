-- 0002_rls_policies.sql
-- Row-Level Security ทุก table = own user only
-- Single-tenant ตอนนี้แต่ multi-tenant ready

-- Enable RLS
alter table public.voice_profiles enable row level security;
alter table public.channels enable row level security;
alter table public.videos enable row level security;
alter table public.ideas enable row level security;
alter table public.transcripts enable row level security;
alter table public.recreated_drafts enable row level security;
alter table public.jobs enable row level security;

-- =========================================================
-- voice_profiles
-- =========================================================
create policy "voice_profiles select own"
  on public.voice_profiles for select
  using (auth.uid() = user_id);

create policy "voice_profiles insert own"
  on public.voice_profiles for insert
  with check (auth.uid() = user_id);

create policy "voice_profiles update own"
  on public.voice_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "voice_profiles delete own"
  on public.voice_profiles for delete
  using (auth.uid() = user_id);

-- =========================================================
-- channels
-- =========================================================
create policy "channels select own"
  on public.channels for select
  using (auth.uid() = user_id);

create policy "channels insert own"
  on public.channels for insert
  with check (auth.uid() = user_id);

create policy "channels update own"
  on public.channels for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "channels delete own"
  on public.channels for delete
  using (auth.uid() = user_id);

-- =========================================================
-- videos
-- =========================================================
create policy "videos select own"
  on public.videos for select
  using (auth.uid() = user_id);

create policy "videos insert own"
  on public.videos for insert
  with check (auth.uid() = user_id);

create policy "videos update own"
  on public.videos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "videos delete own"
  on public.videos for delete
  using (auth.uid() = user_id);

-- =========================================================
-- ideas
-- =========================================================
create policy "ideas select own"
  on public.ideas for select
  using (auth.uid() = user_id);

create policy "ideas insert own"
  on public.ideas for insert
  with check (auth.uid() = user_id);

create policy "ideas update own"
  on public.ideas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "ideas delete own"
  on public.ideas for delete
  using (auth.uid() = user_id);

-- =========================================================
-- transcripts
-- =========================================================
create policy "transcripts select own"
  on public.transcripts for select
  using (auth.uid() = user_id);

create policy "transcripts insert own"
  on public.transcripts for insert
  with check (auth.uid() = user_id);

create policy "transcripts update own"
  on public.transcripts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transcripts delete own"
  on public.transcripts for delete
  using (auth.uid() = user_id);

-- =========================================================
-- recreated_drafts
-- =========================================================
create policy "recreated_drafts select own"
  on public.recreated_drafts for select
  using (auth.uid() = user_id);

create policy "recreated_drafts insert own"
  on public.recreated_drafts for insert
  with check (auth.uid() = user_id);

create policy "recreated_drafts update own"
  on public.recreated_drafts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "recreated_drafts delete own"
  on public.recreated_drafts for delete
  using (auth.uid() = user_id);

-- =========================================================
-- jobs
-- =========================================================
create policy "jobs select own"
  on public.jobs for select
  using (auth.uid() = user_id);

create policy "jobs insert own"
  on public.jobs for insert
  with check (auth.uid() = user_id);

create policy "jobs update own"
  on public.jobs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
-- ห้าม delete jobs จาก client ใช้ service role only
