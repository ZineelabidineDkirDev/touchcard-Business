-- Public visitors may create appointment requests but never read submitted requests.
revoke select on public.business_appointments from anon;
