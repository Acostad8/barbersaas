-- =============================================================
-- Phase 10: coupons, loyalty points, client segmentation
-- =============================================================

create type public.discount_type as enum ('percent', 'fixed');

create table public.coupons (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants (id) on delete cascade,
  code           text not null check (code ~ '^[A-Z0-9_-]{3,30}$'),
  description    text,
  discount_type  public.discount_type not null,
  discount_value numeric(12,2) not null check (discount_value > 0),
  min_purchase   numeric(12,2) not null default 0 check (min_purchase >= 0),
  max_uses       integer check (max_uses is null or max_uses > 0),
  used_count     integer not null default 0 check (used_count >= 0),
  valid_from     date,
  valid_until    date,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (tenant_id, code),
  check (discount_type != 'percent' or discount_value <= 100),
  check (valid_until is null or valid_from is null or valid_until >= valid_from)
);

create index coupons_tenant_idx on public.coupons (tenant_id);

create trigger coupons_set_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

create table public.loyalty_settings (
  tenant_id  uuid primary key references public.tenants (id) on delete cascade,
  enabled    boolean not null default false,
  -- points earned per currency unit spent (excluding tip), e.g. 0.001 = 1 pt per 1000
  earn_rate  numeric(10,4) not null default 0 check (earn_rate >= 0),
  updated_at timestamptz not null default now()
);

create table public.loyalty_points (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  client_id  uuid not null references public.clients (id) on delete cascade,
  sale_id    uuid references public.sales (id) on delete set null,
  points     integer not null check (points != 0),
  reason     text,
  created_at timestamptz not null default now()
);

create index loyalty_points_client_idx on public.loyalty_points (client_id);
create index loyalty_points_tenant_idx on public.loyalty_points (tenant_id);

-- sales gain coupon columns
alter table public.sales
  add column coupon_id uuid references public.coupons (id) on delete set null,
  add column coupon_discount numeric(12,2) not null default 0 check (coupon_discount >= 0);

-- ---------- RLS ----------
alter table public.coupons enable row level security;
alter table public.loyalty_settings enable row level security;
alter table public.loyalty_points enable row level security;

create policy "staff can view coupons"
  on public.coupons for select
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager','receptionist']::public.member_role[]));

create policy "managers can manage coupons"
  on public.coupons for all
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]))
  with check (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

create policy "staff can view loyalty settings"
  on public.loyalty_settings for select
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager','receptionist']::public.member_role[]));

create policy "managers can manage loyalty settings"
  on public.loyalty_settings for all
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]))
  with check (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

create policy "staff can view loyalty points"
  on public.loyalty_points for select
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager','receptionist']::public.member_role[]));
-- points are written only by create_sale / manual adjustments RPC

create policy "managers can adjust loyalty points"
  on public.loyalty_points for insert
  to authenticated
  with check (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));

-- ---------- Segmentation RPC ----------
create or replace function public.client_segments(p_tenant_id uuid)
returns table (
  client_id uuid,
  full_name text,
  phone text,
  email text,
  visits_90d bigint,
  total_visits bigint,
  total_spent numeric,
  points integer,
  last_visit timestamptz,
  segment text
)
language sql
stable
security definer
set search_path = ''
as $$
  with visits as (
    select a.client_id,
           count(*) as total_visits,
           count(*) filter (where a.starts_at > now() - interval '90 days') as visits_90d,
           max(a.starts_at) as last_visit
    from public.appointments a
    where a.tenant_id = p_tenant_id and a.status = 'completed'
    group by a.client_id
  ),
  spend as (
    select s.client_id, sum(s.total) as total_spent
    from public.sales s
    where s.tenant_id = p_tenant_id and s.client_id is not null
    group by s.client_id
  ),
  pts as (
    select lp.client_id, coalesce(sum(lp.points), 0)::integer as points
    from public.loyalty_points lp
    where lp.tenant_id = p_tenant_id
    group by lp.client_id
  )
  select c.id,
         c.full_name,
         c.phone,
         c.email,
         coalesce(v.visits_90d, 0),
         coalesce(v.total_visits, 0),
         coalesce(sp.total_spent, 0),
         coalesce(p.points, 0),
         v.last_visit,
         case
           when v.last_visit is null and c.created_at > now() - interval '30 days' then 'nuevo'
           when v.visits_90d >= 4 then 'frecuente'
           when v.last_visit is null or v.last_visit < now() - interval '60 days' then 'inactivo'
           else 'regular'
         end as segment
  from public.clients c
  left join visits v on v.client_id = c.id
  left join spend sp on sp.client_id = c.id
  left join pts p on p.client_id = c.id
  where c.tenant_id = p_tenant_id and c.is_active
    and public.has_role(p_tenant_id, array['admin','manager','receptionist']::public.member_role[])
  order by coalesce(sp.total_spent, 0) desc;
