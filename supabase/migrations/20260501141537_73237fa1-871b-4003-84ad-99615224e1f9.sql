
DROP VIEW IF EXISTS public.customer_360;
CREATE VIEW public.customer_360 WITH (security_invoker = on) AS
SELECT
  p.user_id,
  p.email,
  p.first_name,
  p.last_name,
  p.phone,
  p.created_at AS member_since,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status::text IN ('confirmed','completed')) AS total_bookings,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status::text = 'cancelled') AS cancelled_bookings,
  COALESCE(SUM(b.price_paid) FILTER (WHERE b.status::text IN ('confirmed','completed')), 0) AS lifetime_value,
  MAX(b.created_at) AS last_booking_at,
  COUNT(DISTINCT cr.id) AS review_count,
  AVG(cr.stars) AS avg_review_stars
FROM public.profiles p
LEFT JOIN public.bookings b ON b.user_id = p.user_id
LEFT JOIN public.customer_reviews cr ON cr.user_id = p.user_id
GROUP BY p.user_id, p.email, p.first_name, p.last_name, p.phone, p.created_at;

GRANT SELECT ON public.customer_360 TO authenticated;
