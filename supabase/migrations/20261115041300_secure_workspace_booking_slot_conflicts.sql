-- Serialize generic public booking requests and reject already claimed exact time slots.
-- The trigger only compares slot/resource identifiers internally; no customer data is exposed.
create or replace function private.touchcard_guard_workspace_booking_slot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.request_type <> 'booking'
     or new.requested_at is null
     or new.status not in ('pending','confirmed','in_progress') then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      new.organization_id::text || ':' || new.card_id::text || ':' || new.requested_at::text,
      0
    )
  );

  if exists (
    select 1
    from public.workspace_requests existing
    where existing.organization_id = new.organization_id
      and existing.card_id = new.card_id
      and existing.request_type = 'booking'
      and existing.requested_at = new.requested_at
      and existing.id is distinct from new.id
      and existing.status in ('pending','confirmed','in_progress')
      and (
        jsonb_array_length(new.items) = 0
        or jsonb_array_length(existing.items) = 0
        or exists (
          select 1
          from jsonb_array_elements(new.items) new_item
          join jsonb_array_elements(existing.items) old_item
            on old_item->>'product_id' = new_item->>'product_id'
        )
      )
  ) then
    raise exception using
      errcode = '23P01',
      message = 'Selected booking slot is no longer available';
  end if;

  return new;
end;
$$;

revoke all on function private.touchcard_guard_workspace_booking_slot()
  from public, anon, authenticated;

drop trigger if exists workspace_booking_slot_guard on public.workspace_requests;
create trigger workspace_booking_slot_guard
before insert or update of organization_id,card_id,request_type,requested_at,items,status
on public.workspace_requests
for each row
execute function private.touchcard_guard_workspace_booking_slot();

comment on function private.touchcard_guard_workspace_booking_slot() is
  'Internal trigger: atomically reserve exact generic booking time slots without exposing customer records.';
