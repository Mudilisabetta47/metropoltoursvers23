
-- Allow nullable dates for weekend-type tours (recurring, no fixed date)
ALTER TABLE public.package_tours ALTER COLUMN departure_date DROP NOT NULL;
ALTER TABLE public.package_tours ALTER COLUMN return_date DROP NOT NULL;

-- Migrate existing weekend trips into package_tours
INSERT INTO public.package_tours (
  id, destination, location, country, duration_days, price_from,
  image_url, hero_image_url, gallery_images, short_description, description,
  highlights, included_services, slug, meta_title, meta_description,
  category, tags, is_active, is_featured, created_at, updated_at
)
SELECT
  wt.id,
  wt.destination,
  COALESCE(wt.departure_city, 'Hamburg') AS location,
  COALESCE(wt.country, 'Europa') AS country,
  3 AS duration_days,
  wt.base_price AS price_from,
  wt.image_url,
  wt.hero_image_url,
  COALESCE(wt.gallery_images, ARRAY[]::text[]),
  wt.short_description,
  wt.full_description AS description,
  COALESCE(wt.highlights, ARRAY[]::text[]),
  COALESCE(wt.inclusions, ARRAY[]::text[]) AS included_services,
  LOWER(wt.slug) AS slug,
  wt.meta_title,
  wt.meta_description,
  'weekend' AS category,
  COALESCE(wt.tags, ARRAY[]::text[]),
  COALESCE(wt.is_active, true),
  COALESCE(wt.is_featured, false),
  COALESCE(wt.created_at, now()),
  COALESCE(wt.updated_at, now())
FROM public.weekend_trips wt
WHERE NOT EXISTS (
  SELECT 1 FROM public.package_tours pt WHERE pt.id = wt.id OR pt.slug = LOWER(wt.slug)
);
