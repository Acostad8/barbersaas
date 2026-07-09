-- CHECK constraints run before ON CONFLICT arbitration, so inserting a
-- negative delta blew up before reaching DO UPDATE. Update-first instead.
create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delta numeric(12,2);
begin
  v_delta := case
    when new.movement_type in ('purchase', 'transfer_in', 'adjustment_in')
      then new.quantity
    else -new.quantity
  end;

  update public.stock_levels
  set quantity = quantity + v_delta,
      updated_at = now()
  where product_id = new.product_id
    and coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid)
        = coalesce(new.branch_id, '00000000-0000-0000-0000-000000000000'::uuid);

  if not found then
    if v_delta < 0 then
      raise exception 'insufficient_stock';
    end if;
    begin
      insert into public.stock_levels (tenant_id, product_id, branch_id, quantity, updated_at)
      values (new.tenant_id, new.product_id, new.branch_id, v_delta, now());
    exception
      when unique_violation then
        -- concurrent first movement created the row; apply as update
        update public.stock_levels
        set quantity = quantity + v_delta,
            updated_at = now()
        where product_id = new.product_id
          and coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid)
              = coalesce(new.branch_id, '00000000-0000-0000-0000-000000000000'::uuid);
    end;
  end if;

  return new;
exception
  when check_violation then
    raise exception 'insufficient_stock';
end;
$$;

revoke execute on function public.apply_stock_movement() from public, anon, authenticated;
