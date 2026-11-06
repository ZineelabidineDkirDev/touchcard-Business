-- Align prospect card values with the four public offers and add server-side abuse throttling.
alter table public.prospect_requests
  drop constraint if exists prospect_requests_card_type_check;

alter table public.prospect_requests
  add constraint prospect_requests_card_type_check
  check (card_type = any (array['service'::text, 'contact'::text, 'e-business'::text, 'google-review'::text]));

create table if not exists public.prospect_request_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  email_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists prospect_request_attempts_ip_created_idx
  on public.prospect_request_attempts (ip_hash, created_at desc);
create index if not exists prospect_request_attempts_email_created_idx
  on public.prospect_request_attempts (email_hash, created_at desc);

alter table public.prospect_request_attempts enable row level security;
revoke all on public.prospect_request_attempts from anon, authenticated;
grant all on public.prospect_request_attempts to service_role;
