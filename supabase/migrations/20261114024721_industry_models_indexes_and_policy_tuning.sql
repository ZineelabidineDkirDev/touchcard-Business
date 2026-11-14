-- Cover composite and single-column foreign keys used by organization-scoped lookups.
create index if not exists rental_vehicles_card_id_idx on public.rental_vehicles(card_id);
create index if not exists rental_vehicle_private_vehicle_org_idx on public.rental_vehicle_private(vehicle_id,organization_id);
create index if not exists rental_bookings_card_id_idx on public.rental_bookings(card_id);
create index if not exists rental_bookings_vehicle_org_idx on public.rental_bookings(vehicle_id,organization_id);
create index if not exists rental_maintenance_vehicle_org_idx on public.rental_maintenance(vehicle_id,organization_id);
create index if not exists healthcare_services_practitioner_org_idx on public.healthcare_services(practitioner_id,organization_id) where practitioner_id is not null;
create index if not exists healthcare_availability_practitioner_org_idx on public.healthcare_availability_rules(practitioner_id,organization_id);
create index if not exists healthcare_availability_location_org_idx on public.healthcare_availability_rules(location_id,organization_id) where location_id is not null;
create index if not exists healthcare_appointments_card_id_idx on public.healthcare_appointments(card_id);
create index if not exists healthcare_appointments_location_org_idx on public.healthcare_appointments(location_id,organization_id) where location_id is not null;
create index if not exists healthcare_appointments_practitioner_org_idx on public.healthcare_appointments(practitioner_id,organization_id) where practitioner_id is not null;
create index if not exists healthcare_appointments_service_org_idx on public.healthcare_appointments(service_id,organization_id) where service_id is not null;
create index if not exists healthcare_practitioner_accounts_practitioner_org_idx on public.healthcare_practitioner_accounts(practitioner_id,organization_id);
create index if not exists healthcare_practitioner_accounts_user_id_idx on public.healthcare_practitioner_accounts(user_id);

drop policy if exists rental_vehicles_manager_manage on public.rental_vehicles;
create policy rental_vehicles_manager_insert on public.rental_vehicles for insert to authenticated
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy rental_vehicles_manager_update on public.rental_vehicles for update to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]))
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy rental_vehicles_manager_delete on public.rental_vehicles for delete to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

drop policy if exists healthcare_practitioners_manager_manage on public.healthcare_practitioners;
create policy healthcare_practitioners_manager_insert on public.healthcare_practitioners for insert to authenticated
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy healthcare_practitioners_manager_update on public.healthcare_practitioners for update to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]))
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy healthcare_practitioners_manager_delete on public.healthcare_practitioners for delete to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

drop policy if exists healthcare_locations_manager_manage on public.healthcare_locations;
create policy healthcare_locations_manager_insert on public.healthcare_locations for insert to authenticated
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy healthcare_locations_manager_update on public.healthcare_locations for update to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]))
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy healthcare_locations_manager_delete on public.healthcare_locations for delete to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

drop policy if exists healthcare_services_manager_manage on public.healthcare_services;
create policy healthcare_services_manager_insert on public.healthcare_services for insert to authenticated
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy healthcare_services_manager_update on public.healthcare_services for update to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]))
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy healthcare_services_manager_delete on public.healthcare_services for delete to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

drop policy if exists healthcare_availability_manager_manage on public.healthcare_availability_rules;
create policy healthcare_availability_manager_insert on public.healthcare_availability_rules for insert to authenticated
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy healthcare_availability_manager_update on public.healthcare_availability_rules for update to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]))
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy healthcare_availability_manager_delete on public.healthcare_availability_rules for delete to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

drop policy if exists healthcare_practitioner_accounts_manager_manage on public.healthcare_practitioner_accounts;
drop policy if exists healthcare_practitioner_accounts_own_read on public.healthcare_practitioner_accounts;
create policy healthcare_practitioner_accounts_read on public.healthcare_practitioner_accounts for select to authenticated
 using(user_id=(select auth.uid()) or private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy healthcare_practitioner_accounts_insert on public.healthcare_practitioner_accounts for insert to authenticated
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy healthcare_practitioner_accounts_update on public.healthcare_practitioner_accounts for update to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]))
 with check(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));
create policy healthcare_practitioner_accounts_delete on public.healthcare_practitioner_accounts for delete to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role]));

drop policy if exists healthcare_appointments_manager_read on public.healthcare_appointments;
drop policy if exists healthcare_appointments_assigned_practitioner_read on public.healthcare_appointments;
create policy healthcare_appointments_authorized_read on public.healthcare_appointments for select to authenticated
 using(private.has_org_role(organization_id,array['organization_admin'::app_role,'manager'::app_role,'super_admin'::app_role])
 or (practitioner_id is not null and exists(select 1 from public.healthcare_practitioner_accounts a
 where a.practitioner_id=healthcare_appointments.practitioner_id and a.organization_id=healthcare_appointments.organization_id
 and a.user_id=(select auth.uid()))));
