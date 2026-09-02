UPDATE public.trips
SET driver_user_id = '7ceabb9e-e38e-43c3-bfc1-9b8b4f756132', updated_at = now()
WHERE departure_date::date = '2026-09-03';

INSERT INTO public.user_roles (user_id, role)
VALUES ('7ceabb9e-e38e-43c3-bfc1-9b8b4f756132', 'driver')
ON CONFLICT (user_id, role) DO NOTHING;