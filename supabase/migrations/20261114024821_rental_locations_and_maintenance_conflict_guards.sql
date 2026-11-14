-- Dedicated pickup/return locations and database-level protection against maintenance conflicts.
create table public.rental_locations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 160), address text, city text, region text, country text not null default 'MA',
 phone text, latitude numeric(9,6) check(latitude between -90 and 90), longitude numeric(9,6) check(longitude between -180 and 180),
 is_active boolean not null default true, is_public boolean not null default true, is_primary boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,organization_id)
);
create index rental_locations_org_active_idx on public.rental_locations(organization_id,is_active,is_public);
alter table public.rental_vehicles add column base_location_id uuid;
alter table public.rental_vehicles add constraint rental_vehicles_base_location_org_fk
 foreign key(base_location_id,organization_id) references public.rental_locations(id,organization_id) on delete restrict;
create index rental_vehicles_base_location_org_idx on public.rental_vehicles(base_location_id,organization_id) where base_location_id is not null;
alter table public.rental_bookings add column pickup_location_id uuid;
alter table public.rental_bookings add column return_location_id uuid;
alter table public.rental_bookings add constraint rental_bookings_pickup_location_org_fk
 foreign key(pickup_location_id,organization_id) references public.rental_locations(id,organization_id) on delete restrict;
alter table public.rental_bookings add constraint rental_bookings_return_location_org_fk
 foreign key(return_location_id,organization_id) references public.rental_locations(id,organization_id) on delete restrict;
create index rental_bookings_pickup_location_org_idx on public.rental_bookings(pickup_location_id,organization_id) where pickup_location_id is not null;
create index rental_bookings_return_location_org_idx on public.rental_bookings(return_location_id,organization_id) where return_location_id is not null;
alter table public.rental_locations enable row level security;
grant select on public.rental_locations to anon,authenticated;
grant insert,update,delete on public.rental_locations to authenticated;
create policy rental_locations_select on public.rental_locations for select to anon,authenticated
 using(private.is_org_member(organization_id) or (is_active and is_public and exists(
  select 1 from public.rental_vehicles v where v.organization_id=rental_locations.organization_id and v.is_active and v.is_published
  and private.touchcard_public_module_enabled(rental_locations.organization_id,v.card_id,'car_rental'))));
create policy rental_locations_manager_insert on public.rental_locations for insert to authenticated
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy rental_locations_manager_update on public.rental_locations for update to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]))
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy rental_locations_manager_delete on public.rental_locations for delete to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
alter table public.rental_maintenance add constraint rental_maintenance_no_vehicle_overlap
 exclude using gist(vehicle_id with =,daterange(scheduled_start,scheduled_end+1,'[)') with &&)
 where(status in ('planned','in_progress'));

create or replace function public.touchcard_guard_rental_booking() returns trigger language plpgsql set search_path='' as $$
begin
 if new.status in ('confirmed','active') then
  perform pg_advisory_xact_lock(hashtextextended(new.vehicle_id::text,0));
  if exists(select 1 from public.rental_maintenance m where m.vehicle_id=new.vehicle_id and m.organization_id=new.organization_id
   and m.status in ('planned','in_progress') and daterange(m.scheduled_start,m.scheduled_end+1,'[)') && daterange(new.pickup_date,new.return_date,'[)')) then
   raise exception 'Vehicle is blocked by scheduled maintenance during these dates';
  end if;
 end if; return new;
end $$;
create trigger rental_booking_maintenance_guard before insert or update of vehicle_id,pickup_date,return_date,status
 on public.rental_bookings for each row execute function public.touchcard_guard_rental_booking();

create or replace function public.touchcard_guard_rental_maintenance() returns trigger language plpgsql set search_path='' as $$
begin
 if new.status in ('planned','in_progress') then
  perform pg_advisory_xact_lock(hashtextextended(new.vehicle_id::text,0));
  if exists(select 1 from public.rental_bookings b where b.vehicle_id=new.vehicle_id and b.organization_id=new.organization_id
   and b.status in ('confirmed','active') and daterange(b.pickup_date,b.return_date,'[)') && daterange(new.scheduled_start,new.scheduled_end+1,'[)')) then
   raise exception 'Vehicle already has a confirmed rental during this maintenance period';
  end if;
 end if; return new;
end $$;
create trigger rental_maintenance_booking_guard before insert or update of vehicle_id,scheduled_start,scheduled_end,status
 on public.rental_maintenance for each row execute function public.touchcard_guard_rental_maintenance();
comment on table public.rental_locations is 'Public pickup and return branches for car rental organizations.';
