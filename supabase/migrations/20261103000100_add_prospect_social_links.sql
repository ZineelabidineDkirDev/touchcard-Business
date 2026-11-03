alter table public.prospect_requests
  add column if not exists social_links jsonb not null default '[]'::jsonb;

comment on column public.prospect_requests.social_links is
  'Professional website and social profile links supplied with a prospect request.';
