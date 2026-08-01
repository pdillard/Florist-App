-- Fix: driver signups never got a driver_profiles row, so no driver could
-- ever appear as "available" for assignment. Two parts:
-- 1. Update handle_new_user() so future driver signups get one automatically.
-- 2. Backfill any existing driver-role profiles that are missing one.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'customer');

  insert into public.profiles (id, role, name)
  values (new.id, v_role, new.raw_user_meta_data->>'name');

  if v_role = 'driver' then
    insert into public.driver_profiles (user_id, is_available)
    values (new.id, true);
  end if;

  return new;
end;
$$;

-- Backfill: any driver whose account predates this fix.
insert into public.driver_profiles (user_id, is_available)
select p.id, true
from public.profiles p
left join public.driver_profiles dp on dp.user_id = p.id
where p.role = 'driver' and dp.user_id is null;
