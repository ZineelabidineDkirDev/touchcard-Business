-- TouchCard: socle multi-organisation et politiques RLS.
-- À exécuter sur le projet Supabase SmartCard-Business.
create extension if not exists pgcrypto;

create type public.app_role as enum ('super_admin','organization_admin','manager','collaborator','staff','client');
create type public.subscription_status as enum ('trialing','active','past_due','cancelled','expired');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references auth.users(id),
  logo_url text,
  website text,
  phone text,
  country text not null default 'MA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'collaborator',
  created_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  slug text not null unique,
  full_name text not null,
  job_title text,
  company_name text,
  bio text,
  email text,
  phone text,
  website text,
  avatar_url text,
  cover_url text,
  theme jsonb not null default '{"accent":"#4f46e5","layout":"classic"}'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.card_links (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  label text not null,
  url text not null,
  kind text not null default 'website',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.nfc_tags (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  tag_uid text unique,
  public_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  card_id uuid references public.cards(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  company text,
  source text not null default 'manual',
  notes text,
  created_at timestamptz not null default now()
);

create table public.card_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  event_type text not null check (event_type in ('view','qr_scan','nfc_scan','click','contact_save')),
  link_id uuid references public.card_links(id) on delete set null,
  visitor_hash text,
  referrer text,
  created_at timestamptz not null default now()
);

create table public.loyalty_programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  points_per_currency numeric(10,2) not null default 1 check (points_per_currency > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.loyalty_accounts (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.loyalty_programs(id) on delete cascade,
  customer_name text not null,
  customer_email text,
  points_balance bigint not null default 0 check (points_balance >= 0),
  created_at timestamptz not null default now()
);

create table public.points_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.loyalty_accounts(id) on delete cascade,
  points_delta bigint not null check (points_delta <> 0),
  reason text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  currency char(3) not null default 'MAD',
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_code text not null default 'starter',
  status public.subscription_status not null default 'trialing',
  current_period_start timestamptz,
  current_period_end timestamptz,
  provider text,
  provider_reference text,
  created_at timestamptz not null default now()
);

create index cards_org_idx on public.cards(organization_id);
create index cards_public_slug_idx on public.cards(slug) where is_published = true;
create index contacts_org_idx on public.contacts(organization_id);
create index card_events_org_date_idx on public.card_events(organization_id,created_at desc);
create index loyalty_programs_org_idx on public.loyalty_programs(organization_id);

create or replace function public.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.organization_members m where m.organization_id = target_org and m.user_id = auth.uid());
$$;

create or replace function public.has_org_role(target_org uuid, allowed_roles public.app_role[])
returns boolean language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.organization_members m where m.organization_id = target_org and m.user_id = auth.uid() and m.role = any(allowed_roles));
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.cards enable row level security;
alter table public.card_links enable row level security;
alter table public.nfc_tags enable row level security;
alter table public.contacts enable row level security;
alter table public.card_events enable row level security;
alter table public.loyalty_programs enable row level security;
alter table public.loyalty_accounts enable row level security;
alter table public.points_transactions enable row level security;
alter table public.products enable row level security;
alter table public.subscriptions enable row level security;

create policy profiles_select_self on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_insert_self on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.add_organization_owner()
returns trigger language plpgsql security definer set search_path = public
as $
begin
  insert into public.organization_members(organization_id,user_id,role)
  values(new.id,new.owner_id,'organization_admin')
  on conflict (organization_id,user_id) do nothing;
  return new;
end;
$;

create trigger on_organization_created
after insert on public.organizations
for each row execute procedure public.add_organization_owner();

create or replace function public.add_organization_owner()
returns trigger language plpgsql security definer set search_path = public
as $
begin
  insert into public.organization_members(organization_id,user_id,role)
  values(new.id,new.owner_id,'organization_admin')
  on conflict (organization_id,user_id) do nothing;
  return new;
end;
$;

create trigger on_organization_created after insert on public.organizations for each row execute procedure public.add_organization_owner();

create policy organizations_select_member on public.organizations for select to authenticated using (public.is_org_member(id) or owner_id = auth.uid());
create policy organizations_insert_owner on public.organizations for insert to authenticated with check (owner_id = auth.uid());
create policy organizations_update_admin on public.organizations for update to authenticated using (public.has_org_role(id,array['organization_admin','super_admin']::public.app_role[])) with check (public.has_org_role(id,array['organization_admin','super_admin']::public.app_role[]));

