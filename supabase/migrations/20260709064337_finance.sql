-- =============================================================
-- Phase 11: expenses + finance summary
-- =============================================================

create table public.expense_categories (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  name       text not null check (char_length(name) between 2 and 80),
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create index expense_categories_tenant_idx on public.expense_categories (tenant_id);

create table public.expenses (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id) on delete cascade,
  branch_id   uuid references public.branches (id) on delete set null,
  category_id uuid references public.expense_categories (id) on delete set null,
  description text not null check (char_length(description) between 2 and 200),
  amount      numeric(12,2) not null check (amount > 0),
  method      public.payment_method not null default 'cash',
  spent_on    date not null default current_date,
  notes       text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index expenses_tenant_spent_idx on public.expenses (tenant_id, spent_on desc);

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;

create policy "finance staff can view expense categories"
  on public.expense_categories for select
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager','accountant']::public.member_role[]));

create policy "finance staff can manage expense categories"
  on public.expense_categories for all
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager','accountant']::public.member_role[]))
  with check (public.has_role(tenant_id, array['admin','manager','accountant']::public.member_role[]));

create policy "finance staff can view expenses"
  on public.expenses for select
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager','accountant']::public.member_role[]));

create policy "finance staff can manage expenses"
  on public.expenses for all
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager','accountant']::public.member_role[]))
  with check (public.has_role(tenant_id, array['admin','manager','accountant']::public.member_role[]));

-- ---------- Finance summary RPC ----------
create or replace function public.finance_summary(
  p_tenant_id uuid,
  p_from date,
  p_to date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_from timestamptz;
  v_to timestamptz;
  v_tz text;
begin
  if not public.has_role(p_tenant_id, array['admin','manager','accountant']::public.member_role[]) then
    raise exception 'forbidden';
  end if;
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'invalid_range';
  end if;

  select t.timezone into v_tz from public.tenants t where t.id = p_tenant_id;
  v_from := (p_from::text || ' 00:00:00')::timestamp at time zone v_tz;
  v_to := ((p_to + 1)::text || ' 00:00:00')::timestamp at time zone v_tz;

  return jsonb_build_object(
    'income', coalesce((
      select sum(s.total) from public.sales s
      where s.tenant_id = p_tenant_id
        and s.created_at >= v_from and s.created_at < v_to
    ), 0),
    'taxes_collected', coalesce((
      select sum(s.tax_total) from public.sales s
      where s.tenant_id = p_tenant_id
        and s.created_at >= v_from and s.created_at < v_to
    ), 0),
    'tips_collected', coalesce((
      select sum(s.tip) from public.sales s
      where s.tenant_id = p_tenant_id
        and s.created_at >= v_from and s.created_at < v_to
    ), 0),
    'expenses', coalesce((
      select sum(e.amount) from public.expenses e
      where e.tenant_id = p_tenant_id
        and e.spent_on between p_from and p_to
    ), 0),
    'by_day', coalesce((
      select jsonb_agg(row_to_json(d) order by d.day)
      from (
        select day, sum(income) as income, sum(expense) as expense
        from (
          select (s.created_at at time zone v_tz)::date as day,
                 s.total as income, 0::numeric as expense
          from public.sales s
          where s.tenant_id = p_tenant_id
            and s.created_at >= v_from and s.created_at < v_to
          union all
          select e.spent_on, 0, e.amount
          from public.expenses e
          where e.tenant_id = p_tenant_id
            and e.spent_on between p_from and p_to
        ) u
        group by day
      ) d
    ), '[]'::jsonb),
    'expenses_by_category', coalesce((
      select jsonb_agg(row_to_json(c) order by c.amount desc)
      from (
        select coalesce(ec.name, 'Sin categoría') as category,
               sum(e.amount) as amount,
               count(*) as entries
        from public.expenses e
        left join public.expense_categories ec on ec.id = e.category_id
        where e.tenant_id = p_tenant_id
          and e.spent_on between p_from and p_to
        group by ec.name
      ) c
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.finance_summary(uuid, date, date) from public, anon;
grant execute on function public.finance_summary(uuid, date, date) to authenticated;
