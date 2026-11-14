-- Validate a vehicle request against confirmed rentals and maintenance without exposing customer records.
create or replace function private.touchcard_rental_vehicle_available(
 target_org uuid,target_vehicle uuid,target_pickup date,target_return date,exclude_booking uuid default null
) returns boolean language sql stable security definer set search_path=''
as $$
 select exists(select 1 from public.rental_vehicles v where v.id=target_vehicle and v.organization_id=target_org and v.is_active and v.is_published)
 and not exists(select 1 from public.rental_bookings b where b.organization_id=target_org and b.vehicle_id=target_vehicle
  and b.id is distinct from exclude_booking and b.status in ('confirmed','active')
  and daterange(b.pickup_date,b.return_date,'[)') && daterange(target_pickup,target_return,'[)'))
 and not exists(select 1 from public.rental_maintenance m where m.organization_id=target_org and m.vehicle_id=target_vehicle
  and m.status in ('planned','in_progress') and daterange(m.scheduled_start,m.scheduled_end+1,'[)') && daterange(target_pickup,target_return,'[)'));
$$;
revoke all on function private.touchcard_rental_vehicle_available(uuid,uuid,date,date,uuid) from public;
grant execute on function private.touchcard_rental_vehicle_available(uuid,uuid,date,date,uuid) to anon,authenticated;

create or replace function public.touchcard_guard_rental_booking() returns trigger language plpgsql set search_path='' as $$
begin
 if new.status in ('pending','confirmed','active') then
  perform pg_advisory_xact_lock(hashtextextended(new.vehicle_id::text,0));
  if not private.touchcard_rental_vehicle_available(new.organization_id,new.vehicle_id,new.pickup_date,new.return_date,new.id) then
   raise exception 'Vehicle is already reserved or blocked for maintenance during these dates';
  end if;
 end if;
 return new;
end $$;

create or replace function public.touchcard_guard_rental_maintenance() returns trigger language plpgsql set search_path='' as $$
begin
 if new.status in ('planned','in_progress') then
  perform pg_advisory_xact_lock(hashtextextended(new.vehicle_id::text,0));
  if exists(select 1 from public.rental_bookings b where b.vehicle_id=new.vehicle_id and b.organization_id=new.organization_id
   and b.status in ('pending','confirmed','active')
   and daterange(b.pickup_date,b.return_date,'[)') && daterange(new.scheduled_start,new.scheduled_end+1,'[)')) then
   raise exception 'Vehicle has a rental request or confirmed rental during this maintenance period';
  end if;
 end if;
 return new;
end $$;
