create index if not exists contact_activities_contact_id_idx
  on public.contact_activities (contact_id);
create index if not exists contact_activities_created_by_idx
  on public.contact_activities (created_by);
