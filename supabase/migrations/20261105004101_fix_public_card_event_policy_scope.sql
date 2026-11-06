drop policy if exists events_insert_public_card on public.card_events;
create policy events_insert_public_card on public.card_events
for insert to anon, authenticated
with check (
  event_type in ('view', 'qr_scan', 'nfc_scan', 'click', 'contact_save')
  and exists (
    select 1
    from public.cards c
    where c.id = public.card_events.card_id
      and c.organization_id = public.card_events.organization_id
      and c.is_published = true
  )
);
