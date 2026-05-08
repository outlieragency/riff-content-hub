-- 0006_videos_count_denorm.sql
-- Stage A C4: denormalize videos_count on channels for fast list render
-- (avoid N+1 count(*) per channel on /channels page)

alter table public.channels
  add column if not exists videos_count int not null default 0;

-- Backfill existing channels
update public.channels c
set videos_count = (
  select count(*) from public.videos v
  where v.channel_id = c.id and v.user_id = c.user_id
);

-- Triggers to keep in sync
create or replace function public.channels_inc_videos_count()
returns trigger as $$
begin
  update public.channels
  set videos_count = videos_count + 1
  where id = new.channel_id and user_id = new.user_id;
  return new;
end;
$$ language plpgsql;

create or replace function public.channels_dec_videos_count()
returns trigger as $$
begin
  update public.channels
  set videos_count = greatest(videos_count - 1, 0)
  where id = old.channel_id and user_id = old.user_id;
  return old;
end;
$$ language plpgsql;

drop trigger if exists videos_inc_count_trg on public.videos;
create trigger videos_inc_count_trg
  after insert on public.videos
  for each row execute function public.channels_inc_videos_count();

drop trigger if exists videos_dec_count_trg on public.videos;
create trigger videos_dec_count_trg
  after delete on public.videos
  for each row execute function public.channels_dec_videos_count();

comment on column public.channels.videos_count is
  'Denormalized count, kept in sync via triggers on public.videos insert/delete';
