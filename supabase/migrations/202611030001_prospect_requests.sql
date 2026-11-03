create table if not exists public.prospect_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  city text not null,
  activity_sector text not null,
  email text not null,
  phone text not null,
  card_type text not null check (card_type in ('service', 'contact', 'e-business')),
  reason text,
  customization_requested boolean not null default false,
  brand_name text,
  logo_url text,
  business_address text,
  business_phone text,
  status text not null default 'new'
    check (status in ('new', 'to_contact', 'in_discussion', 'quote_sent', 'approved', 'in_production', 'completed', 'rejected', 'cancelled')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prospect_requests_created_at_idx
  on public.prospect_requests (created_at desc);
create index if not exists prospect_requests_status_idx
  on public.prospect_requests (status);
create index if not exists prospect_requests_email_idx
  on public.prospect_requests (lower(email));

alter table public.prospect_requests enable row level security;

grant insert on public.prospect_requests to anon, authenticated;
grant select, update on public.prospect_requests to authenticated;

drop policy if exists prospect_requests_public_insert on public.prospect_requests;
create policy prospect_requests_public_insert
  on public.prospect_requests for insert to anon, authenticated
  with check (
    length(trim(full_name)) between 2 and 160
    and length(trim(email)) between 5 and 254
    and length(trim(phone)) between 6 and 40
    and (user_id is null or user_id = (select auth.uid()))
  );

drop policy if exists prospect_requests_owner_read on public.prospect_requests;
create policy prospect_requests_owner_read
  on public.prospect_requests for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists prospect_requests_admin_read on public.prospect_requests;
create policy prospect_requests_admin_read
  on public.prospect_requests for select to authenticated
  using (
    exists (
      select 1 from public.organization_members m
      where m.user_id = (select auth.uid())
        and m.role = 'super_admin'::public.app_role
    )
  );

drop policy if exists prospect_requests_admin_update on public.prospect_requests;
create policy prospect_requests_admin_update
  on public.prospect_requests for update to authenticated
  using (
    exists (
      select 1 from public.organization_members m
      where m.user_id = (select auth.uid())
        and m.role = 'super_admin'::public.app_role
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.user_id = (select auth.uid())
        and m.role = 'super_admin'::public.app_role
    )
  );

create or replace function public.claim_prospect_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.prospect_requests
     set user_id = auth.uid(), updated_at = now()
   where id = request_id
     and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
     and (user_id is null or user_id = auth.uid());

  if not found then
    raise exception 'Request not found or email mismatch';
  end if;
end;
$$;

revoke all on function public.claim_prospect_request(uuid) from public, anon;
grant execute on function public.claim_prospect_request(uuid) to authenticated;

-- Public logo uploads for prospect intake; public bucket URLs are used only as prospect attachments.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('prospect-logos', 'prospect-logos', true, 2097152, array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/png','image/jpeg','image/webp','image/svg+xml'];

drop policy if exists prospect_logos_public_insert on storage.objects;
create policy prospect_logos_public_insert on storage.objects
for insert to anon, authenticated
with check (
  bucket_id = 'prospect-logos'
  and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
);

drop policy if exists prospect_logos_admin_read on storage.objects;
create policy prospect_logos_admin_read on storage.objects
for select to authenticated
using (
  bucket_id = 'prospect-logos'
  and exists (
    select 1 from public.organization_members m
    where m.user_id = (select auth.uid())
      and m.role = 'super_admin'::public.app_role
  )
);
