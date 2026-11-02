-- TouchCard: optimisation des index FK et politiques RLS sans doublons.
create index if not exists card_events_card_idx on public.card_events(card_id);
create index if not exists card_events_link_idx on public.card_events(link_id);
create index if not exists cards_created_by_idx on public.cards(created_by);
create index if not exists contacts_card_idx on public.contacts(card_id);
create index if not exists nfc_tags_card_idx on public.nfc_tags(card_id);
create index if not exists organization_members_user_idx on public.organization_members(user_id);
create index if not exists organizations_owner_idx on public.organizations(owner_id);
create index if not exists points_transactions_account_idx on public.points_transactions(account_id);
create index if not exists points_transactions_created_by_idx on public.points_transactions(created_by);

-- Évite les politiques SELECT permissives en double : SELECT reste séparé,
-- les politiques de gestion sont limitées aux écritures.
drop policy if exists links_manage_admin on public.card_links;
create policy links_insert_admin on public.card_links
for insert to authenticated
with check (
  exists (
    select 1 from public.cards c
    where c.id = card_id
      and private.has_org_role(c.organization_id, array['organization_admin','manager','super_admin']::public.app_role[])
  )
);
create policy links_update_admin on public.card_links
for update to authenticated
using (
  exists (
    select 1 from public.cards c
    where c.id = card_id
      and private.has_org_role(c.organization_id, array['organization_admin','manager','super_admin']::public.app_role[])
  )
)
with check (
  exists (
    select 1 from public.cards c
    where c.id = card_id
      and private.has_org_role(c.organization_id, array['organization_admin','manager','super_admin']::public.app_role[])
  )
);
create policy links_delete_admin on public.card_links
for delete to authenticated
using (
  exists (
    select 1 from public.cards c
    where c.id = card_id
      and private.has_org_role(c.organization_id, array['organization_admin','manager','super_admin']::public.app_role[])
  )
);

drop policy if exists nfc_manage_admin on public.nfc_tags;
create policy nfc_insert_admin on public.nfc_tags
for insert to authenticated
with check (
  exists (
    select 1 from public.cards c
    where c.id = card_id
      and private.has_org_role(c.organization_id, array['organization_admin','manager','super_admin']::public.app_role[])
  )
);
create policy nfc_update_admin on public.nfc_tags
for update to authenticated
using (
  exists (
    select 1 from public.cards c
    where c.id = card_id
      and private.has_org_role(c.organization_id, array['organization_admin','manager','super_admin']::public.app_role[])
  )
)
with check (
  exists (
    select 1 from public.cards c
    where c.id = card_id
      and private.has_org_role(c.organization_id, array['organization_admin','manager','super_admin']::public.app_role[])
  )
);
create policy nfc_delete_admin on public.nfc_tags
for delete to authenticated
using (
  exists (
    select 1 from public.cards c
    where c.id = card_id
      and private.has_org_role(c.organization_id, array['organization_admin','manager','super_admin']::public.app_role[])
  )
);

drop policy if exists loyalty_programs_manage on public.loyalty_programs;
create policy loyalty_programs_insert on public.loyalty_programs
for insert to authenticated
with check (private.has_org_role(organization_id, array['organization_admin','manager','staff','super_admin']::public.app_role[]));
create policy loyalty_programs_update on public.loyalty_programs
for update to authenticated
using (private.has_org_role(organization_id, array['organization_admin','manager','staff','super_admin']::public.app_role[]))
with check (private.has_org_role(organization_id, array['organization_admin','manager','staff','super_admin']::public.app_role[]));
create policy loyalty_programs_delete on public.loyalty_programs
for delete to authenticated
using (private.has_org_role(organization_id, array['organization_admin','manager','staff','super_admin']::public.app_role[]));

drop policy if exists loyalty_accounts_manage on public.loyalty_accounts;
create policy loyalty_accounts_insert on public.loyalty_accounts
for insert to authenticated
with check (
  exists (
    select 1 from public.loyalty_programs p
    where p.id = program_id
      and private.has_org_role(p.organization_id, array['organization_admin','manager','staff','super_admin']::public.app_role[])
  )
);
create policy loyalty_accounts_update on public.loyalty_accounts
for update to authenticated
using (
  exists (
    select 1 from public.loyalty_programs p
    where p.id = program_id
      and private.has_org_role(p.organization_id, array['organization_admin','manager','staff','super_admin']::public.app_role[])
  )
)
with check (
  exists (
    select 1 from public.loyalty_programs p
    where p.id = program_id
      and private.has_org_role(p.organization_id, array['organization_admin','manager','staff','super_admin']::public.app_role[])
  )
);
create policy loyalty_accounts_delete on public.loyalty_accounts
for delete to authenticated
using (
  exists (
    select 1 from public.loyalty_programs p
    where p.id = program_id
      and private.has_org_role(p.organization_id, array['organization_admin','manager','staff','super_admin']::public.app_role[])
  )
);

drop policy if exists products_manage_member on public.products;
create policy products_insert_member on public.products
for insert to authenticated
with check (private.has_org_role(organization_id, array['organization_admin','manager','super_admin']::public.app_role[]));
create policy products_update_member on public.products
for update to authenticated
using (private.has_org_role(organization_id, array['organization_admin','manager','super_admin']::public.app_role[]))
with check (private.has_org_role(organization_id, array['organization_admin','manager','super_admin']::public.app_role[]));
create policy products_delete_member on public.products
for delete to authenticated
using (private.has_org_role(organization_id, array['organization_admin','manager','super_admin']::public.app_role[]));
