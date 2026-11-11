-- TouchCard business modules: catalog, availability, appointments, gym and school.
-- Additive only. Existing tables and rows are not altered or deleted.

create table if not exists public.business_catalog_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  item_type text not null check (item_type in ('service','menu','room')),
  name text not null check (length(trim(name)) between 1 and 180),
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  currency char(3) not null default 'MAD',
  image_url text,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  capacity integer check (capacity is null or capacity > 0),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_catalog_items_id_org_unique unique (id,organization_id)
);
create index if not exists business_catalog_items_org_type_active_idx on public.business_catalog_items (organization_id,item_type,is_active,display_order);

create table if not exists public.business_availability_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  day_of_week smallint,
  specific_date date,
  starts_at time not null,
  ends_at time not null,
  slot_minutes integer not null default 30 check (slot_minutes between 5 and 720),
  capacity integer not null default 1 check (capacity > 0),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_availability_rule_day_or_date check (
    (day_of_week between 0 and 6 and specific_date is null) or
    (day_of_week is null and specific_date is not null)
  ),
  constraint business_availability_rule_time_range check (ends_at > starts_at)
);
create unique index if not exists business_availability_weekly_unique_idx
  on public.business_availability_rules (organization_id,day_of_week,starts_at,ends_at) where specific_date is null;
create unique index if not exists business_availability_date_unique_idx
  on public.business_availability_rules (organization_id,specific_date,starts_at,ends_at) where specific_date is not null;

create table if not exists public.business_appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  catalog_item_id uuid,
  appointment_type text not null default 'appointment' check (appointment_type in ('appointment','consultation','reservation','restaurant_booking','other')),
  customer_name text not null check (length(trim(customer_name)) between 1 and 180),
  customer_email text,
  customer_phone text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  party_size integer check (party_size is null or party_size between 1 and 500),
  message text,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed','rejected')),
  source text not null default 'public_card',
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_appointments_end_after_start check (ends_at is null or ends_at > starts_at),
  constraint business_appointments_catalog_item_org_fk foreign key (catalog_item_id,organization_id)
    references public.business_catalog_items(id,organization_id) on delete restrict
);
create index if not exists business_appointments_org_start_idx on public.business_appointments (organization_id,starts_at desc);
create index if not exists business_appointments_org_status_created_idx on public.business_appointments (organization_id,status,created_at desc);

create table if not exists public.gym_membership_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  currency char(3) not null default 'MAD',
  duration_days integer not null check (duration_days between 1 and 3650),
  benefits jsonb not null default '[]'::jsonb check (jsonb_typeof(benefits) = 'array'),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gym_membership_plans_id_org_unique unique (id,organization_id)
);
create index if not exists gym_membership_plans_org_active_idx on public.gym_membership_plans (organization_id,is_active,display_order);

create table if not exists public.gym_registrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  membership_plan_id uuid,
  full_name text not null check (length(trim(full_name)) between 1 and 180),
  email text,
  phone text not null,
  birth_date date,
  preferred_start_date date,
  fitness_goals text,
  medical_notes text,
  status text not null default 'pending' check (status in ('pending','contacted','approved','active','rejected','cancelled')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gym_registration_plan_org_fk foreign key (membership_plan_id,organization_id)
    references public.gym_membership_plans(id,organization_id) on delete restrict
);
create index if not exists gym_registrations_org_status_created_idx on public.gym_registrations (organization_id,status,created_at desc);

create table if not exists public.school_programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 180),
  description text,
  duration_label text,
  price numeric(12,2) check (price is null or price >= 0),
  currency char(3) not null default 'MAD',
  capacity integer check (capacity is null or capacity > 0),
  start_date date,
  end_date date,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_programs_date_range check (end_date is null or start_date is null or end_date >= start_date),
  constraint school_programs_id_org_unique unique (id,organization_id)
);
create index if not exists school_programs_org_active_idx on public.school_programs (organization_id,is_active,display_order);

create table if not exists public.school_enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  program_id uuid,
  student_name text not null check (length(trim(student_name)) between 1 and 180),
  student_birth_date date,
  student_email text,
  student_phone text,
  guardian_name text,
  guardian_email text,
  guardian_phone text not null,
  previous_education text,
  message text,
  status text not null default 'pending' check (status in ('pending','under_review','accepted','enrolled','rejected','cancelled')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_enrollment_program_org_fk foreign key (program_id,organization_id)
    references public.school_programs(id,organization_id) on delete restrict
);
create index if not exists school_enrollments_org_status_created_idx on public.school_enrollments (organization_id,status,created_at desc);

alter table public.business_catalog_items enable row level security;
alter table public.business_availability_rules enable row level security;
alter table public.business_appointments enable row level security;
alter table public.gym_membership_plans enable row level security;
alter table public.gym_registrations enable row level security;
alter table public.school_programs enable row level security;
alter table public.school_enrollments enable row level security;

