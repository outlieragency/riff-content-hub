-- 0008_fix_voice_profile_trigger.sql
-- Fix: AFTER trigger ของ 0007 fire หลัง unique constraint check → 23505 violation
-- เปลี่ยนเป็น BEFORE trigger เพื่อให้ deactivate other rows ก่อน row write

drop trigger if exists voice_profiles_deactivate_others_trg on public.voice_profiles;

create or replace function public.deactivate_other_voice_profiles()
returns trigger as $$
begin
  if new.is_active = true then
    update public.voice_profiles
    set is_active = false
    where user_id = new.user_id
      and id <> new.id
      and is_active = true;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger voice_profiles_deactivate_others_trg
  before insert or update of is_active on public.voice_profiles
  for each row execute function public.deactivate_other_voice_profiles();
