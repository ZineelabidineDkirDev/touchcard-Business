-- Client-owned media for NFC cards, catalog items, CRM contacts and account avatars.
-- Files are public because they are displayed on published public NFC pages.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('client-media', 'client-media', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif'];

drop policy if exists "Client media is publicly readable" on storage.objects;
create policy "Client media is publicly readable" on storage.objects
for select to public using (bucket_id = 'client-media');

drop policy if exists "Organization members upload client media" on storage.objects;
create policy "Organization members upload client media" on storage.objects
for insert to authenticated with check (
  bucket_id = 'client-media'
  and (storage.foldername(name))[1] in (
    select om.organization_id::text
    from public.organization_members om
    where om.user_id = (select auth.uid())
  )
);

drop policy if exists "Organization members update client media" on storage.objects;
create policy "Organization members update client media" on storage.objects
for update to authenticated
using (
  bucket_id = 'client-media'
  and (storage.foldername(name))[1] in (
    select om.organization_id::text
    from public.organization_members om
    where om.user_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'client-media'
  and (storage.foldername(name))[1] in (
    select om.organization_id::text
    from public.organization_members om
    where om.user_id = (select auth.uid())
  )
);

drop policy if exists "Organization members delete client media" on storage.objects;
create policy "Organization members delete client media" on storage.objects
for delete to authenticated using (
  bucket_id = 'client-media'
  and (storage.foldername(name))[1] in (
    select om.organization_id::text
    from public.organization_members om
    where om.user_id = (select auth.uid())
  )
);

alter table public.contacts add column if not exists avatar_url text;
