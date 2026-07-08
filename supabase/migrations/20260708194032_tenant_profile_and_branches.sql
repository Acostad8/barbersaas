-- =============================================================
-- Phase 2: tenant profile fields, branches, branch assignment,
-- tenant-assets storage bucket
-- =============================================================

-- ---------- Tenant profile ----------
alter table public.tenants
  add column description text,
  add column phone       text,
  add column email       text,
  add column website     text,
  add column socials     jsonb not null default '{}'::jsonb
                         check (jsonb_typeof(socials) = 'object'),
  add column timezone    text  not null default 'America/Bogota',
  add column currency    text  not null default 'COP'
                         check (currency ~ '^[A-Z]{3}$'),
  add column logo_url    text,
  add column banner_url  text;

-- ---------- Branches ----------
create table public.branches (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  name       text not null check (char_length(name) between 2 and 120),
  address    text,
  city       text,
  phone      text,
  -- weekly schedule: {"mon":[{"open":"09:00","close":"19:00"}], ...}
  schedule   jsonb not null default '{}'::jsonb
             check (jsonb_typeof(schedule) = 'object'),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

comment on table public.branches is 'Physical locations of a tenant. Staff, inventory and cash registers are scoped per branch.';

create index branches_tenant_id_idx on public.branches (tenant_id);

create trigger branches_set_updated_at
  before update on public.branches
  for each row execute function public.set_updated_at();

alter table public.branches enable row level security;

create policy "members can view tenant branches"
  on public.branches for select
  to authenticated
  using (public.is_member_of(tenant_id));

create policy "staff can insert branches"
  on public.branches for insert
  to authenticated
  with check (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

create policy "staff can update branches"
  on public.branches for update
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]))
  with check (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

create policy "admins can delete branches"
  on public.branches for delete
  to authenticated
  using (public.has_role(tenant_id, array['admin']::public.member_role[]));

-- ---------- Branch assignment for staff ----------
-- NULL branch_id = tenant-wide (e.g. admin/accountant not tied to one location)
alter table public.memberships
  add column branch_id uuid references public.branches (id) on delete set null;

create index memberships_branch_id_idx on public.memberships (branch_id);

-- ---------- Storage: tenant assets (logo/banner) ----------
insert into storage.buckets (id, name, public)
values ('tenant-assets', 'tenant-assets', true)
on conflict (id) do nothing;

-- Objects live under {tenant_id}/... so policies can scope by folder.
create policy "tenant assets are publicly readable"
  on storage.objects for select
  using (bucket_id = 'tenant-assets');

create policy "staff can upload tenant assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'tenant-assets'
    and public.has_role(
      ((storage.foldername(name))[1])::uuid,
      array['admin','manager']::public.member_role[]
    )
  );

create policy "staff can update tenant assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'tenant-assets'
    and public.has_role(
      ((storage.foldername(name))[1])::uuid,
      array['admin','manager']::public.member_role[]
    )
  );

create policy "staff can delete tenant assets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'tenant-assets'
    and public.has_role(
      ((storage.foldername(name))[1])::uuid,
      array['admin','manager']::public.member_role[]
    )
  );
