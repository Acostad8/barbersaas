-- =============================================================
-- Foundation: multi-tenant base, roles, profiles, memberships
-- =============================================================

-- ---------- Enums ----------
create type public.member_role as enum (
  'admin',
  'manager',
  'receptionist',
  'barber',
  'accountant',
  'client'
);

-- ---------- Tables ----------
create table public.tenants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 2 and 120),
  slug       text not null unique
             check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tenants is 'Each barbershop business (tenant). All tenant-scoped tables reference tenants.id.';

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  avatar_url text,
  phone      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is '1:1 extension of auth.users with app-level profile data.';

create table public.memberships (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       public.member_role not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

comment on table public.memberships is 'Links a user to a tenant with a role. A user can belong to multiple tenants.';

create index memberships_tenant_id_idx on public.memberships (tenant_id);
create index memberships_user_id_idx on public.memberships (user_id);

-- ---------- updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger tenants_set_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger memberships_set_updated_at
  before update on public.memberships
  for each row execute function public.set_updated_at();

-- ---------- Auto-create profile on signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- RLS helpers ----------
-- SECURITY DEFINER so they can read memberships without recursing into
-- memberships' own RLS policies.
create or replace function public.is_member_of(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.tenant_id = p_tenant_id
      and m.user_id = (select auth.uid())
      and m.is_active
  );
$$;

create or replace function public.has_role(p_tenant_id uuid, p_roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.tenant_id = p_tenant_id
      and m.user_id = (select auth.uid())
      and m.is_active
      and m.role = any (p_roles)
  );
$$;

create or replace function public.shares_tenant_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships my
    join public.memberships them on them.tenant_id = my.tenant_id
    where my.user_id = (select auth.uid())
      and my.is_active
      and them.user_id = p_user_id
      and them.is_active
  );
$$;

revoke execute on function public.is_member_of(uuid) from anon;
revoke execute on function public.has_role(uuid, public.member_role[]) from anon;
revoke execute on function public.shares_tenant_with(uuid) from anon;

-- ---------- Tenant bootstrap ----------
-- Creating a tenant and becoming its admin must be atomic; RLS on
-- memberships blocks direct self-insert, so this runs as SECURITY DEFINER.
create or replace function public.create_tenant(p_name text, p_slug text)
returns public.tenants
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant public.tenants;
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'authentication required';
  end if;

  insert into public.tenants (name, slug)
  values (p_name, p_slug)
  returning * into v_tenant;

  insert into public.memberships (tenant_id, user_id, role)
  values (v_tenant.id, v_uid, 'admin');

  return v_tenant;
end;
$$;

revoke execute on function public.create_tenant(text, text) from anon;

-- ---------- RLS ----------
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;

-- tenants
create policy "members can view their tenant"
  on public.tenants for select
  to authenticated
  using (public.is_member_of(id));

create policy "admins can update their tenant"
  on public.tenants for update
  to authenticated
  using (public.has_role(id, array['admin']::public.member_role[]))
  with check (public.has_role(id, array['admin']::public.member_role[]));

create policy "admins can delete their tenant"
  on public.tenants for delete
  to authenticated
  using (public.has_role(id, array['admin']::public.member_role[]));

-- no INSERT policy on tenants: creation only via create_tenant()

-- profiles
create policy "users can view their own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "users can view co-member profiles"
  on public.profiles for select
  to authenticated
  using (public.shares_tenant_with(id));

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- profile INSERT happens via handle_new_user trigger (security definer)

-- memberships
create policy "users can view their own memberships"
  on public.memberships for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "staff can view tenant memberships"
  on public.memberships for select
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

create policy "admins can insert memberships"
  on public.memberships for insert
  to authenticated
  with check (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

create policy "admins can update memberships"
  on public.memberships for update
  to authenticated
  using (public.has_role(tenant_id, array['admin']::public.member_role[]))
  with check (public.has_role(tenant_id, array['admin']::public.member_role[]));

create policy "admins can delete memberships"
  on public.memberships for delete
  to authenticated
  using (public.has_role(tenant_id, array['admin']::public.member_role[]));
