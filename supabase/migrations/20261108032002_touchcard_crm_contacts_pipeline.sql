alter table public.contacts
  add column if not exists status text not null default 'new',
  add column if not exists priority text not null default 'normal',
  add column if not exists job_title text,
  add column if not exists city text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.contacts
  drop constraint if exists contacts_status_check;
alter table public.contacts
  add constraint contacts_status_check
  check (status in ('new','to_contact','qualified','negotiation','won','lost'));

alter table public.contacts
  drop constraint if exists contacts_priority_check;
alter table public.contacts
  add constraint contacts_priority_check
  check (priority in ('low','normal','high','urgent'));

create index if not exists contacts_org_status_created_idx
  on public.contacts (organization_id, status, created_at desc);
create index if not exists contacts_org_follow_up_idx
  on public.contacts (organization_id, next_follow_up_at)
  where next_follow_up_at is not null;

create table if not exists public.contact_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  activity_type text not null check (activity_type in ('call','email','meeting','note','whatsapp','follow_up','status_change')),
  subject text not null,
  description text,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists contact_activities_org_contact_created_idx
  on public.contact_activities (organization_id, contact_id, created_at desc);
create index if not exists contact_activities_org_due_idx
  on public.contact_activities (organization_id, due_at)
  where completed_at is null and due_at is not null;

alter table public.contact_activities enable row level security;

create policy "contact_activities_select_member"
  on public.contact_activities for select to authenticated
  using (private.is_org_member(organization_id));

create policy "contact_activities_insert_staff"
  on public.contact_activities for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and private.has_org_role(organization_id, array['organization_admin'::app_role,'manager'::app_role,'staff'::app_role,'super_admin'::app_role])
    and exists (
      select 1 from public.contacts c
      where c.id = contact_id and c.organization_id = contact_activities.organization_id
    )
  );

create policy "contact_activities_update_staff"
  on public.contact_activities for update to authenticated
  using (private.has_org_role(organization_id, array['organization_admin'::app_role,'manager'::app_role,'staff'::app_role,'super_admin'::app_role]))
  with check (private.has_org_role(organization_id, array['organization_admin'::app_role,'manager'::app_role,'staff'::app_role,'super_admin'::app_role]));

grant select, insert, update, delete on public.contact_activities to authenticated;
