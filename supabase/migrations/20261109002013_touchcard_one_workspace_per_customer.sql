-- A client account owns one TouchCard workspace.
-- Existing owner IDs were checked for duplicates before this index was applied.
create unique index if not exists organizations_owner_id_unique_idx
on public.organizations(owner_id);
