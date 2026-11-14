-- Industry-specific business models. Additive schema only.
create extension if not exists btree_gist;

create table public.rental_vehicles (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 card_id uuid not null references public.cards(id) on delete cascade,
 brand text not null check(length(trim(brand)) between 1 and 80), model text not null check(length(trim(model)) between 1 and 100),
 category text not null default 'economy', model_year smallint check(model_year between 1950 and 2100),
 seats smallint not null default 5 check(seats between 1 and 60),
 transmission text not null default 'manual' check(transmission in ('manual','automatic','other')),
 fuel_type text not null default 'petrol' check(fuel_type in ('petrol','diesel','hybrid','electric','other')),
 daily_rate numeric(12,2) not null check(daily_rate>=0), currency char(3) not null default 'MAD',
 description text, image_url text, is_active boolean not null default true, is_published boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,organization_id)
);
create index rental_vehicles_public_idx on public.rental_vehicles(organization_id,is_published,is_active,category);

create table public.rental_vehicle_private (
 vehicle_id uuid primary key, organization_id uuid not null references public.organizations(id) on delete cascade,
 registration_number text, vin text, current_mileage integer check(current_mileage is null or current_mileage>=0),
 insurance_expiry date, inspection_expiry date, notes text, updated_at timestamptz not null default now(),
 foreign key(vehicle_id,organization_id) references public.rental_vehicles(id,organization_id) on delete cascade
);
create unique index rental_private_vin_uq on public.rental_vehicle_private(organization_id,vin) where vin is not null;
create unique index rental_private_registration_uq on public.rental_vehicle_private(organization_id,registration_number) where registration_number is not null;

create table public.rental_bookings (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 card_id uuid not null references public.cards(id) on delete cascade, vehicle_id uuid not null,
 customer_name text not null check(length(trim(customer_name)) between 1 and 180),
 customer_email text, customer_phone text not null, pickup_date date not null, return_date date not null,
 pickup_location text, return_location text, quoted_daily_rate numeric(12,2) not null default 0 check(quoted_daily_rate>=0),
 total_amount numeric(12,2) not null default 0 check(total_amount>=0), currency char(3) not null default 'MAD',
 status text not null default 'pending' check(status in ('pending','confirmed','active','cancelled','completed','rejected')),
 customer_message text, internal_notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(return_date>pickup_date), foreign key(vehicle_id,organization_id) references public.rental_vehicles(id,organization_id) on delete restrict,
 constraint rental_bookings_no_vehicle_overlap exclude using gist(vehicle_id with =,daterange(pickup_date,return_date,'[)') with &&) where(status in ('confirmed','active'))
);
create index rental_bookings_org_status_dates_idx on public.rental_bookings(organization_id,status,pickup_date,return_date);

create table public.rental_maintenance (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 vehicle_id uuid not null, maintenance_type text not null check(maintenance_type in ('oil_change','service','repair','inspection','tires','insurance','other')),
 title text not null check(length(trim(title)) between 1 and 180), description text,
 scheduled_start date not null, scheduled_end date not null, current_mileage integer check(current_mileage is null or current_mileage>=0),
 next_due_date date, next_due_mileage integer check(next_due_mileage is null or next_due_mileage>=0),
 cost numeric(12,2) check(cost is null or cost>=0), currency char(3) not null default 'MAD',
 status text not null default 'planned' check(status in ('planned','in_progress','completed','cancelled')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(scheduled_end>=scheduled_start), foreign key(vehicle_id,organization_id) references public.rental_vehicles(id,organization_id) on delete cascade
);
create index rental_maintenance_org_vehicle_date_idx on public.rental_maintenance(organization_id,vehicle_id,scheduled_start desc);

create function public.touchcard_snapshot_rental_quote() returns trigger language plpgsql set search_path='' as $$
declare v_rate numeric(12,2); v_currency char(3);
begin
 select v.daily_rate,v.currency into v_rate,v_currency from public.rental_vehicles v
 join public.cards c on c.id=v.card_id and c.organization_id=v.organization_id
 join public.organizations o on o.id=v.organization_id
 where v.id=new.vehicle_id and v.organization_id=new.organization_id and v.card_id=new.card_id
 and v.is_active and v.is_published and c.is_published and o.workspace_config->'modules' ? 'car_rental';
 if v_rate is null then raise exception 'Vehicle is not available for public booking'; end if;
 new.quoted_daily_rate:=v_rate; new.currency:=v_currency; new.total_amount:=v_rate*(new.return_date-new.pickup_date);
 new.status:='pending'; return new;
end $$;
create trigger rental_booking_quote_snapshot before insert on public.rental_bookings for each row execute function public.touchcard_snapshot_rental_quote();

create table public.healthcare_practitioners (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 user_id uuid references auth.users(id) on delete set null, full_name text not null check(length(trim(full_name)) between 1 and 180),
 professional_title text, specialty text, biography text, avatar_url text, languages text[] not null default '{}',
 is_active boolean not null default true, is_public boolean not null default true, display_order integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,organization_id)
);
create index healthcare_practitioners_org_active_idx on public.healthcare_practitioners(organization_id,is_active,is_public,display_order);

