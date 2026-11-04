alter table public.prospect_requests
  add column if not exists project_needs jsonb not null
  default '{"selected":[],"reservation_mode":null,"reservation_channels":[],"management_needs":[]}'::jsonb;

comment on column public.prospect_requests.project_needs is
  'Structured business requirements from the conditional prospect questionnaire, used by sales to configure each client CRM.';
