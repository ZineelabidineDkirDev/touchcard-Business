-- Secure booking conflict guards: database-level concurrency checks without public booking reads.
-- Public roles receive no SELECT access to customer booking tables.

-- Pending rental requests must reserve the vehicle, not only confirmed rentals.
alter table public.rental_bookings drop constraint if exists rental_bookings_no_vehicle_overlap;
alter table public.rental_bookings
  add constraint rental_bookings_no_vehicle_overlap
  exclude using gist (
    vehicle_id with =,
    daterange(pickup_date, return_date, '[)') with &&
  )
  where (status in ('pending','confirmed','active'));

-- Healthcare pending requests block overlaps on the same provider, room, service,
-- or unassigned card resource. Exclusion constraints are concurrency-safe.
alter table public.healthcare_appointments drop constraint if exists healthcare_practitioner_no_overlap;
alter table public.healthcare_appointments drop constraint if exists healthcare_location_no_overlap;
alter table public.healthcare_appointments
  add constraint healthcare_practitioner_no_overlap
  exclude using gist (
    practitioner_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (practitioner_id is not null and status in ('pending','confirmed'));

alter table public.healthcare_appointments
  add constraint healthcare_location_no_overlap
  exclude using gist (
    location_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (location_id is not null and status in ('pending','confirmed'));

alter table public.healthcare_appointments
  add constraint healthcare_service_no_overlap
  exclude using gist (
    service_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (service_id is not null and practitioner_id is null and status in ('pending','confirmed'));

alter table public.healthcare_appointments
  add constraint healthcare_unassigned_no_overlap
  exclude using gist (
    card_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (
    practitioner_id is null and service_id is null and location_id is null
    and status in ('pending','confirmed')
  );

-- Keep rental occupancy checks private and trigger-only.
create or replace function private.touchcard_rental_vehicle_available(
  target_org uuid,
  target_vehicle uuid,
  target_pickup date,
  target_return date,
  exclude_booking uuid default null
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.rental_vehicles v
    where v.id = target_vehicle and v.organization_id = target_org
      and v.is_active and v.is_published
  )
  and not exists (
    select 1 from public.rental_bookings b
    where b.organization_id = target_org and b.vehicle_id = target_vehicle
      and b.id is distinct from exclude_booking
      and b.status in ('pending','confirmed','active')
      and daterange(b.pickup_date,b.return_date,'[)')
          && daterange(target_pickup,target_return,'[)')
  )
  and not exists (
    select 1 from public.rental_maintenance m
    where m.organization_id = target_org and m.vehicle_id = target_vehicle
      and m.status in ('planned','in_progress')
      and daterange(m.scheduled_start,m.scheduled_end + 1,'[)')
          && daterange(target_pickup,target_return,'[)')
  );
$$;
revoke all on function private.touchcard_rental_vehicle_available(uuid,uuid,date,date,uuid)
  from public, anon, authenticated;

create or replace function private.touchcard_guard_rental_booking_secure()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status in ('pending','confirmed','active') then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.vehicle_id::text,0));
    if not private.touchcard_rental_vehicle_available(
      new.organization_id,new.vehicle_id,new.pickup_date,new.return_date,new.id
    ) then
      raise exception using errcode = '23P01', message = 'Vehicle is unavailable for the selected dates';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.touchcard_guard_rental_booking_secure() from public, anon, authenticated;

create or replace function private.touchcard_guard_rental_maintenance_secure()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status in ('planned','in_progress') then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.vehicle_id::text,0));
    if exists (
      select 1 from public.rental_bookings b
      where b.vehicle_id = new.vehicle_id and b.organization_id = new.organization_id
        and b.status in ('pending','confirmed','active')
        and daterange(b.pickup_date,b.return_date,'[)')
            && daterange(new.scheduled_start,new.scheduled_end + 1,'[)')
    ) then
      raise exception using errcode = '23P01', message = 'Vehicle is unavailable during the selected maintenance period';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.touchcard_guard_rental_maintenance_secure() from public, anon, authenticated;

drop trigger if exists rental_booking_maintenance_guard on public.rental_bookings;
create trigger rental_booking_maintenance_guard
before insert or update of vehicle_id,pickup_date,return_date,status
on public.rental_bookings for each row
execute function private.touchcard_guard_rental_booking_secure();

drop trigger if exists rental_maintenance_booking_guard on public.rental_maintenance;
create trigger rental_maintenance_booking_guard
before insert or update of vehicle_id,scheduled_start,scheduled_end,status
on public.rental_maintenance for each row
execute function private.touchcard_guard_rental_maintenance_secure();

revoke all on function public.touchcard_guard_rental_booking() from public, anon, authenticated;
revoke all on function public.touchcard_guard_rental_maintenance() from public, anon, authenticated;

-- Enforce configured capacity for generic appointments without revealing booking rows.
create or replace function private.touchcard_guard_business_appointment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_local_start timestamp;
  v_day_of_week smallint;
  v_has_rules boolean;
  v_has_specific_rules boolean;
  v_rule_slot_minutes integer;
  v_rule_capacity integer;
  v_item_duration integer;
  v_item_capacity integer;
  v_duration integer;
  v_capacity integer;
  v_requested integer;
  v_booked integer;
  v_new_lock bigint;
  v_old_lock bigint;
  v_resource text;
