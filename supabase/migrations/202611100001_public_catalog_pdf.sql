-- Public PDF catalogue for beauty, restaurant and barber workspaces.
create table if not exists public.organization_catalog_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organization_catalog_documents enable row level security;

grant select on public.organization_catalog_documents to anon, authenticated;
grant insert, update, delete on public.organization_catalog_documents to authenticated;

drop policy if exists "Public can view organization catalog documents" on public.organization_catalog_documents;
create policy "Public can view organization catalog documents"
on public.organization_catalog_documents for select to anon, authenticated
using (true);

drop policy if exists "Organization members manage their catalog documents" on public.organization_catalog_documents;
create policy "Organization members manage their catalog documents"
on public.organization_catalog_documents for all to authenticated
using (exists (
  select 1 from public.organization_members om
  where om.organization_id = organization_catalog_documents.organization_id
    and om.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members om
  where om.organization_id = organization_catalog_documents.organization_id
    and om.user_id = (select auth.uid())
));

update storage.buckets
set file_size_limit = 15728640,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif','application/pdf']
where id = 'client-media';