create table public.healthcare_locations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 160), address text, city text, region text, country text not null default 'MA',
 phone text, latitude numeric(9,6) check(latitude between -90 and 90), longitude numeric(9,6) check(longitude between -180 and 180),
 is_active boolean not null default true, is_public boolean not null default true, is_primary boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,organization_id)
);
create index healthcare_locations_org_active_idx on public.healthcare_locations(organization_id,is_active,is_public);

create table public.healthcare_services (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 practitioner_id uuid, name text not null check(length(trim(name)) between 1 and 180), specialty text, description text,
 duration_minutes integer not null default 30 check(duration_minutes between 5 and 720),
 price numeric(12,2) check(price is null or price>=0), currency char(3) not null default 'MAD',
 consultation_mode text not null default 'in_person' check(consultation_mode in ('in_person','teleconsultation','home_visit')),
 image_url text, is_active boolean not null default true, is_public boolean not null default true, display_order integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,organization_id),
 foreign key(practitioner_id,organization_id) references public.healthcare_practitioners(id,organization_id) on delete restrict
);
create index healthcare_services_org_active_idx on public.healthcare_services(organization_id,is_active,is_public,display_order);

create table public.healthcare_availability_rules (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 practitioner_id uuid not null, location_id uuid, day_of_week smallint, specific_date date, starts_at time not null, ends_at time not null,
 slot_minutes integer not null default 30 check(slot_minutes between 5 and 720), is_available boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((day_of_week between 0 and 6 and specific_date is null) or (day_of_week is null and specific_date is not null)),
 check(ends_at>starts_at),
 foreign key(practitioner_id,organization_id) references public.healthcare_practitioners(id,organization_id) on delete cascade,
 foreign key(location_id,organization_id) references public.healthcare_locations(id,organization_id) on delete restrict
);
create index healthcare_availability_lookup_idx on public.healthcare_availability_rules(organization_id,practitioner_id,specific_date,day_of_week,is_available);

create table public.healthcare_appointments (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 card_id uuid not null references public.cards(id) on delete cascade, practitioner_id uuid, service_id uuid, location_id uuid,
 patient_name text not null check(length(trim(patient_name)) between 1 and 180), patient_phone text not null, patient_email text,
 starts_at timestamptz not null, ends_at timestamptz not null,
 consultation_mode text not null default 'in_person' check(consultation_mode in ('in_person','teleconsultation','home_visit')),
 status text not null default 'pending' check(status in ('pending','confirmed','cancelled','completed','rejected')),
 -- No diagnoses, prescriptions, clinical notes or medical-record fields.
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_at>starts_at),
 foreign key(practitioner_id,organization_id) references public.healthcare_practitioners(id,organization_id) on delete restrict,
 foreign key(service_id,organization_id) references public.healthcare_services(id,organization_id) on delete restrict,
 foreign key(location_id,organization_id) references public.healthcare_locations(id,organization_id) on delete restrict,
 constraint healthcare_practitioner_no_overlap exclude using gist(practitioner_id with =,tstzrange(starts_at,ends_at,'[)') with &&)
 where(practitioner_id is not null and status='confirmed'),
 constraint healthcare_location_no_overlap exclude using gist(location_id with =,tstzrange(starts_at,ends_at,'[)') with &&)
 where(location_id is not null and status='confirmed')
);
create index healthcare_appointments_org_status_start_idx on public.healthcare_appointments(organization_id,status,starts_at);
create index healthcare_appointments_practitioner_start_idx on public.healthcare_appointments(practitioner_id,starts_at) where practitioner_id is not null;

