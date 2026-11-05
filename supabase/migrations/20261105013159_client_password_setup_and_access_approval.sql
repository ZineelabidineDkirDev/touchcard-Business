alter table public.prospect_requests
  add column if not exists password_initialized boolean not null default false,
  add column if not exists client_access_enabled boolean not null default false;

drop policy if exists prospect_requests_client_read_own on public.prospect_requests;
create policy prospect_requests_client_read_own
on public.prospect_requests
for select
to authenticated
using (user_id = (select auth.uid()));
