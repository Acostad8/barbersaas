-- =============================================================
-- Phase 5: appointments with DB-level double-booking prevention
-- =============================================================

create extension if not exists btree_gist with schema extensions;

create type public.appointment_status as enum (
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

create table public.appointments (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants (id) on delete cascade,
  branch_id     uuid references public.branches (id) on delete set null,
  client_id     uuid not null references public.clients (id) on delete restrict,
  membership_id uuid not null references public.memberships (id) on delete restrict,
  service_id    uuid not null references public.services (id) on delete restrict,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  status        public.appointment_status not null default 'scheduled',
  -- snapshot at booking time so later price changes don't rewrite history
  price         numeric(12,2) not null check (price >= 0),
  notes         text,
  cancel_reason text,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (ends_at > starts_at),
  -- one barber cannot have two live appointments at the same time
  constraint appointments_no_overlap exclude using gist (
    membership_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status not in ('cancelled', 'no_show'))
);

comment on table public.appointments is 'Bookings. Double-booking is prevented by the DB exclusion constraint, not client logic. price is a snapshot of services.price at booking time.';

create index appointments_tenant_starts_idx on public.appointments (tenant_id, starts_at);
create index appointments_membership_starts_idx on public.appointments (membership_id, starts_at);
create index appointments_client_id_idx on public.appointments (client_id);

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- ---------- Schedule blocks (vacations already in time_off; this is for ad-hoc blocks) ----------
create table public.schedule_blocks (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants (id) on delete cascade,
  branch_id     uuid references public.branches (id) on delete cascade,
  -- null membership = block applies to the whole branch/tenant
  membership_id uuid references public.memberships (id) on delete cascade,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  reason        text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index schedule_blocks_tenant_starts_idx on public.schedule_blocks (tenant_id, starts_at);

create trigger schedule_blocks_set_updated_at
  before update on public.schedule_blocks
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.appointments enable row level security;
alter table public.schedule_blocks enable row level security;

-- appointments: front desk sees all; barbers only their own
create policy "front desk can view appointments"
  on public.appointments for select
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager','receptionist']::public.member_role[]));

create policy "barbers can view own appointments"
  on public.appointments for select
  to authenticated
  using (public.owns_membership(membership_id));

create policy "front desk can insert appointments"
  on public.appointments for insert
  to authenticated
  with check (public.has_role(tenant_id, array['admin','manager','receptionist']::public.member_role[]));

create policy "front desk can update appointments"
  on public.appointments for update
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager','receptionist']::public.member_role[]))
  with check (public.has_role(tenant_id, array['admin','manager','receptionist']::public.member_role[]));

create policy "barbers can update own appointment status"
  on public.appointments for update
  to authenticated
  using (public.owns_membership(membership_id))
  with check (public.owns_membership(membership_id));

create policy "managers can delete appointments"
  on public.appointments for delete
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

-- schedule_blocks
create policy "members can view schedule blocks"
  on public.schedule_blocks for select
  to authenticated
  using (public.is_member_of(tenant_id));

create policy "schedulers can manage blocks"
  on public.schedule_blocks for all
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager','receptionist']::public.member_role[]))
  with check (public.has_role(tenant_id, array['admin','manager','receptionist']::public.member_role[]));
