-- =============================================================
-- Phase 8: POS — cash sessions, sales, items, payments
-- =============================================================

create type public.payment_method as enum ('cash', 'card', 'transfer', 'other');

-- ---------- Cash sessions (apertura/cierre de caja) ----------
create table public.cash_sessions (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants (id) on delete cascade,
  branch_id       uuid references public.branches (id) on delete set null,
  opened_by       uuid not null references public.profiles (id) on delete restrict,
  opening_amount  numeric(12,2) not null check (opening_amount >= 0),
  opened_at       timestamptz not null default now(),
  closed_by       uuid references public.profiles (id) on delete set null,
  closing_amount  numeric(12,2) check (closing_amount is null or closing_amount >= 0),
  expected_amount numeric(12,2),
  closing_notes   text,
  closed_at       timestamptz,
  check (closed_at is null or closed_at >= opened_at)
);

create index cash_sessions_tenant_idx on public.cash_sessions (tenant_id, opened_at desc);

-- one open session per tenant+branch at a time
create unique index cash_sessions_one_open_key on public.cash_sessions (
  tenant_id,
  coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid)
) where closed_at is null;

-- ---------- Per-tenant sale numbering ----------
create table public.tenant_counters (
  tenant_id   uuid primary key references public.tenants (id) on delete cascade,
  sale_number bigint not null default 0
);

-- ---------- Sales ----------
create table public.sales (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants (id) on delete cascade,
  branch_id      uuid references public.branches (id) on delete set null,
  session_id     uuid not null references public.cash_sessions (id) on delete restrict,
  client_id      uuid references public.clients (id) on delete set null,
  appointment_id uuid references public.appointments (id) on delete set null,
  sale_number    bigint not null,
  subtotal       numeric(12,2) not null check (subtotal >= 0),
  discount_total numeric(12,2) not null default 0 check (discount_total >= 0),
  tax_total      numeric(12,2) not null default 0 check (tax_total >= 0),
  tip            numeric(12,2) not null default 0 check (tip >= 0),
  total          numeric(12,2) not null check (total >= 0),
  notes          text,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  unique (tenant_id, sale_number)
);

comment on table public.sales is 'Totals are computed server-side inside create_sale() from catalog prices; the client only sends ids, quantities and discounts.';

create index sales_tenant_created_idx on public.sales (tenant_id, created_at desc);
create index sales_session_idx on public.sales (session_id);
create index sales_client_idx on public.sales (client_id);

create table public.sale_items (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id) on delete cascade,
  sale_id     uuid not null references public.sales (id) on delete cascade,
  service_id  uuid references public.services (id) on delete set null,
  product_id  uuid references public.products (id) on delete set null,
  description text not null,
  quantity    numeric(12,2) not null check (quantity > 0),
  unit_price  numeric(12,2) not null check (unit_price >= 0),
  discount    numeric(12,2) not null default 0 check (discount >= 0),
  tax_rate    numeric(5,2) not null default 0 check (tax_rate between 0 and 100),
  line_total  numeric(12,2) not null check (line_total >= 0),
  check (num_nonnulls(service_id, product_id) = 1)
);

create index sale_items_sale_idx on public.sale_items (sale_id);
create index sale_items_tenant_idx on public.sale_items (tenant_id);

create table public.sale_payments (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  sale_id   uuid not null references public.sales (id) on delete cascade,
  method    public.payment_method not null,
  amount    numeric(12,2) not null check (amount > 0)
);

create index sale_payments_sale_idx on public.sale_payments (sale_id);
create index sale_payments_tenant_idx on public.sale_payments (tenant_id);

-- ---------- RLS ----------
alter table public.cash_sessions enable row level security;
alter table public.tenant_counters enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.sale_payments enable row level security;

create policy "pos staff can view cash sessions"
  on public.cash_sessions for select
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager','receptionist','accountant']::public.member_role[]));

create policy "pos staff can view sales"
  on public.sales for select
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager','receptionist','accountant']::public.member_role[]));

create policy "pos staff can view sale items"
  on public.sale_items for select
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager','receptionist','accountant']::public.member_role[]));

create policy "pos staff can view sale payments"
  on public.sale_payments for select
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager','receptionist','accountant']::public.member_role[]));

-- no direct INSERT/UPDATE/DELETE policies: sales flow only through the
-- SECURITY DEFINER RPCs below; tenant_counters has no user access at all.