$$;

revoke execute on function public.client_segments(uuid) from public, anon;
grant execute on function public.client_segments(uuid) to authenticated;

-- ---------- create_sale v2: coupon + loyalty ----------
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
  v_coupon public.coupons;
  v_coupon_code text;
  v_coupon_discount numeric(12,2) := 0;
  v_base numeric(12,2);
  v_loyalty public.loyalty_settings;
  v_points integer;
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

  v_base := v_subtotal - v_discount_total + v_tax_total;

  -- coupon: applies over the taxed base, locked row to serialize used_count
  v_coupon_code := upper(nullif(trim(coalesce(p_payload->>'coupon_code', '')), ''));
  if v_coupon_code is not null then
    select * into v_coupon
    from public.coupons c
    where c.tenant_id = p_tenant_id and c.code = v_coupon_code
    for update;

    if v_coupon.id is null then raise exception 'coupon_not_found'; end if;
    if not v_coupon.is_active then raise exception 'coupon_inactive'; end if;
    if v_coupon.valid_from is not null and current_date < v_coupon.valid_from then
      raise exception 'coupon_not_started';
    end if;
    if v_coupon.valid_until is not null and current_date > v_coupon.valid_until then
      raise exception 'coupon_expired';
    end if;
    if v_coupon.max_uses is not null and v_coupon.used_count >= v_coupon.max_uses then
      raise exception 'coupon_exhausted';
    end if;
    if v_base < v_coupon.min_purchase then
      raise exception 'coupon_min_purchase';
    end if;

    v_coupon_discount := case v_coupon.discount_type
      when 'percent' then round(v_base * v_coupon.discount_value / 100, 2)
      else least(v_coupon.discount_value, v_base)
    end;

    update public.coupons set used_count = used_count + 1 where id = v_coupon.id;
  end if;

  v_total := v_base - v_coupon_discount + v_tip;

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
      total = v_total,
      coupon_id = v_coupon.id,
      coupon_discount = v_coupon_discount
  where id = v_sale_id;

  -- loyalty points on the pre-tip amount actually paid
  if v_client_id is not null then
    select * into v_loyalty from public.loyalty_settings
    where tenant_id = p_tenant_id and enabled;
    if v_loyalty.tenant_id is not null and v_loyalty.earn_rate > 0 then
      v_points := floor((v_total - v_tip) * v_loyalty.earn_rate);
      if v_points > 0 then
        insert into public.loyalty_points (tenant_id, client_id, sale_id, points, reason)
        values (p_tenant_id, v_client_id, v_sale_id, v_points, 'Venta #' || v_sale_number);
      end if;
    end if;
  end if;

  if v_appt_id is not null then
    update public.appointments
    set status = 'completed'
    where id = v_appt_id and tenant_id = p_tenant_id
      and status in ('scheduled','confirmed','in_progress');
  end if;

  return jsonb_build_object(
    'sale_id', v_sale_id,
    'sale_number', v_sale_number,
    'total', v_total,
    'coupon_discount', v_coupon_discount
  );
end;
$$;
