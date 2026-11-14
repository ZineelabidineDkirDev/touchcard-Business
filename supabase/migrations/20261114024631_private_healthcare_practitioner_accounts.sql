-- Keep authenticated practitioner identity mapping separate from public practitioner profiles.
drop policy if exists healthcare_practitioners_own_read on public.healthcare_practitioners;
drop policy if exists healthcare_appointments_assigned_practitioner_read on public.healthcare_appointments;
alter table public.healthcare_practitioners drop column user_id;
create table public.healthcare_practitioner_accounts (
 practitioner_id uuid primary key,
 organization_id uuid not null references public.organizations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 unique(organization_id,user_id),
 foreign key(practitioner_id,organization_id) references public.healthcare_practitioners(id,organization_id) on delete cascade
);
alter table public.healthcare_practitioner_accounts enable row level security;
grant select,insert,update,delete on public.healthcare_practitioner_accounts to authenticated;
create policy healthcare_practitioner_accounts_manager_manage on public.healthcare_practitioner_accounts
 for all to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]))
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy healthcare_practitioner_accounts_own_read on public.healthcare_practitioner_accounts
 for select to authenticated using(user_id=(select auth.uid()));
create policy healthcare_appointments_assigned_practitioner_read on public.healthcare_appointments
 for select to authenticated
 using(practitioner_id is not null and exists(
  select 1 from public.healthcare_practitioner_accounts a
  where a.practitioner_id=healthcare_appointments.practitioner_id
    and a.organization_id=healthcare_appointments.organization_id
    and a.user_id=(select auth.uid())
 ));
comment on table public.healthcare_practitioner_accounts is 'Private mapping between a practitioner profile and an authenticated team account; never public.';