begin
  if new.status not in ('pending','confirmed') then return new; end if;

  v_local_start := new.starts_at at time zone 'Africa/Casablanca';
  v_day_of_week := extract(dow from v_local_start)::smallint;

  select exists(select 1 from public.business_availability_rules r
    where r.organization_id = new.organization_id) into v_has_rules;

  if v_has_rules then
    select exists(select 1 from public.business_availability_rules r
      where r.organization_id = new.organization_id
        and r.specific_date = v_local_start::date) into v_has_specific_rules;

    if v_has_specific_rules then
      select r.slot_minutes,r.capacity into v_rule_slot_minutes,v_rule_capacity
      from public.business_availability_rules r
      where r.organization_id = new.organization_id
        and r.specific_date = v_local_start::date and r.is_available
        and r.starts_at <= v_local_start::time
        and r.ends_at >= v_local_start::time + make_interval(mins => r.slot_minutes)
      order by r.starts_at limit 1;
    else
      select r.slot_minutes,r.capacity into v_rule_slot_minutes,v_rule_capacity
      from public.business_availability_rules r
      where r.organization_id = new.organization_id
        and r.specific_date is null and r.day_of_week = v_day_of_week
        and r.is_available and r.starts_at <= v_local_start::time
        and r.ends_at >= v_local_start::time + make_interval(mins => r.slot_minutes)
      order by r.starts_at limit 1;
    end if;

    if not found then
      raise exception using errcode = '23P01', message = 'Selected time slot is outside the published availability';
    end if;
  end if;

  if new.catalog_item_id is not null then
    select i.duration_minutes,i.capacity into v_item_duration,v_item_capacity
    from public.business_catalog_items i
    where i.id = new.catalog_item_id and i.organization_id = new.organization_id and i.is_active;
    if not found then
      raise exception using errcode = '23503', message = 'Selected service is unavailable';
    end if;
  end if;

  v_duration := greatest(1,coalesce(v_item_duration,v_rule_slot_minutes,30));
  v_capacity := greatest(1,coalesce(v_item_capacity,v_rule_capacity,1));
  if new.ends_at is null then
    new.ends_at := new.starts_at + make_interval(mins => v_duration);
  end if;
  if new.ends_at <= new.starts_at then
    raise exception using errcode = '22007', message = 'Invalid appointment time range';
  end if;

  v_resource := coalesce(new.catalog_item_id::text,new.appointment_type);
  v_new_lock := pg_catalog.hashtextextended(
    new.organization_id::text || ':' || new.card_id::text || ':' ||
    v_resource || ':' || v_local_start::date::text,0
  );

  if tg_op = 'UPDATE' then
    v_old_lock := pg_catalog.hashtextextended(
      old.organization_id::text || ':' || old.card_id::text || ':' ||
      coalesce(old.catalog_item_id::text,old.appointment_type) || ':' ||
      (old.starts_at at time zone 'Africa/Casablanca')::date::text,0
    );
    if v_old_lock < v_new_lock then
      perform pg_catalog.pg_advisory_xact_lock(v_old_lock);
      if v_old_lock <> v_new_lock then perform pg_catalog.pg_advisory_xact_lock(v_new_lock); end if;
    else
      perform pg_catalog.pg_advisory_xact_lock(v_new_lock);
      if v_old_lock <> v_new_lock then perform pg_catalog.pg_advisory_xact_lock(v_old_lock); end if;
    end if;
  else
    perform pg_catalog.pg_advisory_xact_lock(v_new_lock);
  end if;

  v_requested := case when new.appointment_type = 'restaurant_booking'
    then greatest(coalesce(new.party_size,1),1) else 1 end;

  select coalesce(sum(case when new.appointment_type = 'restaurant_booking'
    then greatest(coalesce(a.party_size,1),1) else 1 end),0)::integer
  into v_booked
  from public.business_appointments a
  where a.organization_id = new.organization_id and a.card_id = new.card_id
    and a.appointment_type = new.appointment_type
    and a.catalog_item_id is not distinct from new.catalog_item_id
    and a.id is distinct from new.id
    and a.status in ('pending','confirmed')
    and tstzrange(a.starts_at,
      coalesce(a.ends_at,a.starts_at + make_interval(mins => v_duration)),'[)')
      && tstzrange(new.starts_at,new.ends_at,'[)');

  if v_booked + v_requested > v_capacity then
    raise exception using errcode = '23P01', message = 'Selected time slot is no longer available';
  end if;
  return new;
end;
$$;
revoke all on function private.touchcard_guard_business_appointment() from public, anon, authenticated;

drop trigger if exists business_appointment_capacity_guard on public.business_appointments;
create trigger business_appointment_capacity_guard
before insert or update of organization_id,card_id,catalog_item_id,appointment_type,starts_at,ends_at,status,party_size
on public.business_appointments for each row
execute function private.touchcard_guard_business_appointment();

comment on function private.touchcard_guard_business_appointment() is
  'Internal trigger: enforce business appointment slot capacity without exposing customer booking rows.';
comment on function private.touchcard_guard_rental_booking_secure() is
  'Internal trigger: serialize vehicle booking requests and check rental/maintenance conflicts.';
