-- =============================================================
-- Phase 14: executive analytics (KPIs vs previous period + heatmap)
-- =============================================================

create or replace function public.analytics_overview(
  p_tenant_id uuid,
  p_days integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz text;
  v_now timestamptz := now();
  v_cur_from timestamptz;
  v_prev_from timestamptz;
begin
  if not public.has_role(p_tenant_id, array['admin','manager','accountant']::public.member_role[]) then
    raise exception 'forbidden';
  end if;
  if p_days is null or p_days < 1 or p_days > 365 then
    raise exception 'invalid_range';
  end if;

  select t.timezone into v_tz from public.tenants t where t.id = p_tenant_id;
  v_cur_from := v_now - make_interval(days => p_days);
  v_prev_from := v_now - make_interval(days => p_days * 2);

  return jsonb_build_object(
    'days', p_days,
    'current', (
      select jsonb_build_object(
        'revenue', coalesce(sum(s.total), 0),
        'sales_count', count(*)
      )
      from public.sales s
      where s.tenant_id = p_tenant_id and s.created_at >= v_cur_from
    ),
    'previous', (
      select jsonb_build_object(
        'revenue', coalesce(sum(s.total), 0),
        'sales_count', count(*)
      )
      from public.sales s
      where s.tenant_id = p_tenant_id
        and s.created_at >= v_prev_from and s.created_at < v_cur_from
    ),
    'appointments_current', (
      select jsonb_build_object(
        'total', count(*),
        'completed', count(*) filter (where a.status = 'completed'),
        'no_show', count(*) filter (where a.status = 'no_show')
      )
      from public.appointments a
      where a.tenant_id = p_tenant_id and a.starts_at >= v_cur_from
    ),
    'new_clients_current', (
      select count(*) from public.clients c
      where c.tenant_id = p_tenant_id and c.created_at >= v_cur_from
    ),
    'new_clients_previous', (
      select count(*) from public.clients c
      where c.tenant_id = p_tenant_id
        and c.created_at >= v_prev_from and c.created_at < v_cur_from
    ),
    -- busiest hours: completed/live appointments by weekday x hour (tenant tz)
    'heatmap', coalesce((
      select jsonb_agg(row_to_json(h))
      from (
        select extract(isodow from a.starts_at at time zone v_tz)::int as dow,
               extract(hour from a.starts_at at time zone v_tz)::int as hour,
               count(*) as appointments
        from public.appointments a
        where a.tenant_id = p_tenant_id
          and a.status not in ('cancelled')
          and a.starts_at >= v_now - interval '90 days'
        group by 1, 2
      ) h
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.analytics_overview(uuid, integer) from public, anon;
grant execute on function public.analytics_overview(uuid, integer) to authenticated;
