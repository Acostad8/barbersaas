-- =============================================================
-- Phase 6: public online booking (anon-facing RPCs)
-- =============================================================

-- ---------- Public booking info by slug ----------
-- SECURITY DEFINER because anon has no table access. Returns only
-- data meant to be public on the booking portal.
create or replace function public.get_booking_info(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'tenant', (
      select jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'slug', t.slug,
        'description', t.description,
        'logo_url', t.logo_url,
        'banner_url', t.banner_url,
        'timezone', t.timezone,
        'currency', t.currency,
        'phone', t.phone,
        'socials', t.socials
      )
      from public.tenants t
      where t.slug = p_slug
    ),
    'services', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'duration_minutes', s.duration_minutes,
        'price', s.price,
        'category', sc.name
      ) order by sc.sort_order nulls last, s.name)
      from public.services s
      left join public.service_categories sc on sc.id = s.category_id
      join public.tenants t on t.id = s.tenant_id
      where t.slug = p_slug and s.is_active
    ), '[]'::jsonb),
    'barbers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'membership_id', m.id,
        'name', coalesce(p.full_name, 'Barbero'),
        'specialties', coalesce(bp.specialties, '{}'::text[]),
        'bio', bp.bio
      ) order by p.full_name)
      from public.memberships m
      join public.tenants t on t.id = m.tenant_id
      left join public.profiles p on p.id = m.user_id
      left join public.barber_profiles bp on bp.membership_id = m.id
      where t.slug = p_slug and m.role = 'barber' and m.is_active
    ), '[]'::jsonb)
  );
$$;

revoke execute on function public.get_booking_info(text) from public;
grant execute on function public.get_booking_info(text) to anon, authenticated;

