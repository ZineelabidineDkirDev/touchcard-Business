-- TouchCard: client-controlled NFC profile fields and safe public analytics events.
alter table public.cards
  add column if not exists public_fields jsonb not null default '{}'::jsonb,
  add column if not exists public_settings jsonb not null
    default '{"show_phone":true,"show_email":true,"show_website":true,"show_save_contact":true}'::jsonb;

alter table public.cards
  drop constraint if exists cards_public_fields_object_check,
  add constraint cards_public_fields_object_check
    check (jsonb_typeof(public_fields) = 'object'),
  drop constraint if exists cards_public_settings_object_check,
  add constraint cards_public_settings_object_check
    check (jsonb_typeof(public_settings) = 'object');

create index if not exists card_events_card_type_created_idx
  on public.card_events(card_id, event_type, created_at desc);

drop policy if exists events_insert_public_card on public.card_events;
create policy events_insert_public_card on public.card_events
for insert to anon, authenticated
with check (
  event_type in ('view', 'qr_scan', 'nfc_scan', 'click', 'contact_save')
  and exists (
    select 1
    from public.cards c
    where c.id = card_id
      and c.organization_id = organization_id
      and c.is_published = true
  )
);

grant insert on public.card_events to anon, authenticated;