grant select on public.business_catalog_items to anon,authenticated;
grant insert,update,delete on public.business_catalog_items to authenticated;
grant select on public.business_availability_rules to anon,authenticated;
grant insert,update,delete on public.business_availability_rules to authenticated;
grant select,insert on public.business_appointments to anon;
grant select,insert,update,delete on public.business_appointments to authenticated;
grant select on public.gym_membership_plans to anon,authenticated;
grant insert,update,delete on public.gym_membership_plans to authenticated;
grant insert on public.gym_registrations to anon;
grant select,insert,update,delete on public.gym_registrations to authenticated;
grant select on public.school_programs to anon,authenticated;
grant insert,update,delete on public.school_programs to authenticated;
grant insert on public.school_enrollments to anon;
grant select,insert,update,delete on public.school_enrollments to authenticated;

create policy business_catalog_items_member_read on public.business_catalog_items for select to authenticated using (private.is_org_member(organization_id));
create policy business_catalog_items_public_read on public.business_catalog_items for select to anon,authenticated using (is_active and exists (
 select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=business_catalog_items.organization_id and c.is_published=true
 and ((business_catalog_items.item_type in ('service','menu') and o.workspace_config->'modules' ? 'service_catalog') or (business_catalog_items.item_type='room' and o.workspace_config->'modules' ? 'room_catalog'))
));
create policy business_catalog_items_manager_manage on public.business_catalog_items for all to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role])) with check (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

create policy business_availability_member_read on public.business_availability_rules for select to authenticated using (private.is_org_member(organization_id));
create policy business_availability_public_read on public.business_availability_rules for select to anon,authenticated using (exists (
 select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=business_availability_rules.organization_id and c.is_published=true
 and o.workspace_config->'modules' ? 'bookings' and o.workspace_config->'modules' ? 'availability_calendar'
));
create policy business_availability_manager_manage on public.business_availability_rules for all to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role])) with check (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

create policy business_appointments_member_read on public.business_appointments for select to authenticated using (private.is_org_member(organization_id));
create policy business_appointments_public_create on public.business_appointments for insert to anon,authenticated with check (exists (
 select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=business_appointments.organization_id and c.id=business_appointments.card_id and c.is_published=true and o.workspace_config->'modules' ? 'bookings'
));
create policy business_appointments_manager_manage on public.business_appointments for all to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role])) with check (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

create policy gym_membership_plans_member_read on public.gym_membership_plans for select to authenticated using (private.is_org_member(organization_id));
create policy gym_membership_plans_public_read on public.gym_membership_plans for select to anon,authenticated using (is_active and exists (
 select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=gym_membership_plans.organization_id and c.is_published=true and o.workspace_config->'modules' ? 'gym_registration'
));
create policy gym_membership_plans_manager_manage on public.gym_membership_plans for all to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role])) with check (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy gym_registrations_member_read on public.gym_registrations for select to authenticated using (private.is_org_member(organization_id));
create policy gym_registrations_public_create on public.gym_registrations for insert to anon,authenticated with check (exists (
 select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=gym_registrations.organization_id and c.id=gym_registrations.card_id and c.is_published=true and o.workspace_config->'modules' ? 'gym_registration'
));
create policy gym_registrations_manager_manage on public.gym_registrations for all to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role])) with check (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

create policy school_programs_member_read on public.school_programs for select to authenticated using (private.is_org_member(organization_id));
create policy school_programs_public_read on public.school_programs for select to anon,authenticated using (is_active and exists (
 select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=school_programs.organization_id and c.is_published=true and o.workspace_config->'modules' ? 'school_registration'
));
create policy school_programs_manager_manage on public.school_programs for all to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role])) with check (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy school_enrollments_member_read on public.school_enrollments for select to authenticated using (private.is_org_member(organization_id));
create policy school_enrollments_public_create on public.school_enrollments for insert to anon,authenticated with check (exists (
 select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=school_enrollments.organization_id and c.id=school_enrollments.card_id and c.is_published=true and o.workspace_config->'modules' ? 'school_registration'
));
create policy school_enrollments_manager_manage on public.school_enrollments for all to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role])) with check (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

comment on table public.business_catalog_items is 'Service, restaurant menu and accommodation catalog items for enabled TouchCard modules.';
comment on table public.business_availability_rules is 'Weekly and date-specific availability rules for bookings and appointments.';
comment on table public.business_appointments is 'Public appointment, consultation and reservation requests tied to a published TouchCard card.';
comment on table public.gym_membership_plans is 'Membership offers for organizations with the gym_registration module enabled.';
comment on table public.gym_registrations is 'Public gym membership registration requests.';
comment on table public.school_programs is 'Courses and programs offered by organizations with school_registration enabled.';
comment on table public.school_enrollments is 'Public school and training enrollment requests.';
