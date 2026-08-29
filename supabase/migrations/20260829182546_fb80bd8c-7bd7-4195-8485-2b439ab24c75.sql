create or replace function public.prevent_booking_payment_tamper()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    NEW.price_paid is distinct from OLD.price_paid
    or NEW.payment_status is distinct from OLD.payment_status
    or NEW.payment_reference is distinct from OLD.payment_reference
    or NEW.paid_at is distinct from OLD.paid_at
    or NEW.stripe_session_id is distinct from OLD.stripe_session_id
    or NEW.paypal_order_id is distinct from OLD.paypal_order_id
    or NEW.paypal_capture_id is distinct from OLD.paypal_capture_id
  ) and not (
    session_user in ('service_role', 'postgres')
    or public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'office')
  ) then
    raise exception 'Zahlungsdaten dürfen nur von autorisiertem Personal geändert werden.';
  end if;
  return NEW;
end;
$$;

grant execute on function public.prevent_booking_payment_tamper() to authenticated;
grant execute on function public.prevent_booking_payment_tamper() to service_role;

drop trigger if exists booking_payment_tamper_guard on public.bookings;
create trigger booking_payment_tamper_guard
before update on public.bookings
for each row
execute function public.prevent_booking_payment_tamper();