-- ---------- RPCs ----------
create or replace function public.open_cash_session(
  p_tenant_id uuid,
  p_branch_id uuid,
  p_opening_amount numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.has_role(p_tenant_id, array['admin','manager','receptionist']::public.member_role[]) then
    raise exception 'forbidden';
  end if;
  if p_opening_amount is null or p_opening_amount < 0 then
    raise exception 'invalid_amount';
  end if;

  insert into public.cash_sessions (tenant_id, branch_id, opened_by, opening_amount)
  values (p_tenant_id, p_branch_id, (select auth.uid()), p_opening_amount)
  returning id into v_id;

  return v_id;
exception
  when unique_violation then
    raise exception 'session_already_open';
end;
$$;

create or replace function public.close_cash_session(
  p_session_id uuid,
  p_closing_amount numeric,
  p_notes text default null
)
returns public.cash_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.cash_sessions;
  v_cash_sales numeric(12,2);
begin
  select * into v_session from public.cash_sessions where id = p_session_id;
  if v_session.id is null then
    raise exception 'session_not_found';
  end if;
  if not public.has_role(v_session.tenant_id, array['admin','manager','receptionist']::public.member_role[]) then
    raise exception 'forbidden';
  end if;
  if v_session.closed_at is not null then
    raise exception 'session_already_closed';
  end if;
  if p_closing_amount is null or p_closing_amount < 0 then
    raise exception 'invalid_amount';
  end if;

  select coalesce(sum(sp.amount), 0) into v_cash_sales
  from public.sale_payments sp
  join public.sales s on s.id = sp.sale_id
  where s.session_id = p_session_id and sp.method = 'cash';

  update public.cash_sessions
  set closed_at = now(),
      closed_by = (select auth.uid()),
      closing_amount = p_closing_amount,
      expected_amount = opening_amount + v_cash_sales,
      closing_notes = p_notes
  where id = p_session_id
  returning * into v_session;

  return v_session;
end;
$$;

-- payload:
-- {
--   "items": [{"type":"service"|"product","id":uuid,"quantity":n,"discount":n}],
--   "payments": [{"method":"cash","amount":n}],
--   "tip": n, "client_id": uuid|null, "appointment_id": uuid|null, "notes": text|null
-- }
create or replace function public.create_sale(
  p_tenant_id uuid,
  p_session_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.cash_sessions;
  v_item jsonb;
  v_payment jsonb;
  v_sale_id uuid;
  v_sale_number bigint;
  v_subtotal numeric(12,2) := 0;
  v_discount_total numeric(12,2) := 0;
  v_tax_total numeric(12,2) := 0;
  v_tip numeric(12,2);
  v_total numeric(12,2);
  v_payments_sum numeric(12,2) := 0;
  v_qty numeric(12,2);
  v_disc numeric(12,2);
  v_price numeric(12,2);
  v_tax numeric(5,2);
  v_name text;
  v_line numeric(12,2);
  v_svc record;
  v_prod record;
  v_client_id uuid;
  v_appt_id uuid;
begin
  if not public.has_role(p_tenant_id, array['admin','manager','receptionist']::public.member_role[]) then
    raise exception 'forbidden';
  end if;

  select * into v_session from public.cash_sessions
  where id = p_session_id and tenant_id = p_tenant_id;
  if v_session.id is null or v_session.closed_at is not null then
    raise exception 'session_not_open';
  end if;

  if jsonb_array_length(coalesce(p_payload->'items', '[]'::jsonb)) = 0 then
    raise exception 'empty_sale';
  end if;

  v_tip := coalesce((p_payload->>'tip')::numeric, 0);
  if v_tip < 0 then raise exception 'invalid_tip'; end if;

  v_client_id := nullif(p_payload->>'client_id', '')::uuid;
  v_appt_id := nullif(p_payload->>'appointment_id', '')::uuid;

  if v_client_id is not null and not exists (
    select 1 from public.clients c where c.id = v_client_id and c.tenant_id = p_tenant_id
  ) then
    raise exception 'client_not_found';
  end if;

  -- sale number with per-tenant counter (row lock serializes)
  insert into public.tenant_counters (tenant_id, sale_number)
  values (p_tenant_id, 1)
  on conflict (tenant_id)
  do update set sale_number = public.tenant_counters.sale_number + 1
  returning sale_number into v_sale_number;

  insert into public.sales (
    tenant_id, branch_id, session_id, client_id, appointment_id,
    sale_number, subtotal, discount_total, tax_total, tip, total,
    notes, created_by
  )
  values (
    p_tenant_id, v_session.branch_id, p_session_id, v_client_id, v_appt_id,
    v_sale_number, 0, 0, 0, v_tip, 0,
    nullif(trim(coalesce(p_payload->>'notes', '')), ''), (select auth.uid())
  )
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_payload->'items')
  loop
    v_qty := coalesce((v_item->>'quantity')::numeric, 0);
    v_disc := coalesce((v_item->>'discount')::numeric, 0);
    if v_qty <= 0 or v_disc < 0 then
      raise exception 'invalid_item';
    end if;

    if v_item->>'type' = 'service' then
      select s.name, s.price, s.tax_rate into v_svc
      from public.services s
      where s.id = (v_item->>'id')::uuid and s.tenant_id = p_tenant_id and s.is_active;
      if v_svc.name is null then raise exception 'service_not_found'; end if;
      v_name := v_svc.name; v_price := v_svc.price; v_tax := v_svc.tax_rate;
    elsif v_item->>'type' = 'product' then
      select p.name, p.price, 0::numeric(5,2) as tax_rate into v_prod
      from public.products p
      where p.id = (v_item->>'id')::uuid and p.tenant_id = p_tenant_id and p.is_active;
      if v_prod.name is null then raise exception 'product_not_found'; end if;
      v_name := v_prod.name; v_price := v_prod.price; v_tax := 0;
    else
      raise exception 'invalid_item_type';
    end if;

    if v_disc > v_price * v_qty then
      raise exception 'discount_exceeds_line';
    end if;

    v_line := round((v_price * v_qty - v_disc) * (1 + v_tax / 100), 2);
    v_subtotal := v_subtotal + v_price * v_qty;
    v_discount_total := v_discount_total + v_disc;
    v_tax_total := v_tax_total + round((v_price * v_qty - v_disc) * (v_tax / 100), 2);

    insert into public.sale_items (
      tenant_id, sale_id, service_id, product_id, description,
      quantity, unit_price, discount, tax_rate, line_total
    )
    values (
      p_tenant_id, v_sale_id,
      case when v_item->>'type' = 'service' then (v_item->>'id')::uuid end,
      case when v_item->>'type' = 'product' then (v_item->>'id')::uuid end,
      v_name, v_qty, v_price, v_disc, v_tax, v_line
    );

    -- products deduct stock (kardex); insufficient stock aborts everything
    if v_item->>'type' = 'product' then
      insert into public.stock_movements (
        tenant_id, product_id, branch_id, movement_type, quantity, note, created_by
      )
      values (
        p_tenant_id, (v_item->>'id')::uuid, v_session.branch_id, 'sale',
        v_qty, 'Venta #' || v_sale_number, (select auth.uid())
      );
    end if;
  end loop;

  v_total := v_subtotal - v_discount_total + v_tax_total + v_tip;

  for v_payment in select * from jsonb_array_elements(coalesce(p_payload->'payments', '[]'::jsonb))
  loop
    if coalesce((v_payment->>'amount')::numeric, 0) <= 0 then
      raise exception 'invalid_payment';
    end if;
    insert into public.sale_payments (tenant_id, sale_id, method, amount)
    values (
      p_tenant_id, v_sale_id,
      (v_payment->>'method')::public.payment_method,
      (v_payment->>'amount')::numeric
    );
    v_payments_sum := v_payments_sum + (v_payment->>'amount')::numeric;
  end loop;

  if v_payments_sum != v_total then
    raise exception 'payments_mismatch: total % vs paid %', v_total, v_payments_sum;
  end if;

  update public.sales
  set subtotal = v_subtotal,
      discount_total = v_discount_total,
      tax_total = v_tax_total,
      total = v_total
  where id = v_sale_id;

  if v_appt_id is not null then
    update public.appointments
    set status = 'completed'
    where id = v_appt_id and tenant_id = p_tenant_id
      and status in ('scheduled','confirmed','in_progress');
  end if;

  return jsonb_build_object('sale_id', v_sale_id, 'sale_number', v_sale_number, 'total', v_total);
end;
$$;

revoke execute on function public.open_cash_session(uuid, uuid, numeric) from public, anon;
revoke execute on function public.close_cash_session(uuid, numeric, text) from public, anon;
revoke execute on function public.create_sale(uuid, uuid, jsonb) from public, anon;
grant execute on function public.open_cash_session(uuid, uuid, numeric) to authenticated;
grant execute on function public.close_cash_session(uuid, numeric, text) to authenticated;
grant execute on function public.create_sale(uuid, uuid, jsonb) to authenticated;