create policy members_select_org on public.organization_members for select to authenticated using (public.is_org_member(organization_id) or user_id = auth.uid());
create policy members_insert_admin on public.organization_members for insert to authenticated with check (public.has_org_role(organization_id,array['organization_admin','super_admin']::public.app_role[]));
create policy members_update_admin on public.organization_members for update to authenticated using (public.has_org_role(organization_id,array['organization_admin','super_admin']::public.app_role[])) with check (public.has_org_role(organization_id,array['organization_admin','super_admin']::public.app_role[]));
create policy members_delete_admin on public.organization_members for delete to authenticated using (public.has_org_role(organization_id,array['organization_admin','super_admin']::public.app_role[]));

create policy cards_select_org_or_public on public.cards for select to anon,authenticated using (is_published = true or public.is_org_member(organization_id));
create policy cards_insert_member on public.cards for insert to authenticated with check (public.has_org_role(organization_id,array['organization_admin','manager','collaborator','super_admin']::public.app_role[]) and created_by = auth.uid());
create policy cards_update_member on public.cards for update to authenticated using (public.has_org_role(organization_id,array['organization_admin','manager','collaborator','super_admin']::public.app_role[])) with check (public.has_org_role(organization_id,array['organization_admin','manager','collaborator','super_admin']::public.app_role[]));
create policy cards_delete_admin on public.cards for delete to authenticated using (public.has_org_role(organization_id,array['organization_admin','super_admin']::public.app_role[]));

create policy links_select_published_or_member on public.card_links for select to anon,authenticated using (exists(select 1 from public.cards c where c.id = card_id and (c.is_published = true or public.is_org_member(c.organization_id))));
create policy links_manage_member on public.card_links for all to authenticated using (exists(select 1 from public.cards c where c.id = card_id and public.has_org_role(c.organization_id,array['organization_admin','manager','collaborator','super_admin']::public.app_role[]))) with check (exists(select 1 from public.cards c where c.id = card_id and public.has_org_role(c.organization_id,array['organization_admin','manager','collaborator','super_admin']::public.app_role[])));

create policy nfc_manage_member on public.nfc_tags for all to authenticated using (exists(select 1 from public.cards c where c.id = card_id and public.has_org_role(c.organization_id,array['organization_admin','manager','super_admin']::public.app_role[]))) with check (exists(select 1 from public.cards c where c.id = card_id and public.has_org_role(c.organization_id,array['organization_admin','manager','super_admin']::public.app_role[])));

create policy contacts_manage_member on public.contacts for all to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy events_read_member on public.card_events for select to authenticated using (public.is_org_member(organization_id));

create policy loyalty_programs_manage on public.loyalty_programs for all to authenticated using (public.has_org_role(organization_id,array['organization_admin','manager','staff','super_admin']::public.app_role[])) with check (public.has_org_role(organization_id,array['organization_admin','manager','staff','super_admin']::public.app_role[]));
create policy loyalty_accounts_manage on public.loyalty_accounts for all to authenticated using (exists(select 1 from public.loyalty_programs p where p.id = program_id and public.is_org_member(p.organization_id))) with check (exists(select 1 from public.loyalty_programs p where p.id = program_id and public.is_org_member(p.organization_id)));
create policy points_read_member on public.points_transactions for select to authenticated using (exists(select 1 from public.loyalty_accounts a join public.loyalty_programs p on p.id = a.program_id where a.id = account_id and public.is_org_member(p.organization_id)));
create policy products_select_active_or_member on public.products for select to anon,authenticated using (is_active = true or public.is_org_member(organization_id));
create policy products_manage_member on public.products for all to authenticated using (public.has_org_role(organization_id,array['organization_admin','manager','super_admin']::public.app_role[])) with check (public.has_org_role(organization_id,array['organization_admin','manager','super_admin']::public.app_role[]));
create policy subscriptions_select_admin on public.subscriptions for select to authenticated using (public.has_org_role(organization_id,array['organization_admin','super_admin']::public.app_role[]));

grant usage on schema public to anon,authenticated;
grant select on public.cards,public.card_links,public.products to anon,authenticated;
grant select,insert,update on public.profiles to authenticated;
grant select,insert,update,delete on public.organizations,public.organization_members,public.cards,public.card_links,public.nfc_tags,public.contacts,public.loyalty_programs,public.loyalty_accounts,public.products to authenticated;
grant select on public.card_events,public.points_transactions,public.subscriptions to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Les écritures de points doivent passer par une fonction RPC transactionnelle.
-- Les événements publics seront enregistrés via une Edge Function avec validation et limitation de débit.
