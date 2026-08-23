DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='cookie_consents' LOOP
    EXECUTE format('DROP POLICY %I ON public.cookie_consents', p.policyname);
  END LOOP;
END $$;

REVOKE ALL ON public.cookie_consents FROM anon, authenticated;
GRANT INSERT ON public.cookie_consents TO anon;
GRANT INSERT, SELECT ON public.cookie_consents TO authenticated;
GRANT ALL ON public.cookie_consents TO service_role;

ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cookie_consents_insert_anyone"
ON public.cookie_consents FOR INSERT TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "cookie_consents_select_own"
ON public.cookie_consents FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));