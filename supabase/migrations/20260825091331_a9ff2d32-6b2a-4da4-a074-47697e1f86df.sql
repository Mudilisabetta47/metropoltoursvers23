CREATE TABLE public.cms_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  url text NOT NULL,
  storage_path text,
  title text,
  alt_text text,
  category text NOT NULL DEFAULT 'allgemein',
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_media TO authenticated;
GRANT ALL ON public.cms_media TO service_role;
ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cms_media_public_read" ON public.cms_media FOR SELECT USING (true);
CREATE POLICY "cms_media_staff_write" ON public.cms_media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE TRIGGER cms_media_updated_at BEFORE UPDATE ON public.cms_media
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.cms_faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'allgemein',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_faq TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_faq TO authenticated;
GRANT ALL ON public.cms_faq TO service_role;
ALTER TABLE public.cms_faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cms_faq_public_read" ON public.cms_faq FOR SELECT USING (is_active = true);
CREATE POLICY "cms_faq_staff_write" ON public.cms_faq FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE TRIGGER cms_faq_updated_at BEFORE UPDATE ON public.cms_faq
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.cms_content (section_key, title, subtitle, content, metadata, is_active)
VALUES
 ('app_hero', 'Deine nächste Reise beginnt hier.', 'Handverlesene Busreisen durch Europa – komfortabel, sicher und persönlich begleitet.', 'Reisen entdecken',
  jsonb_build_object('image_url','', 'cta_link','/app/reisen', 'logo_url',''), true),
 ('site_contact', 'METROPOL TOURS', 'Kontakt', NULL,
  jsonb_build_object('phone','+49 511 87654321','email','info@metours.de','address','Rudolf-Diesel-Weg 8, 30827 Garbsen','opening_hours','Mo–Fr 8:00–20:00 Uhr','instagram','','facebook','','tiktok',''), true)
ON CONFLICT DO NOTHING;