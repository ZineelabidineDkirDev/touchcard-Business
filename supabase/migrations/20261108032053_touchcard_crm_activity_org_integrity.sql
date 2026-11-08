drop policy if exists "contact_activities_update_staff" on public.contact_activities;
create policy "contact_activities_update_staff"
  on public.contact_activities for update to authenticated
  using (
    private.has_org_role(organization_id, array['organization_admin'::app_role,'manager'::app_role,'staff'::app_role,'super_admin'::app_role])
  )
  with check (
    private.has_org_role(organization_id, array['organization_admin'::app_role,'manager'::app_role,'staff'::app_role,'super_admin'::app_role])
    and exists (
      select 1 from public.contacts c
      where c.id = contact_id and c.organization_id = contact_activities.organization_id
    )
  );
