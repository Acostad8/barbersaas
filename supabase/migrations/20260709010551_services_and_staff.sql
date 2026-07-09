-- =============================================================
-- Phase 4: service catalog + staff profiles + time off
-- =============================================================

-- ---------- Service categories ----------
create table public.service_categories (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  name       text not null check (char_length(name) between 2 and 80),
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create index service_categories_tenant_id_idx on public.service_categories (tenant_id);

create trigger service_categories_set_updated_at
  before update on public.service_categories
  for each row execute function public.set_updated_at();

-- ---------- Services ----------
create table public.services (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants (id) on delete cascade,
  category_id      uuid references public.service_categories (id) on delete set null,
  name             text not null check (char_length(name) between 2 and 120),
  description      text,
  duration_minutes integer not null check (duration_minutes between 5 and 480),
  price            numeric(12,2) not null check (price >= 0),
  commission_rate  numeric(5,2) not null default 0 check (commission_rate between 0 and 100),
  tax_rate         numeric(5,2) not null default 0 check (tax_rate between 0 and 100),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (tenant_id, name)
);

comment on table public.services is 'Service catalog. commission_rate/tax_rate are percentages; price is tax-exclusive. Business rules for pricing live here, not in the client.';

create index services_tenant_id_idx on public.services (tenant_id);
create index services_category_id_idx on public.services (category_id);

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ---------- Barber profiles (staff detail per membership) ----------
create table public.barber_profiles (
  membership_id   uuid primary key references public.memberships (id) on delete cascade,
  tenant_id       uuid not null references public.tenants (id) on delete cascade,
  bio             text,
  specialties     text[] not null default '{}',
  -- weekly working hours, same shape as branches.schedule
  schedule        jsonb not null default '{}'::jsonb
                  check (jsonb_typeof(schedule) = 'object'),
  -- overrides services.commission_rate when set
  commission_rate numeric(5,2) check (commission_rate is null or commission_rate between 0 and 100),
  hired_at        date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index barber_profiles_tenant_id_idx on public.barber_profiles (tenant_id);

create trigger barber_profiles_set_updated_at
  before update on public.barber_profiles
  for each row execute function public.set_updated_at();

-- ---------- Barber ↔ services they can perform ----------
create table public.barber_services (
  membership_id uuid not null references public.memberships (id) on delete cascade,
  service_id    uuid not null references public.services (id) on delete cascade,
  tenant_id     uuid not null references public.tenants (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (membership_id, service_id)
);

create index barber_services_tenant_id_idx on public.barber_services (tenant_id);
create index barber_services_service_id_idx on public.barber_services (service_id);

-- ---------- Time off ----------
create type public.time_off_status as enum ('pending', 'approved', 'rejected');

create table public.time_off (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants (id) on delete cascade,
  membership_id uuid not null references public.memberships (id) on delete cascade,
  starts_on     date not null,
  ends_on       date not null,
  reason        text,
  status        public.time_off_status not null default 'pending',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create index time_off_tenant_id_idx on public.time_off (tenant_id);
create index time_off_membership_id_idx on public.time_off (membership_id);

create trigger time_off_set_updated_at
  before update on public.time_off
  for each row execute function public.set_updated_at();

-- Helper: does the current user own this membership?
create or replace function public.owns_membership(p_membership_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.id = p_membership_id
      and m.user_id = (select auth.uid())
      and m.is_active
  );
$$;

revoke execute on function public.owns_membership(uuid) from public, anon;
grant execute on function public.owns_membership(uuid) to authenticated;

-- ---------- RLS ----------
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.barber_profiles enable row level security;
alter table public.barber_services enable row level security;
alter table public.time_off enable row level security;

-- service_categories
create policy "members can view categories"
  on public.service_categories for select
  to authenticated
  using (public.is_member_of(tenant_id));

create policy "managers can manage categories"
  on public.service_categories for all
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]))
  with check (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

-- services
create policy "members can view services"
  on public.services for select
  to authenticated
  using (public.is_member_of(tenant_id));

create policy "managers can manage services"
  on public.services for all
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]))
  with check (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

-- barber_profiles
create policy "members can view barber profiles"
  on public.barber_profiles for select
  to authenticated
  using (public.is_member_of(tenant_id));

create policy "managers can manage barber profiles"
  on public.barber_profiles for all
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]))
  with check (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

create policy "barbers can update own profile"
  on public.barber_profiles for update
  to authenticated
  using (public.owns_membership(membership_id))
  with check (public.owns_membership(membership_id));

-- barber_services
create policy "members can view barber services"
  on public.barber_services for select
  to authenticated
  using (public.is_member_of(tenant_id));

create policy "managers can manage barber services"
  on public.barber_services for all
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]))
  with check (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

-- time_off
create policy "staff can view time off"
  on public.time_off for select
  to authenticated
  using (
    public.owns_membership(membership_id)
    or public.has_role(tenant_id, array['admin','manager']::public.member_role[])
  );

create policy "staff can request own time off"
  on public.time_off for insert
  to authenticated
  with check (
    public.owns_membership(membership_id)
    and public.is_member_of(tenant_id)
    and status = 'pending'
  );

create policy "managers can manage time off"
  on public.time_off for update
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]))
  with check (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

create policy "managers can delete time off"
  on public.time_off for delete
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));
