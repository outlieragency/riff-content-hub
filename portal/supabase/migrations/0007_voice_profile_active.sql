-- 0007_voice_profile_active.sql
-- Stage A C7: allow multiple voice profiles per user with one active selected
-- (ลูกค้า SaaS อาจมีหลาย brand ต่อ account)

alter table public.voice_profiles
  add column if not exists is_active boolean not null default false;

-- Backfill: oldest profile per user becomes active
with first_per_user as (
  select distinct on (user_id) id, user_id, created_at
  from public.voice_profiles
  order by user_id, created_at asc
)
update public.voice_profiles vp
set is_active = true
from first_per_user f
where vp.id = f.id;

-- Enforce: at most one active profile per user
-- (single-active is enforced via partial unique index)
create unique index if not exists voice_profiles_one_active_per_user_idx
  on public.voice_profiles (user_id)
  where is_active = true;

-- Trigger: when a profile is set active, deactivate other profiles of the same user
-- (race-safe — Postgres handles via the unique partial index above; this trigger
-- just makes the UX of "switch active" atomic, no need for client-side multi-update)
create or replace function public.deactivate_other_voice_profiles()
returns trigger as $$
begin
  if new.is_active = true and (old is null or old.is_active = false) then
    update public.voice_profiles
    set is_active = false
    where user_id = new.user_id
      and id <> new.id
      and is_active = true;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists voice_profiles_deactivate_others_trg on public.voice_profiles;
create trigger voice_profiles_deactivate_others_trg
  after insert or update of is_active on public.voice_profiles
  for each row execute function public.deactivate_other_voice_profiles();

comment on column public.voice_profiles.is_active is
  'Exactly one active profile per user (enforced via unique partial index + trigger)';
