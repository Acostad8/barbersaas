-- =============================================================
-- Phase 13: in-app notifications
-- External channels (email/SMS/WhatsApp) plug in later via an
-- Edge Function once a provider + credentials exist.
-- =============================================================

create type public.notification_kind as enum (
  'appointment_created',
  'appointment_cancelled',
  'appointment_rescheduled',
  'low_stock',
  'system'
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  -- null user_id = visible to all managers of the tenant
  user_id    uuid references public.profiles (id) on delete cascade,
  kind       public.notification_kind not null default 'system',
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_tenant_created_idx on public.notifications (tenant_id, created_at desc);
create index notifications_user_idx on public.notifications (user_id);

alter table public.notifications enable row level security;

create policy "users can view own or tenant-wide notifications"
  on public.notifications for select
  to authenticated
  using (
    (user_id = (select auth.uid()) and public.is_member_of(tenant_id))
    or (user_id is null and public.has_role(tenant_id, array['admin','manager','receptionist']::public.member_role[]))
  );

create policy "users can mark notifications read"
  on public.notifications for update
  to authenticated
  using (
    (user_id = (select auth.uid()) and public.is_member_of(tenant_id))
    or (user_id is null and public.has_role(tenant_id, array['admin','manager','receptionist']::public.member_role[]))
  )
  with check (
    (user_id = (select auth.uid()) and public.is_member_of(tenant_id))
    or (user_id is null and public.has_role(tenant_id, array['admin','manager','receptionist']::public.member_role[]))
  );

-- inserts happen from triggers (security definer) only

-- ---------- Appointment notifications ----------
create or replace function public.notify_appointment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_client text;
  v_barber_user uuid;
  v_when text;
begin
  select c.full_name into v_client from public.clients c where c.id = new.client_id;
  select m.user_id into v_barber_user from public.memberships m where m.id = new.membership_id;
  v_when := to_char(new.starts_at at time zone (
    select t.timezone from public.tenants t where t.id = new.tenant_id
  ), 'DD/MM HH24:MI');

  if tg_op = 'INSERT' then
    -- barber gets a personal notification; front desk sees the tenant-wide one
    insert into public.notifications (tenant_id, user_id, kind, title, body, link)
    values
      (new.tenant_id, v_barber_user, 'appointment_created',
       'Nueva cita ' || v_when, coalesce(v_client, 'Cliente'), '/dashboard/agenda'),
      (new.tenant_id, null, 'appointment_created',
       'Nueva cita ' || v_when, coalesce(v_client, 'Cliente'), '/dashboard/agenda');
  elsif tg_op = 'UPDATE' and new.status = 'cancelled' and old.status != 'cancelled' then
    insert into public.notifications (tenant_id, user_id, kind, title, body, link)
    values
      (new.tenant_id, v_barber_user, 'appointment_cancelled',
       'Cita cancelada ' || v_when, coalesce(v_client, 'Cliente'), '/dashboard/agenda');
  elsif tg_op = 'UPDATE' and new.starts_at != old.starts_at then
    insert into public.notifications (tenant_id, user_id, kind, title, body, link)
    values
      (new.tenant_id, v_barber_user, 'appointment_rescheduled',
       'Cita reagendada a ' || v_when, coalesce(v_client, 'Cliente'), '/dashboard/agenda');
  end if;

  return new;
end;
$$;

revoke execute on function public.notify_appointment_change() from public, anon, authenticated;

create trigger appointments_notify
  after insert or update on public.appointments
  for each row execute function public.notify_appointment_change();

-- ---------- Mark all read RPC ----------
create or replace function public.mark_notifications_read(p_tenant_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.notifications n
  set read_at = now()
  where n.tenant_id = p_tenant_id
    and n.read_at is null
    and (
      n.user_id = (select auth.uid())
      or (n.user_id is null and public.has_role(p_tenant_id, array['admin','manager','receptionist']::public.member_role[]))
    );
$$;

revoke execute on function public.mark_notifications_read(uuid) from public, anon;
grant execute on function public.mark_notifications_read(uuid) to authenticated;
