-- Permit the dedicated doctor_appointments module to use booking data.
drop policy if exists business_availability_read on public.business_availability_rules;
create policy business_availability_read on public.business_availability_rules for select to anon,authenticated using (
 private.is_org_member(organization_id) or exists (
  select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=business_availability_rules.organization_id and c.is_published=true
  and (o.workspace_config->'modules' ? 'bookings' or o.workspace_config->'modules' ? 'doctor_appointments')
  and o.workspace_config->'modules' ? 'availability_calendar'
 )
);
drop policy if exists business_appointments_insert on public.business_appointments;
create policy business_appointments_insert on public.business_appointments for insert to anon,authenticated with check (
 private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]) or exists (
  select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=business_appointments.organization_id and c.id=business_appointments.card_id and c.is_published=true
  and (o.workspace_config->'modules' ? 'bookings' or o.workspace_config->'modules' ? 'doctor_appointments')
 )
);
