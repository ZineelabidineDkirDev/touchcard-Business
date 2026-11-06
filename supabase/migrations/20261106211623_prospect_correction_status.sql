alter table public.prospect_requests
  drop constraint if exists prospect_requests_status_check;

alter table public.prospect_requests
  add constraint prospect_requests_status_check
  check (status = any (array[
    'new'::text, 'to_contact'::text, 'in_discussion'::text, 'quote_sent'::text,
    'approved'::text, 'correction_requested'::text, 'in_production'::text,
    'completed'::text, 'rejected'::text, 'cancelled'::text
  ]));
