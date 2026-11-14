-- When restaurant capacity is not configured, count reservations rather than guest seats.
-- This avoids rejecting a normal party of 2+ simply because no numeric capacity was set.
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
  v_use_party_capacity boolean;
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
  v_use_party_capacity := new.appointment_type = 'restaurant_booking'
    and (v_item_capacity is not null or v_rule_capacity is not null);
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

  v_requested := case when v_use_party_capacity
    then greatest(coalesce(new.party_size,1),1) else 1 end;

  select coalesce(sum(case when v_use_party_capacity
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
