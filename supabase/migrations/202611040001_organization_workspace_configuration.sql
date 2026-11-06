-- Store the approved client workspace template and module selection.
alter table public.organizations
  add column if not exists workspace_config jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'organizations_workspace_config_object_check'
      and conrelid = 'public.organizations'::regclass
  ) then
    alter table public.organizations
      add constraint organizations_workspace_config_object_check
      check (jsonb_typeof(workspace_config) = 'object');
  end if;
end
$$;

comment on column public.organizations.workspace_config is
  'Super Admin-approved workspace template, enabled modules, client choices and plan settings.';
