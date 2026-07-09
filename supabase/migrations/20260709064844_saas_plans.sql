-- =============================================================
-- Phase 12: SaaS plans and tenant subscriptions
-- =============================================================

create table public.plans (
  id            text primary key,
  name          text not null,
  description   text,
  price_monthly numeric(12,2) not null check (price_monthly >= 0),
  currency      text not null default 'COP' check (currency ~ '^[A-Z]{3}$'),
  max_branches  integer not null check (max_branches > 0),
  max_staff     integer not null check (max_staff > 0),
  features      jsonb not null default '[]'::jsonb,
  is_active     boolean not null default true,
  sort_order    integer not null default 0
);

create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled');

create table public.tenant_subscriptions (
  tenant_id        uuid primary key references public.tenants (id) on delete cascade,
  plan_id          text not null references public.plans (id),
  status           public.subscription_status not null default 'trialing',
  trial_ends_at    timestamptz,
  period_ends_at   timestamptz,
  cancelled_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger tenant_subscriptions_set_updated_at
  before update on public.tenant_subscriptions
  for each row execute function public.set_updated_at();

-- seed plans (idempotent)
insert into public.plans (id, name, description, price_monthly, max_branches, max_staff, features, sort_order) values
  ('free', 'Gratis', 'Para empezar: una sede y lo esencial.', 0, 1, 3,
   '["Agenda y reservas online","Hasta 3 miembros de equipo","1 sede","Clientes y servicios ilimitados"]', 0),
  ('pro', 'Pro', 'Para barberías en crecimiento.', 79900, 3, 15,
   '["Todo lo del plan Gratis","POS y caja con arqueo","Inventario y kardex","Reportes y finanzas","Cupones y puntos","Hasta 15 miembros","Hasta 3 sedes"]', 1),
  ('premium', 'Premium', 'Multi-sede sin límites y soporte prioritario.', 149900, 100, 1000,
   '["Todo lo del plan Pro","Sedes ilimitadas","Equipo ilimitado","Soporte prioritario"]', 2)
on conflict (id) do nothing;

-- every existing tenant starts on free
insert into public.tenant_subscriptions (tenant_id, plan_id, status, trial_ends_at)
select t.id, 'free', 'active', null from public.tenants t
on conflict (tenant_id) do nothing;

-- new tenants get a subscription automatically
create or replace function public.handle_new_tenant_subscription()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.tenant_subscriptions (tenant_id, plan_id, status, trial_ends_at)
  values (new.id, 'free', 'active', null)
  on conflict (tenant_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_tenant_subscription() from public, anon, authenticated;

create trigger on_tenant_created_subscription
  after insert on public.tenants
  for each row execute function public.handle_new_tenant_subscription();

-- ---------- RLS ----------
alter table public.plans enable row level security;
alter table public.tenant_subscriptions enable row level security;

-- plans are public catalog data (landing shows them)
create policy "plans are readable by everyone"
  on public.plans for select
  to anon, authenticated
  using (is_active);

create policy "members can view own subscription"
  on public.tenant_subscriptions for select
  to authenticated
  using (public.is_member_of(tenant_id));

-- plan changes: admin only; no payment gateway yet, so change is direct
create policy "admins can change subscription"
  on public.tenant_subscriptions for update
  to authenticated
  using (public.has_role(tenant_id, array['admin']::public.member_role[]))
  with check (public.has_role(tenant_id, array['admin']::public.member_role[]));
