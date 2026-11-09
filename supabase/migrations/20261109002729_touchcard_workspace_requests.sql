create table if not exists public.workspace_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  request_type text not null check (request_type in ('order','booking','quote')),
  customer_name text not null check (char_length(trim(customer_name)) between 2 and 160),
  customer_email text,
  customer_phone text not null check (char_length(trim(customer_phone)) between 6 and 40),
  message text not null default '',
  requested_at timestamptz,
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  total numeric(12,2) not null default 0 check (total >= 0),
  currency char(3) not null default 'MAD',
  status text not null default 'pending' check (status in ('pending','confirmed','in_progress','completed','rejected','cancelled')),
  source text not null default 'public_card' check (source in ('public_card','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists workspace_requests_org_created_idx on public.workspace_requests(organization_id, created_at desc);
create index if not exists workspace_requests_org_status_idx on public.workspace_requests(organization_id, status, created_at desc);
create index if not exists workspace_requests_card_type_idx on public.workspace_requests(card_id, request_type, created_at desc);
alter table public.workspace_requests enable row level security;
create policy workspace_requests_member_read on public.workspace_requests
for select to authenticated using (private.is_org_member(organization_id));
create policy workspace_requests_manager_update on public.workspace_requests
for update to authenticated
using (private.has_org_role(organization_id, array['organization_admin','manager','super_admin']::public.app_role[]))
with check (private.has_org_role(organization_id, array['organization_admin','manager','super_admin']::public.app_role[]));
grant select, update on public.workspace_requests to authenticated;
revoke all on public.workspace_requests from anon;
create table if not exists public.workspace_request_rate_limits (
  ip_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0)
);
alter table public.workspace_request_rate_limits enable row level security;
revoke all on public.workspace_request_rate_limits from anon, authenticated;
grant all on public.workspace_request_rate_limits to service_role;
create or replace function private.consume_workspace_request_rate_limit(p_ip_hash text, p_limit integer default 12, p_window_seconds integer default 3600)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare allowed boolean;
begin
  insert into public.workspace_request_rate_limits(ip_hash, window_started_at, request_count)
  values (p_ip_hash, now(), 1)
  on conflict (ip_hash) do update
  set window_started_at = case
        when public.workspace_request_rate_limits.window_started_at < now() - make_interval(secs => p_window_seconds) then now()
        else public.workspace_request_rate_limits.window_started_at end,
      request_count = case
        when public.workspace_request_rate_limits.window_started_at < now() - make_interval(secs => p_window_seconds) then 1
        else public.workspace_request_rate_limits.request_count + 1 end;
  select request_count <= p_limit into allowed
  from public.workspace_request_rate_limits where ip_hash = p_ip_hash;
  return coalesce(allowed, false);
end;
$$;
revoke all on function private.consume_workspace_request_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function private.consume_workspace_request_rate_limit(text, integer, integer) to service_role;
