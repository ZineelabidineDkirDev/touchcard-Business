-- Add indexes for all new FK lookups and consolidate permissive RLS policies.
create index if not exists business_appointments_card_idx on public.business_appointments(card_id);
create index if not exists business_appointments_catalog_org_idx on public.business_appointments(catalog_item_id,organization_id);
create index if not exists gym_registrations_card_idx on public.gym_registrations(card_id);
create index if not exists gym_registrations_plan_org_idx on public.gym_registrations(membership_plan_id,organization_id);
create index if not exists school_enrollments_card_idx on public.school_enrollments(card_id);
create index if not exists school_enrollments_program_org_idx on public.school_enrollments(program_id,organization_id);

drop policy if exists business_catalog_items_member_read on public.business_catalog_items;
drop policy if exists business_catalog_items_public_read on public.business_catalog_items;
drop policy if exists business_catalog_items_manager_manage on public.business_catalog_items;
create policy business_catalog_items_read on public.business_catalog_items for select to anon,authenticated using (
 private.is_org_member(organization_id) or (is_active and exists (
  select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=business_catalog_items.organization_id and c.is_published=true
  and ((business_catalog_items.item_type in ('service','menu') and o.workspace_config->'modules' ? 'service_catalog') or (business_catalog_items.item_type='room' and o.workspace_config->'modules' ? 'room_catalog'))
 ))
);
create policy business_catalog_items_insert on public.business_catalog_items for insert to authenticated with check (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy business_catalog_items_update on public.business_catalog_items for update to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role])) with check (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy business_catalog_items_delete on public.business_catalog_items for delete to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

drop policy if exists business_availability_member_read on public.business_availability_rules;
drop policy if exists business_availability_public_read on public.business_availability_rules;
drop policy if exists business_availability_manager_manage on public.business_availability_rules;
create policy business_availability_read on public.business_availability_rules for select to anon,authenticated using (
 private.is_org_member(organization_id) or exists (
  select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=business_availability_rules.organization_id and c.is_published=true
  and o.workspace_config->'modules' ? 'bookings' and o.workspace_config->'modules' ? 'availability_calendar'
 )
);
create policy business_availability_insert on public.business_availability_rules for insert to authenticated with check (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy business_availability_update on public.business_availability_rules for update to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role])) with check (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy business_availability_delete on public.business_availability_rules for delete to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

drop policy if exists business_appointments_member_read on public.business_appointments;
drop policy if exists business_appointments_public_create on public.business_appointments;
drop policy if exists business_appointments_manager_manage on public.business_appointments;
create policy business_appointments_read on public.business_appointments for select to authenticated using (private.is_org_member(organization_id));
create policy business_appointments_insert on public.business_appointments for insert to anon,authenticated with check (
 private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]) or exists (
  select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=business_appointments.organization_id and c.id=business_appointments.card_id and c.is_published=true and o.workspace_config->'modules' ? 'bookings'
 )
);
create policy business_appointments_update on public.business_appointments for update to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role])) with check (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy business_appointments_delete on public.business_appointments for delete to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

drop policy if exists gym_membership_plans_member_read on public.gym_membership_plans;
drop policy if exists gym_membership_plans_public_read on public.gym_membership_plans;
drop policy if exists gym_membership_plans_manager_manage on public.gym_membership_plans;
create policy gym_membership_plans_read on public.gym_membership_plans for select to anon,authenticated using (
 private.is_org_member(organization_id) or (is_active and exists (
  select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=gym_membership_plans.organization_id and c.is_published=true and o.workspace_config->'modules' ? 'gym_registration'
 ))
);
create policy gym_membership_plans_insert on public.gym_membership_plans for insert to authenticated with check (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy gym_membership_plans_update on public.gym_membership_plans for update to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role])) with check (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy gym_membership_plans_delete on public.gym_membership_plans for delete to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

drop policy if exists gym_registrations_member_read on public.gym_registrations;
drop policy if exists gym_registrations_public_create on public.gym_registrations;
drop policy if exists gym_registrations_manager_manage on public.gym_registrations;
create policy gym_registrations_read on public.gym_registrations for select to authenticated using (private.is_org_member(organization_id));
create policy gym_registrations_insert on public.gym_registrations for insert to anon,authenticated with check (
 private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]) or exists (
  select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=gym_registrations.organization_id and c.id=gym_registrations.card_id and c.is_published=true and o.workspace_config->'modules' ? 'gym_registration'
 )
);
create policy gym_registrations_update on public.gym_registrations for update to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role])) with check (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy gym_registrations_delete on public.gym_registrations for delete to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

drop policy if exists school_programs_member_read on public.school_programs;
drop policy if exists school_programs_public_read on public.school_programs;
drop policy if exists school_programs_manager_manage on public.school_programs;
create policy school_programs_read on public.school_programs for select to anon,authenticated using (
 private.is_org_member(organization_id) or (is_active and exists (
  select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=school_programs.organization_id and c.is_published=true and o.workspace_config->'modules' ? 'school_registration'
 ))
);
create policy school_programs_insert on public.school_programs for insert to authenticated with check (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy school_programs_update on public.school_programs for update to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role])) with check (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy school_programs_delete on public.school_programs for delete to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

drop policy if exists school_enrollments_member_read on public.school_enrollments;
drop policy if exists school_enrollments_public_create on public.school_enrollments;
drop policy if exists school_enrollments_manager_manage on public.school_enrollments;
create policy school_enrollments_read on public.school_enrollments for select to authenticated using (private.is_org_member(organization_id));
create policy school_enrollments_insert on public.school_enrollments for insert to anon,authenticated with check (
 private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]) or exists (
  select 1 from public.organizations o join public.cards c on c.organization_id=o.id where o.id=school_enrollments.organization_id and c.id=school_enrollments.card_id and c.is_published=true and o.workspace_config->'modules' ? 'school_registration'
 )
);
create policy school_enrollments_update on public.school_enrollments for update to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role])) with check (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy school_enrollments_delete on public.school_enrollments for delete to authenticated using (private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
