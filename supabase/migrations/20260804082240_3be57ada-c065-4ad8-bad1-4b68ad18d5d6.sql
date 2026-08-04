UPDATE public.package_tours
SET publish_status = 'draft', updated_at = now()
WHERE coalesce(publish_status,'draft') = 'published';

UPDATE public.tour_legal_documents
SET content = replace(replace(content, '[Telefonnummer]', '+49 511 80781106'), '&#91;Telefonnummer&#93;', '+49 511 80781106')
WHERE content LIKE '%Telefonnummer%';