alter table public.rental_vehicles enable row level security;
alter table public.rental_vehicle_private enable row level security;
alter table public.rental_bookings enable row level security;
alter table public.rental_maintenance enable row level security;
alter table public.healthcare_practitioners enable row level security;
alter table public.healthcare_locations enable row level security;
alter table public.healthcare_services enable row level security;
alter table public.healthcare_availability_rules enable row level security;
alter table public.healthcare_appointments enable row level security;

grant select on public.rental_vehicles to anon,authenticated;
grant insert on public.rental_bookings to anon,authenticated;
grant select,insert,update,delete on public.rental_bookings,public.rental_vehicle_private,public.rental_maintenance to authenticated;
grant select on public.healthcare_practitioners,public.healthcare_locations,public.healthcare_services,public.healthcare_availability_rules to anon,authenticated;
grant insert on public.healthcare_appointments to anon,authenticated;
grant select,insert,update,delete on public.healthcare_appointments to authenticated;
grant insert,update,delete on public.healthcare_practitioners,public.healthcare_locations,public.healthcare_services,public.healthcare_availability_rules to authenticated;

create policy rental_vehicles_member_read on public.rental_vehicles for select to authenticated using(private.is_org_member(organization_id));
create policy rental_vehicles_public_read on public.rental_vehicles for select to anon,authenticated using(is_active and is_published and exists(
 select 1 from public.cards c join public.organizations o on o.id=c.organization_id where c.id=rental_vehicles.card_id
 and c.organization_id=rental_vehicles.organization_id and c.is_published and o.workspace_config->'modules' ? 'car_rental'));
create policy rental_vehicles_manager_manage on public.rental_vehicles for all to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]))
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy rental_vehicle_private_manager_only on public.rental_vehicle_private for all to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]))
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy rental_bookings_manager_read on public.rental_bookings for select to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy rental_bookings_public_create on public.rental_bookings for insert to anon,authenticated with check(status='pending' and exists(
 select 1 from public.rental_vehicles v join public.cards c on c.id=v.card_id join public.organizations o on o.id=v.organization_id
 where v.id=rental_bookings.vehicle_id and v.organization_id=rental_bookings.organization_id and v.card_id=rental_bookings.card_id
 and v.is_active and v.is_published and c.is_published and o.workspace_config->'modules' ? 'car_rental'));
create policy rental_bookings_manager_update on public.rental_bookings for update to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]))
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy rental_bookings_manager_delete on public.rental_bookings for delete to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy rental_maintenance_manager_only on public.rental_maintenance for all to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]))
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

create policy healthcare_practitioners_member_read on public.healthcare_practitioners for select to authenticated using(private.is_org_member(organization_id));
create policy healthcare_practitioners_own_read on public.healthcare_practitioners for select to authenticated using(user_id=(select auth.uid()));
create policy healthcare_practitioners_public_read on public.healthcare_practitioners for select to anon,authenticated using(is_active and is_public and exists(
 select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=healthcare_practitioners.organization_id
 and c.is_published and o.workspace_config->'modules' ? 'doctor_appointments'));
create policy healthcare_practitioners_manager_manage on public.healthcare_practitioners for all to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]))
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

