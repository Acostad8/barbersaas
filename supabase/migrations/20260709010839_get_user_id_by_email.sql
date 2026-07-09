-- Lookup for inviting existing users to a tenant by email.
-- Only the service_role may call it (server-side, after verifying the
-- caller manages the tenant); exposing it to authenticated would allow
-- email enumeration.
create or replace function public.get_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id
  from auth.users u
  where lower(u.email) = lower(p_email)
  limit 1;
$$;

revoke execute on function public.get_user_id_by_email(text) from public, anon, authenticated;