-- ---------- Availability ----------
create or replace function public.available_slots(
  p_tenant_id uuid,
  p_service_id uuid,
  p_membership_id uuid,
  p_date date
)
returns table (slot_start timestamptz, slot_end timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_duration int;
  v_tz text;
  v_day_key text;
  v_schedule jsonb;
  v_range jsonb;
  v_open time;
  v_close time;
  v_start timestamptz;
  v_end timestamptz;
  v_slot timestamptz;
  v_slot_end timestamptz;
begin
  select s.duration_minutes into v_duration
  from public.services s
  where s.id = p_service_id and s.tenant_id = p_tenant_id and s.is_active;
  if v_duration is null then return; end if;

  select t.timezone into v_tz from public.tenants t where t.id = p_tenant_id;
  if v_tz is null then return; end if;

  if not exists (
    select 1 from public.memberships m
    where m.id = p_membership_id and m.tenant_id = p_tenant_id
      and m.role = 'barber' and m.is_active
  ) then return; end if;

  -- approved time off covering the date: closed
  if exists (
    select 1 from public.time_off toff
    where toff.membership_id = p_membership_id
      and toff.status = 'approved'
      and p_date between toff.starts_on and toff.ends_on
  ) then return; end if;

  v_day_key := (array['sun','mon','tue','wed','thu','fri','sat'])[extract(dow from p_date)::int + 1];

  select bp.schedule into v_schedule
  from public.barber_profiles bp
  where bp.membership_id = p_membership_id;

  if v_schedule is null or v_schedule = '{}'::jsonb then
    -- no personal schedule configured: default mon-sat 09:00-19:00
    if v_day_key = 'sun' then return; end if;
    v_schedule := jsonb_build_object(
      v_day_key,
      jsonb_build_array(jsonb_build_object('open', '09:00', 'close', '19:00'))
    );
  elsif not (v_schedule ? v_day_key) then
    return; -- has a schedule but this day is closed
  end if;

  for v_range in select * from jsonb_array_elements(v_schedule -> v_day_key)
  loop
    v_open := (v_range->>'open')::time;
    v_close := (v_range->>'close')::time;
    v_start := ((p_date::text || ' ' || v_open::text)::timestamp) at time zone v_tz;
    v_end := ((p_date::text || ' ' || v_close::text)::timestamp) at time zone v_tz;

    v_slot := v_start;
    while v_slot + make_interval(mins => v_duration) <= v_end loop
      v_slot_end := v_slot + make_interval(mins => v_duration);
      if v_slot > now()
        and not exists (
          select 1 from public.appointments a
          where a.membership_id = p_membership_id
            and a.status not in ('cancelled', 'no_show')
            and tstzrange(a.starts_at, a.ends_at) && tstzrange(v_slot, v_slot_end)
        )
        and not exists (
          select 1 from public.schedule_blocks sb
          where sb.tenant_id = p_tenant_id
            and (sb.membership_id = p_membership_id or sb.membership_id is null)
            and tstzrange(sb.starts_at, sb.ends_at) && tstzrange(v_slot, v_slot_end)
        )
      then
        slot_start := v_slot;
        slot_end := v_slot_end;
        return next;
      end if;
      v_slot := v_slot + interval '15 minutes';
    end loop;
  end loop;
end;
$$;

revoke execute on function public.available_slots(uuid, uuid, uuid, date) from public;
grant execute on function public.available_slots(uuid, uuid, uuid, date) to anon, authenticated;

-- ---------- Public booking ----------
create or replace function public.book_appointment(
  p_slug text,
  p_service_id uuid,
  p_membership_id uuid,
  p_starts_at timestamptz,
  p_client_name text,
  p_client_email text,
  p_client_phone text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant public.tenants;
  v_duration int;
  v_price numeric(12,2);
  v_client_id uuid;
  v_appt_id uuid;
  v_email text := nullif(lower(trim(coalesce(p_client_email, ''))), '');
  v_phone text := nullif(trim(coalesce(p_client_phone, '')), '');
  v_name text := trim(coalesce(p_client_name, ''));
begin
  if char_length(v_name) not between 2 and 120 then
    raise exception 'invalid_name';
  end if;
  if v_email is null and v_phone is null then
    raise exception 'contact_required';
  end if;
  if v_email is not null and v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email';
  end if;
  if v_phone is not null and char_length(v_phone) > 30 then
    raise exception 'invalid_phone';
  end if;

  select * into v_tenant from public.tenants t where t.slug = p_slug;
  if v_tenant.id is null then
    raise exception 'tenant_not_found';
  end if;

  select s.duration_minutes, s.price into v_duration, v_price
  from public.services s
  where s.id = p_service_id and s.tenant_id = v_tenant.id and s.is_active;
  if v_duration is null then
    raise exception 'service_not_found';
  end if;

  -- the requested start must be an actually available slot; this also
  -- enforces working hours, blocks and approved time off
  if not exists (
    select 1
    from public.available_slots(v_tenant.id, p_service_id, p_membership_id, (p_starts_at at time zone v_tenant.timezone)::date) s
    where s.slot_start = p_starts_at
  ) then
    raise exception 'slot_unavailable';
  end if;

  -- reuse existing client by email, then phone; otherwise create
  if v_email is not null then
    select c.id into v_client_id
    from public.clients c
    where c.tenant_id = v_tenant.id and lower(c.email) = v_email;
  end if;
  if v_client_id is null and v_phone is not null then
    select c.id into v_client_id
    from public.clients c
    where c.tenant_id = v_tenant.id and c.phone = v_phone
    limit 1;
  end if;
  if v_client_id is null then
    insert into public.clients (tenant_id, full_name, email, phone)
    values (v_tenant.id, v_name, v_email, v_phone)
    returning id into v_client_id;
  end if;

  insert into public.appointments (
    tenant_id, client_id, membership_id, service_id,
    starts_at, ends_at, price, status
  )
  values (
    v_tenant.id, v_client_id, p_membership_id, p_service_id,
    p_starts_at, p_starts_at + make_interval(mins => v_duration), v_price, 'scheduled'
  )
  returning id into v_appt_id;

  return v_appt_id;
exception
  when exclusion_violation then
    raise exception 'slot_taken';
end;
$$;

revoke execute on function public.book_appointment(text, uuid, uuid, timestamptz, text, text, text) from public;
grant execute on function public.book_appointment(text, uuid, uuid, timestamptz, text, text, text) to anon, authenticated;
