-- =============================================================
-- Phase 7: inventory — products, suppliers, kardex, stock levels
-- =============================================================

create table public.suppliers (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  name       text not null check (char_length(name) between 2 and 120),
  phone      text,
  email      text,
  notes      text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create index suppliers_tenant_id_idx on public.suppliers (tenant_id);

create trigger suppliers_set_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

create table public.product_categories (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  name       text not null check (char_length(name) between 2 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create index product_categories_tenant_id_idx on public.product_categories (tenant_id);

create trigger product_categories_set_updated_at
  before update on public.product_categories
  for each row execute function public.set_updated_at();

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id) on delete cascade,
  category_id uuid references public.product_categories (id) on delete set null,
  supplier_id uuid references public.suppliers (id) on delete set null,
  sku         text,
  name        text not null check (char_length(name) between 2 and 120),
  description text,
  brand       text,
  unit        text not null default 'unidad',
  cost        numeric(12,2) not null default 0 check (cost >= 0),
  price       numeric(12,2) not null default 0 check (price >= 0),
  min_stock   numeric(12,2) not null default 0 check (min_stock >= 0),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, name)
);

create unique index products_tenant_sku_key on public.products (tenant_id, lower(sku)) where sku is not null;
create index products_tenant_id_idx on public.products (tenant_id);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------- Kardex (immutable source of truth) ----------
create type public.stock_movement_type as enum (
  'purchase',       -- in
  'transfer_in',    -- in
  'adjustment_in',  -- in
  'sale',           -- out
  'transfer_out',   -- out
  'adjustment_out', -- out
  'loss'            -- out
);

create table public.stock_movements (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants (id) on delete cascade,
  product_id    uuid not null references public.products (id) on delete restrict,
  branch_id     uuid references public.branches (id) on delete restrict,
  movement_type public.stock_movement_type not null,
  quantity      numeric(12,2) not null check (quantity > 0),
  unit_cost     numeric(12,2) check (unit_cost is null or unit_cost >= 0),
  note          text,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

comment on table public.stock_movements is 'Immutable kardex. Stock corrections are made with counter-movements, never by editing rows. branch_id NULL = main/default location.';

create index stock_movements_tenant_created_idx on public.stock_movements (tenant_id, created_at desc);
create index stock_movements_product_idx on public.stock_movements (product_id);

-- ---------- Cached stock levels, maintained by trigger ----------
create table public.stock_levels (
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  branch_id  uuid references public.branches (id) on delete cascade,
  quantity   numeric(12,2) not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now()
);

create unique index stock_levels_key on public.stock_levels (
  product_id,
  coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid)
);
create index stock_levels_tenant_idx on public.stock_levels (tenant_id);

-- SECURITY DEFINER: users have no write access to stock_levels; only
-- this trigger (fired by inserts into stock_movements) mutates it.
create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delta numeric(12,2);
begin
  v_delta := case
    when new.movement_type in ('purchase', 'transfer_in', 'adjustment_in')
      then new.quantity
    else -new.quantity
  end;

  insert into public.stock_levels (tenant_id, product_id, branch_id, quantity, updated_at)
  values (new.tenant_id, new.product_id, new.branch_id, v_delta, now())
  on conflict (product_id, coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do update set
    quantity = public.stock_levels.quantity + v_delta,
    updated_at = now();

  return new;
exception
  when check_violation then
    raise exception 'insufficient_stock';
end;
$$;

revoke execute on function public.apply_stock_movement() from public, anon, authenticated;

create trigger stock_movements_apply
  after insert on public.stock_movements
  for each row execute function public.apply_stock_movement();

-- ---------- RLS ----------
alter table public.suppliers enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;
alter table public.stock_levels enable row level security;

create policy "inventory managers can view suppliers"
  on public.suppliers for select
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

create policy "inventory managers can manage suppliers"
  on public.suppliers for all
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]))
  with check (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

create policy "inventory managers can view product categories"
  on public.product_categories for select
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

create policy "inventory managers can manage product categories"
  on public.product_categories for all
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]))
  with check (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

create policy "inventory managers can view products"
  on public.products for select
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

create policy "inventory managers can manage products"
  on public.products for all
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]))
  with check (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

-- kardex: insert + read only; no update/delete for anyone (corrections
-- are counter-movements)
create policy "inventory managers can view movements"
  on public.stock_movements for select
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

create policy "inventory managers can insert movements"
  on public.stock_movements for insert
  to authenticated
  with check (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

create policy "inventory managers can view stock levels"
  on public.stock_levels for select
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));
-- no insert/update policies on stock_levels: only the trigger writes it
