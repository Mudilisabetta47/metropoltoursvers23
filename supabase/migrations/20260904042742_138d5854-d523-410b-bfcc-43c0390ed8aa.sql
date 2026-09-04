create or replace function public.get_trip_manifest(p_trip_id uuid)
returns table(stop_id uuid, stop_name text, stop_city text, sort_order integer, booking_id uuid, booking_number text, ticket_number text, passenger_first_name text, passenger_last_name text, passenger_phone text, seat_number text, booking_status text, boarded boolean)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id as stop_id,
    s.name as stop_name,
    s.city as stop_city,
    coalesce(ss.sort_order, 999) as sort_order,
    b.id as booking_id,
    b.booking_number,
    b.ticket_number,
    b.passenger_first_name,
    b.passenger_last_name,
    b.passenger_phone,
    se.seat_number,
    b.status::text as booking_status,
    (
      exists (
        select 1 from public.scan_logs sl
        where sl.result in ('valid','checked_in')
          and (
            sl.booking_id = b.id
            or sl.qr_payload = b.ticket_number
            or sl.qr_payload = b.booking_number
          )
      )
      or exists (
        select 1 from public.scanner_events ev
        where ev.result = 'valid'
          and (
            ev.booking_id = b.id
            or ev.ticket_number = b.ticket_number
            or ev.ticket_number = b.booking_number
          )
      )
    ) as boarded
  from public.bookings b
  join public.stops s on s.id = b.origin_stop_id
  left join public.trip_schedule_stops ss
    on ss.trip_id = b.trip_id and ss.stop_id = b.origin_stop_id
  left join public.seats se on se.id = b.seat_id
  where b.trip_id = p_trip_id
    and b.status <> 'cancelled'
    and (
      exists (
        select 1 from public.trips t
        where t.id = p_trip_id and t.driver_user_id = auth.uid()
      )
      or exists (
        select 1 from public.employee_shifts es
        where es.assigned_trip_id = p_trip_id and es.user_id = auth.uid()
      )
      or public.has_role(auth.uid(), 'admin')
      or public.has_role(auth.uid(), 'office')
    )
  order by coalesce(ss.sort_order, 999), b.passenger_last_name, b.passenger_first_name
$$;