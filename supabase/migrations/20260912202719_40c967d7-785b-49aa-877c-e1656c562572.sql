create or replace function public.activate_gift_vouchers(_order_number text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'office')) then
    raise exception 'Nicht erlaubt';
  end if;
  update public.coupons
     set is_active = true,
         valid_from = coalesce(valid_from, now())
   where description = 'Geschenkgutschein - Bestellung ' || _order_number
     and is_active = false;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke execute on function public.activate_gift_vouchers(text) from public, anon;
grant execute on function public.activate_gift_vouchers(text) to authenticated;