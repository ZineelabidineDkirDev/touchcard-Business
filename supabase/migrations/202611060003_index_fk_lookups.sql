-- Cover the two foreign keys reported by the Supabase performance advisor.
create index if not exists prospect_requests_user_id_idx
  on public.prospect_requests (user_id);

create index if not exists card_design_requests_organization_id_idx
  on public.card_design_requests (organization_id);
