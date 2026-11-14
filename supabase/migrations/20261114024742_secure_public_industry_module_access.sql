create or replace function private.touchcard_public_module_enabled(target_org uuid,target_card uuid,module_key text)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists(select 1 from public.cards c join public.organizations o on o.id=c.organization_id
 where c.id=target_card and c.organization_id=target_org and c.is_published=true
 and o.workspace_config->'modules' ? module_key);
$$;
revoke all on function private.touchcard_public_module_enabled(uuid,uuid,text) from public;
grant execute on function private.touchcard_public_module_enabled(uuid,uuid,text) to anon,authenticated;

drop policy if exists rental_vehicles_member_read on public.rental_vehicles;
drop policy if exists rental_vehicles_public_read on public.rental_vehicles;
create policy rental_vehicles_select on public.rental_vehicles for select to anon,authenticated
using(private.is_org_member(organization_id) or (is_active and is_published and private.touchcard_public_module_enabled(organization_id,card_id,'car_rental')));

drop policy if exists rental_bookings_public_create on public.rental_bookings;
create policy rental_bookings_public_create on public.rental_bookings for insert to anon,authenticated
with check(status='pending' and private.touchcard_public_module_enabled(organization_id,card_id,'car_rental')
and exists(select 1 from public.rental_vehicles v where v.id=rental_bookings.vehicle_id and v.organization_id=rental_bookings.organization_id
and v.card_id=rental_bookings.card_id and v.is_active and v.is_published));

drop policy if exists healthcare_practitioners_member_read on public.healthcare_practitioners;
drop policy if exists healthcare_practitioners_public_read on public.healthcare_practitioners;
create policy healthcare_practitioners_select on public.healthcare_practitioners for select to anon,authenticated
using(private.is_org_member(organization_id) or (is_active and is_public and exists(select 1 from public.cards c
where c.organization_id=healthcare_practitioners.organization_id and c.is_published
and private.touchcard_public_module_enabled(healthcare_practitioners.organization_id,c.id,'doctor_appointments'))));

drop policy if exists healthcare_locations_member_read on public.healthcare_locations;
drop policy if exists healthcare_locations_public_read on public.healthcare_locations;
create policy healthcare_locations_select on public.healthcare_locations for select to anon,authenticated
using(private.is_org_member(organization_id) or (is_active and is_public and exists(select 1 from public.cards c
where c.organization_id=healthcare_locations.organization_id and c.is_published
and private.touchcard_public_module_enabled(healthcare_locations.organization_id,c.id,'doctor_appointments'))));

drop policy if exists healthcare_services_member_read on public.healthcare_services;
drop policy if exists healthcare_services_public_read on public.healthcare_services;
create policy healthcare_services_select on public.healthcare_services for select to anon,authenticated
using(private.is_org_member(organization_id) or (is_active and is_public and exists(select 1 from public.cards c
where c.organization_id=healthcare_services.organization_id and c.is_published
and private.touchcard_public_module_enabled(healthcare_services.organization_id,c.id,'doctor_appointments'))));

drop policy if exists healthcare_availability_member_read on public.healthcare_availability_rules;
drop policy if exists healthcare_availability_public_read on public.healthcare_availability_rules;
create policy healthcare_availability_select on public.healthcare_availability_rules for select to anon,authenticated
using(private.is_org_member(organization_id) or (is_available and exists(select 1 from public.cards c
where c.organization_id=healthcare_availability_rules.organization_id and c.is_published
and private.touchcard_public_module_enabled(healthcare_availability_rules.organization_id,c.id,'doctor_appointments'))));

drop policy if exists healthcare_appointments_public_create on public.healthcare_appointments;
create policy healthcare_appointments_public_create on public.healthcare_appointments for insert to anon,authenticated
with check(status='pending' and private.touchcard_public_module_enabled(organization_id,card_id,'doctor_appointments')
and (practitioner_id is null or exists(select 1 from public.healthcare_practitioners p where p.id=healthcare_appointments.practitioner_id
and p.organization_id=healthcare_appointments.organization_id and p.is_active and p.is_public))
and (service_id is null or exists(select 1 from public.healthcare_services s where s.id=healthcare_appointments.service_id
and s.organization_id=healthcare_appointments.organization_id and s.is_active and s.is_public
and (s.practitioner_id is null or s.practitioner_id=healthcare_appointments.practitioner_id)))
and (location_id is null or exists(select 1 from public.healthcare_locations l where l.id=healthcare_appointments.location_id
and l.organization_id=healthcare_appointments.organization_id and l.is_active and l.is_public)));

create or replace function public.touchcard_snapshot_rental_quote()
returns trigger language plpgsql set search_path='' as $$
declare v_rate numeric(12,2); v_currency char(3);
begin
 if not private.touchcard_public_module_enabled(new.organization_id,new.card_id,'car_rental') then
  raise exception 'Rental module is not enabled on this published card';
 end if;
 select v.daily_rate,v.currency into v_rate,v_currency from public.rental_vehicles v
 where v.id=new.vehicle_id and v.organization_id=new.organization_id and v.card_id=new.card_id and v.is_active and v.is_published;
 if v_rate is null then raise exception 'Vehicle is not available for public booking'; end if;
 new.quoted_daily_rate:=v_rate; new.currency:=v_currency; new.total_amount:=v_rate*(new.return_date-new.pickup_date);
 new.status:='pending'; return new;
end $$;
