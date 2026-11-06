create table if not exists public.card_design_requests (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 organization_id uuid not null references public.organizations(id) on delete cascade,
 template_id text not null check (template_id in ('midnight','minimal','studio','service-pro','atelier','business','market')),
 card_type text not null check (card_type in ('contact','service','e-business')),
 notes text not null default '' check (char_length(notes)<=700),
 status text not null default 'pending' check (status in ('pending','approved','revision_requested','rejected')),
 admin_note text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists card_design_requests_user_created_idx on public.card_design_requests(user_id,created_at desc);
create index if not exists card_design_requests_status_created_idx on public.card_design_requests(status,created_at desc);
alter table public.card_design_requests enable row level security;
grant select,insert on public.card_design_requests to authenticated;
grant update on public.card_design_requests to authenticated;
drop policy if exists card_design_requests_owner_read on public.card_design_requests;
create policy card_design_requests_owner_read on public.card_design_requests for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists card_design_requests_owner_insert on public.card_design_requests;
create policy card_design_requests_owner_insert on public.card_design_requests for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.organization_members m where m.user_id=(select auth.uid()) and m.organization_id=card_design_requests.organization_id));
drop policy if exists card_design_requests_admin_read on public.card_design_requests;
create policy card_design_requests_admin_read on public.card_design_requests for select to authenticated using(exists(select 1 from public.organization_members m where m.user_id=(select auth.uid()) and m.role='super_admin'::public.app_role));
drop policy if exists card_design_requests_admin_update on public.card_design_requests;
create policy card_design_requests_admin_update on public.card_design_requests for update to authenticated using(exists(select 1 from public.organization_members m where m.user_id=(select auth.uid()) and m.role='super_admin'::public.app_role)) with check(exists(select 1 from public.organization_members m where m.user_id=(select auth.uid()) and m.role='super_admin'::public.app_role));
