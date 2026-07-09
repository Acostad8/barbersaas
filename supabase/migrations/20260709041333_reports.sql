-- =============================================================
-- Phase 9: reporting RPC (aggregates computed in the database)
-- =============================================================

create or replace function public.report_dashboard(
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
    'summary', (
      select jsonb_build_object(
        'sales_count', count(*),
        'gross_total', coalesce(sum(s.total), 0),
        'subtotal', coalesce(sum(s.subtotal), 0),
        'discounts', coalesce(sum(s.discount_total), 0),
        'taxes', coalesce(sum(s.tax_total), 0),
        'tips', coalesce(sum(s.tip), 0),
        'avg_ticket', coalesce(round(avg(s.total), 2), 0)
      )
      from public.sales s
      where s.tenant_id = p_tenant_id
        and s.created_at >= v_from and s.created_at < v_to
    ),
    'by_day', coalesce((
      select jsonb_agg(row_to_json(d) order by d.day)
      from (
        select (s.created_at at time zone v_tz)::date as day,
               count(*) as sales_count,
               sum(s.total) as total
        from public.sales s
        where s.tenant_id = p_tenant_id
          and s.created_at >= v_from and s.created_at < v_to
        group by 1
      ) d
    ), '[]'::jsonb),
    'by_method', coalesce((
      select jsonb_agg(row_to_json(m) order by m.amount desc)
      from (
        select sp.method, sum(sp.amount) as amount, count(distinct sp.sale_id) as sales_count
        from public.sale_payments sp
        join public.sales s on s.id = sp.sale_id
        where s.tenant_id = p_tenant_id
          and s.created_at >= v_from and s.created_at < v_to
        group by sp.method
      ) m
    ), '[]'::jsonb),
    'top_services', coalesce((
      select jsonb_agg(row_to_json(x) order by x.revenue desc)
      from (
        select si.description as name,
               sum(si.quantity) as quantity,
               sum(si.line_total) as revenue
        from public.sale_items si
        join public.sales s on s.id = si.sale_id
        where si.tenant_id = p_tenant_id
          and si.service_id is not null
          and s.created_at >= v_from and s.created_at < v_to
        group by si.description
        order by sum(si.line_total) desc
        limit 10
      ) x
    ), '[]'::jsonb),
    'top_products', coalesce((
      select jsonb_agg(row_to_json(x) order by x.revenue desc)
      from (
        select si.description as name,
               sum(si.quantity) as quantity,
               sum(si.line_total) as revenue
        from public.sale_items si
        join public.sales s on s.id = si.sale_id
        where si.tenant_id = p_tenant_id
          and si.product_id is not null
          and s.created_at >= v_from and s.created_at < v_to
        group by si.description
        order by sum(si.line_total) desc
        limit 10
      ) x
    ), '[]'::jsonb),
    'commissions', coalesce((
      select jsonb_agg(row_to_json(c) order by c.commission desc)
      from (
        select coalesce(p.full_name, 'Barbero') as barber,
               count(*) as completed_appointments,
               sum(a.price) as revenue,
               round(sum(
                 a.price * coalesce(bp.commission_rate, sv.commission_rate, 0) / 100
               ), 2) as commission
        from public.appointments a
        join public.memberships m on m.id = a.membership_id
        left join public.profiles p on p.id = m.user_id
        left join public.barber_profiles bp on bp.membership_id = m.id
        join public.services sv on sv.id = a.service_id
        where a.tenant_id = p_tenant_id
          and a.status = 'completed'
          and a.starts_at >= v_from and a.starts_at < v_to
        group by p.full_name
      ) c
    ), '[]'::jsonb),
    'appointments', (
      select jsonb_build_object(
        'total', count(*),
        'completed', count(*) filter (where a.status = 'completed'),
        'cancelled', count(*) filter (where a.status = 'cancelled'),
        'no_show', count(*) filter (where a.status = 'no_show')
      )
      from public.appointments a
      where a.tenant_id = p_tenant_id
        and a.starts_at >= v_from and a.starts_at < v_to
    )
  );
end;
$$;

revoke execute on function public.report_dashboard(uuid, date, date) from public, anon;
grant execute on function public.report_dashboard(uuid, date, date) to authenticated;
