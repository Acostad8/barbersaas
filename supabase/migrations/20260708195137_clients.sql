-- =============================================================
-- Phase 3: clients — profile, tags, consents, referrals
-- =============================================================

create extension if not exists pg_trgm with schema extensions;

create table public.clients (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants (id) on delete cascade,
  full_name          text not null check (char_length(full_name) between 2 and 120),
  email              text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone              text,
  birthdate          date check (birthdate is null or birthdate between '1900-01-01' and current_date),
  notes              text,
  tags               text[] not null default '{}',
  preferences        jsonb not null default '{}'::jsonb
                     check (jsonb_typeof(preferences) = 'object'),
  referred_by        uuid references public.clients (id) on delete set null,
  rating             smallint check (rating is null or rating between 1 and 5),
  marketing_consent  boolean not null default false,
  whatsapp_consent   boolean not null default false,
  consent_updated_at timestamptz,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (referred_by is distinct from id)
);

comment on table public.clients is 'End customers of a tenant. Visit history, spend and favorites are derived from appointments/sales in later phases.';

create index clients_tenant_id_idx on public.clients (tenant_id);
create index clients_full_name_trgm_idx on public.clients using gin (full_name extensions.gin_trgm_ops);
create index clients_tags_idx on public.clients using gin (tags);
create unique index clients_tenant_email_key on public.clients (tenant_id, lower(email)) where email is not null;

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- Track consent timestamp automatically when either consent flag changes.
create or replace function public.touch_consent_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.marketing_consent is distinct from old.marketing_consent)
     or (new.whatsapp_consent is distinct from old.whatsapp_consent) then
    new.consent_updated_at := now();
  end if;
  return new;
end;
$$;

revoke execute on function public.touch_consent_updated_at() from public, anon, authenticated;

create trigger clients_touch_consent
  before update on public.clients
  for each row execute function public.touch_consent_updated_at();

-- ---------- RLS ----------
alter table public.clients enable row level security;

create policy "staff can view clients"
  on public.clients for select
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager','receptionist','barber']::public.member_role[]));

create policy "front desk can insert clients"
  on public.clients for insert
  to authenticated
  with check (public.has_role(tenant_id, array['admin','manager','receptionist']::public.member_role[]));

create policy "front desk can update clients"
  on public.clients for update
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager','receptionist']::public.member_role[]))
  with check (public.has_role(tenant_id, array['admin','manager','receptionist']::public.member_role[]));

create policy "managers can delete clients"
  on public.clients for delete
  to authenticated
  using (public.has_role(tenant_id, array['admin','manager']::public.member_role[]));
