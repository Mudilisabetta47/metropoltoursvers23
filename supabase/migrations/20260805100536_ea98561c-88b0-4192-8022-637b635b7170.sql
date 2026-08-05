
-- Templates
CREATE TABLE public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  body TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_templates TO authenticated;
GRANT ALL ON public.contract_templates TO service_role;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage contract templates" ON public.contract_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- Contract number generator
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n TEXT; y TEXT; s TEXT;
BEGIN
  y := TO_CHAR(now(),'YYYY');
  LOOP
    s := LPAD(FLOOR(RANDOM()*100000)::TEXT, 5, '0');
    n := 'AV-' || y || '-' || s;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.employment_contracts WHERE contract_number = n);
  END LOOP;
  RETURN n;
END $$;

-- Contracts
CREATE TABLE public.employment_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL UNIQUE,
  template_id UUID REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  employee_user_id UUID,

  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  birth_date DATE,
  address TEXT,
  email TEXT,
  phone TEXT,
  tax_id TEXT,
  social_security_number TEXT,
  nationality TEXT,
  iban TEXT,
  bic TEXT,

  position TEXT,
  department TEXT,
  start_date DATE,
  is_temporary BOOLEAN NOT NULL DEFAULT false,
  end_date DATE,
  probation_months INTEGER DEFAULT 6,
  weekly_hours NUMERIC(5,2),
  work_location TEXT,
  salary NUMERIC(10,2),
  bonus TEXT,
  vacation_days INTEGER,
  notice_period TEXT,
  working_hours TEXT,
  other_agreements TEXT,

  company JSONB NOT NULL DEFAULT '{}'::jsonb,

  signature_employee TEXT,
  signature_employer TEXT,
  signed_employee_at TIMESTAMPTZ,
  signed_employer_at TIMESTAMPTZ,

  rendered_body TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employment_contracts TO authenticated;
GRANT ALL ON public.employment_contracts TO service_role;
ALTER TABLE public.employment_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage employment contracts" ON public.employment_contracts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- Versions
CREATE TABLE public.contract_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.employment_contracts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  note TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.contract_versions TO authenticated;
GRANT ALL ON public.contract_versions TO service_role;
ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read contract versions" ON public.contract_versions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE POLICY "Staff insert contract versions" ON public.contract_versions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

CREATE TRIGGER trg_contract_templates_updated BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_employment_contracts_updated BEFORE UPDATE ON public.employment_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_employment_contracts_status ON public.employment_contracts(status);
CREATE INDEX idx_contract_versions_contract ON public.contract_versions(contract_id);

INSERT INTO public.contract_templates (name, description, body, is_default)
VALUES (
  'Standard-Arbeitsvertrag (unbefristet)',
  'Deutscher Standardarbeitsvertrag mit allen Pflichtangaben nach NachwG.',
  E'# ARBEITSVERTRAG\n\nZwischen\n\n**{{firma_name}}**, {{firma_anschrift}}\nvertreten durch den Geschäftsführer {{firma_geschaeftsfuehrer}}\n– nachfolgend "Arbeitgeber" genannt –\n\nund\n\n**{{vorname}} {{nachname}}**, geb. am {{geburtsdatum}}\n{{anschrift}}\n– nachfolgend "Arbeitnehmer" genannt –\n\nwird folgender Arbeitsvertrag geschlossen:\n\n## § 1 Beginn und Dauer des Arbeitsverhältnisses\n\nDas Arbeitsverhältnis beginnt am {{arbeitsbeginn}}. {{befristung_text}}\n\nDie ersten {{probezeit}} Monate gelten als Probezeit. Während der Probezeit kann das Arbeitsverhältnis von beiden Seiten mit einer Frist von zwei Wochen gekündigt werden.\n\n## § 2 Tätigkeit\n\nDer Arbeitnehmer wird als **{{position}}** in der Abteilung {{abteilung}} eingestellt. Arbeitsort ist {{arbeitsort}}.\n\n## § 3 Arbeitszeit\n\nDie regelmäßige wöchentliche Arbeitszeit beträgt {{wochenarbeitszeit}} Stunden. {{arbeitszeiten}}\n\n## § 4 Vergütung\n\nDer Arbeitnehmer erhält ein monatliches Bruttogehalt von **{{gehalt}}**, zahlbar jeweils zum Monatsende auf das Konto:\nIBAN {{iban}}, BIC {{bic}}.\n\n{{bonus_text}}\n\n## § 5 Urlaub\n\nDer Arbeitnehmer hat Anspruch auf {{urlaubstage}} Arbeitstage bezahlten Erholungsurlaub pro Kalenderjahr.\n\n## § 6 Kündigung\n\nNach Ablauf der Probezeit gilt eine Kündigungsfrist von {{kuendigungsfrist}}. Die gesetzlichen Kündigungsfristen bleiben unberührt. Die Kündigung bedarf der Schriftform.\n\n## § 7 Verschwiegenheit\n\nDer Arbeitnehmer verpflichtet sich, über alle Betriebs- und Geschäftsgeheimnisse Stillschweigen zu bewahren, auch über das Ende des Arbeitsverhältnisses hinaus.\n\n## § 8 Sonstige Vereinbarungen\n\n{{sonstige_vereinbarungen}}\n\n## § 9 Schlussbestimmungen\n\nÄnderungen und Ergänzungen dieses Vertrages bedürfen der Schriftform. Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.\n\nSteuer-ID: {{steuer_id}} · SV-Nummer: {{sv_nummer}} · Staatsangehörigkeit: {{staatsangehoerigkeit}}\n\n{{ort_datum}}\n',
  true
);