create policy healthcare_locations_member_read on public.healthcare_locations for select to authenticated using(private.is_org_member(organization_id));
create policy healthcare_locations_public_read on public.healthcare_locations for select to anon,authenticated using(is_active and is_public and exists(
 select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=healthcare_locations.organization_id
 and c.is_published and o.workspace_config->'modules' ? 'doctor_appointments'));
create policy healthcare_locations_manager_manage on public.healthcare_locations for all to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]))
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

create policy healthcare_services_member_read on public.healthcare_services for select to authenticated using(private.is_org_member(organization_id));
create policy healthcare_services_public_read on public.healthcare_services for select to anon,authenticated using(is_active and is_public and exists(
 select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=healthcare_services.organization_id
 and c.is_published and o.workspace_config->'modules' ? 'doctor_appointments'));
create policy healthcare_services_manager_manage on public.healthcare_services for all to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]))
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

create policy healthcare_availability_member_read on public.healthcare_availability_rules for select to authenticated using(private.is_org_member(organization_id));
create policy healthcare_availability_public_read on public.healthcare_availability_rules for select to anon,authenticated using(is_available and exists(
 select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=healthcare_availability_rules.organization_id
 and c.is_published and o.workspace_config->'modules' ? 'doctor_appointments'));
create policy healthcare_availability_manager_manage on public.healthcare_availability_rules for all to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]))
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

create policy healthcare_appointments_manager_read on public.healthcare_appointments for select to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy healthcare_appointments_assigned_practitioner_read on public.healthcare_appointments for select to authenticated
 using(practitioner_id is not null and exists(select 1 from public.healthcare_practitioners p where p.id=healthcare_appointments.practitioner_id
 and p.organization_id=healthcare_appointments.organization_id and p.user_id=(select auth.uid())));
create policy healthcare_appointments_public_create on public.healthcare_appointments for insert to anon,authenticated with check(status='pending' and exists(
 select 1 from public.cards c join public.organizations o on o.id=c.organization_id where c.id=healthcare_appointments.card_id
 and c.organization_id=healthcare_appointments.organization_id and c.is_published and o.workspace_config->'modules' ? 'doctor_appointments')
 and (practitioner_id is null or exists(select 1 from public.healthcare_practitioners p where p.id=healthcare_appointments.practitioner_id
 and p.organization_id=healthcare_appointments.organization_id and p.is_active and p.is_public))
 and (service_id is null or exists(select 1 from public.healthcare_services s where s.id=healthcare_appointments.service_id
 and s.organization_id=healthcare_appointments.organization_id and s.is_active and s.is_public
 and (s.practitioner_id is null or s.practitioner_id=healthcare_appointments.practitioner_id)))
 and (location_id is null or exists(select 1 from public.healthcare_locations l where l.id=healthcare_appointments.location_id
 and l.organization_id=healthcare_appointments.organization_id and l.is_active and l.is_public)));
create policy healthcare_appointments_manager_update on public.healthcare_appointments for update to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]))
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy healthcare_appointments_manager_delete on public.healthcare_appointments for delete to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

comment on table public.rental_vehicles is 'Public vehicle listings; sensitive fleet identifiers are isolated in rental_vehicle_private.';
comment on table public.rental_vehicle_private is 'Private fleet identifiers and compliance details; never public.';
comment on table public.rental_bookings is 'Rental requests; exclusion constraint prevents overlapping confirmed bookings per vehicle.';
comment on table public.rental_maintenance is 'Vehicle maintenance, service, inspection and oil-change schedule.';
comment on table public.healthcare_practitioners is 'Public professional directory; contains no patient data.';
comment on table public.healthcare_services is 'Healthcare services and consultation types.';
comment on table public.healthcare_locations is 'Public clinic, practice and care-center locations.';
comment on table public.healthcare_availability_rules is 'Weekly and date-specific practitioner availability.';
comment on table public.healthcare_appointments is 'Private appointment requests; no clinical records, diagnoses, prescriptions or medical notes.';
