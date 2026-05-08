-- 0005_jobs_dedup_progress.sql
-- Stage A C1: background jobs foundation
--
-- เพิ่ม:
--   1. payload_hash + unique constraint (user_id, kind, payload_hash, status='queued'/'running')
--      = ป้องกัน double-enqueue เวลา user double-click recreate
--   2. progress_step text สำหรับแสดง state ปัจจุบัน (เช่น 'fetching_transcript', 'translating', 'summarizing')
--   3. logs jsonb append-only สำหรับ debug + display
--   4. visibility_at สำหรับ delayed retry (job ยังไม่ visible จนกว่าจะถึง timestamp นี้)
--   5. resource_kind + resource_id สำหรับ link job กับ idea/video/etc.

-- Add columns
alter table public.jobs add column if not exists payload_hash text;
alter table public.jobs add column if not exists progress_step text;
alter table public.jobs add column if not exists logs jsonb not null default '[]'::jsonb;
alter table public.jobs add column if not exists visibility_at timestamptz not null default now();
alter table public.jobs add column if not exists resource_kind text;  -- 'idea' | 'video' | 'channel' | 'voice_profile'
alter table public.jobs add column if not exists resource_id uuid;
alter table public.jobs add column if not exists worker_lease_id text;  -- worker process id ที่ lock job ไว้
alter table public.jobs add column if not exists lease_expires_at timestamptz;

-- Backfill payload_hash for existing rows (md5 of payload, handle nulls)
update public.jobs
set payload_hash = md5(coalesce(payload::text, '{}'))
where payload_hash is null;

alter table public.jobs alter column payload_hash set not null;

-- Unique partial index: prevent dedup of in-flight jobs
-- (status in 'queued' | 'running') — done/error allow re-enqueue
create unique index if not exists jobs_dedup_inflight_idx
  on public.jobs (user_id, kind, payload_hash)
  where status in ('queued', 'running');

-- Index for poller: pick visible queued jobs ordered FIFO
create index if not exists jobs_poller_idx
  on public.jobs (status, visibility_at, created_at)
  where status in ('queued', 'running');

-- Index for resource lookup (e.g. "show jobs for this idea")
create index if not exists jobs_resource_idx
  on public.jobs (user_id, resource_kind, resource_id, created_at desc)
  where resource_kind is not null;

-- Trigger: auto-update lease_expires_at when worker_lease_id is set
-- (worker จะใช้ทำ heartbeat — ถ้า lease หมด job restart ได้)
create or replace function public.set_job_lease_expiry()
returns trigger as $$
begin
  if new.worker_lease_id is not null and (old.worker_lease_id is null or old.worker_lease_id <> new.worker_lease_id) then
    new.lease_expires_at = now() + interval '5 minutes';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists jobs_lease_expiry_trg on public.jobs;
create trigger jobs_lease_expiry_trg
  before update on public.jobs
  for each row execute function public.set_job_lease_expiry();

comment on column public.jobs.payload_hash is
  'md5(payload::text) — ใช้กัน double-enqueue เวลา user double-click หรือ network retry';

comment on column public.jobs.progress_step is
  'String label ของขั้นตอนที่กำลังทำ เช่น fetching_transcript, translating, summarizing, generating';

comment on column public.jobs.logs is
  'Append-only event log สำหรับ debug + UI streaming. แต่ละ event = { ts, event, data? }';

comment on column public.jobs.visibility_at is
  'Job invisible to poller จนกว่าจะถึงเวลานี้ — สำหรับ delayed retry';

comment on column public.jobs.lease_expires_at is
  'ถ้าเลยเวลานี้แต่ status=running แสดงว่า worker crash แล้ว — poller ตัวอื่น claim ได้';
