-- Allow the single platform owner account to read cross-organization dashboard data.
-- This is additive: existing tenant/member policies remain unchanged.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='organizations' and policyname='platform_admin_read_all') then
    create policy platform_admin_read_all on public.organizations for select to authenticated
      using ((select auth.jwt() ->> 'email') = 'zainmawada@gmail.com');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cards' and policyname='platform_admin_read_all') then
    create policy platform_admin_read_all on public.cards for select to authenticated
      using ((select auth.jwt() ->> 'email') = 'zainmawada@gmail.com');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='card_links' and policyname='platform_admin_read_all') then
    create policy platform_admin_read_all on public.card_links for select to authenticated
      using ((select auth.jwt() ->> 'email') = 'zainmawada@gmail.com');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='card_events' and policyname='platform_admin_read_all') then
    create policy platform_admin_read_all on public.card_events for select to authenticated
      using ((select auth.jwt() ->> 'email') = 'zainmawada@gmail.com');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='prospect_requests' and policyname='platform_admin_read_all') then
    create policy platform_admin_read_all on public.prospect_requests for select to authenticated
      using ((select auth.jwt() ->> 'email') = 'zainmawada@gmail.com');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='prospect_requests' and policyname='platform_admin_update_all') then
    create policy platform_admin_update_all on public.prospect_requests for update to authenticated
      using ((select auth.jwt() ->> 'email') = 'zainmawada@gmail.com')
      with check ((select auth.jwt() ->> 'email') = 'zainmawada@gmail.com');
  end if;
end
$$;