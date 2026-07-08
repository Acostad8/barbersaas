-- =============================================================
-- Security hardening + policy consolidation (from get_advisors)
-- =============================================================

-- Fix mutable search_path (lint 0011)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Functions get EXECUTE for PUBLIC by default; revoking only from anon
-- is not enough because anon inherits the PUBLIC grant (lints 0028/0029).
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_member_of(uuid) from public, anon;
revoke execute on function public.has_role(uuid, public.member_role[]) from public, anon;
revoke execute on function public.shares_tenant_with(uuid) from public, anon;
revoke execute on function public.create_tenant(text, text) from public, anon;

-- RLS policies evaluate these as the querying role: authenticated keeps EXECUTE.
grant execute on function public.is_member_of(uuid) to authenticated;
grant execute on function public.has_role(uuid, public.member_role[]) to authenticated;
grant execute on function public.shares_tenant_with(uuid) to authenticated;
grant execute on function public.create_tenant(text, text) to authenticated;

-- Future functions: no implicit PUBLIC execute.
alter default privileges in schema public revoke execute on functions from public;

-- Consolidate duplicate permissive SELECT policies (lint 0006)
drop policy "users can view their own profile" on public.profiles;
drop policy "users can view co-member profiles" on public.profiles;

create policy "users can view own or co-member profiles"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or public.shares_tenant_with(id)
  );

drop policy "users can view their own memberships" on public.memberships;
drop policy "staff can view tenant memberships" on public.memberships;

create policy "users can view own or managed memberships"
  on public.memberships for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_role(tenant_id, array['admin','manager']::public.member_role[])
  );
