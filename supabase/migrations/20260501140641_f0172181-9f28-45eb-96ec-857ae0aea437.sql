
-- Anhänge an Vorfälle
CREATE TABLE IF NOT EXISTS public.incident_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  category TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.incident_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view incident docs" ON public.incident_documents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office')
      OR public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'driver'));

CREATE POLICY "Staff upload incident docs" ON public.incident_documents FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office')
           OR public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'driver'));

CREATE POLICY "Admin/Office delete incident docs" ON public.incident_documents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

CREATE INDEX IF NOT EXISTS idx_incident_documents_incident ON public.incident_documents(incident_id);

-- Storage-Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-documents', 'incident-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Staff read incident files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'incident-documents' AND (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office')
    OR public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'driver')
  ));

CREATE POLICY "Staff upload incident files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'incident-documents' AND (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office')
    OR public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'driver')
  ));

CREATE POLICY "Admin/Office delete incident files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'incident-documents' AND (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office')
  ));

-- Statusübergang nach Rolle
CREATE OR REPLACE FUNCTION public.transition_incident_status(
  p_incident_id UUID,
  p_new_status TEXT,
  p_note TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role_ok BOOLEAN := false;
  v_old_status TEXT;
BEGIN
  IF p_new_status NOT IN ('open','in_progress','escalated','resolved') THEN
    RAISE EXCEPTION 'Ungültiger Status: %', p_new_status;
  END IF;

  -- Rollenregeln
  IF p_new_status = 'in_progress' THEN
    v_role_ok := public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office')
              OR public.has_role(auth.uid(),'agent') OR public.has_role(auth.uid(),'driver');
  ELSIF p_new_status = 'escalated' THEN
    v_role_ok := public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office');
  ELSIF p_new_status = 'resolved' THEN
    v_role_ok := public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office');
  ELSIF p_new_status = 'open' THEN
    v_role_ok := public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office');
  END IF;

  IF NOT v_role_ok THEN
    RAISE EXCEPTION 'Keine Berechtigung für Statusänderung auf %', p_new_status;
  END IF;

  SELECT status INTO v_old_status FROM public.incidents WHERE id = p_incident_id;

  UPDATE public.incidents
  SET status = p_new_status,
      escalated_at = CASE WHEN p_new_status='escalated' THEN now() ELSE escalated_at END,
      resolved_at = CASE WHEN p_new_status='resolved' THEN now() ELSE NULL END,
      updated_at = now()
  WHERE id = p_incident_id;

  PERFORM public.log_pii_access(
    'INCIDENT_STATUS_CHANGE',
    'incidents',
    p_incident_id,
    NULL,
    jsonb_build_object('from', v_old_status, 'to', p_new_status, 'note', p_note)
  );

  RETURN true;
END; $$;

-- Auto-Resolve wenn alle SOP-Schritte erledigt
CREATE OR REPLACE FUNCTION public.auto_resolve_on_sop_complete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total INT;
  v_done INT;
BEGIN
  IF NEW.sop_progress IS NULL OR jsonb_array_length(NEW.sop_progress) = 0 THEN
    RETURN NEW;
  END IF;

  SELECT jsonb_array_length(NEW.sop_progress) INTO v_total;
  SELECT COUNT(*) INTO v_done
  FROM jsonb_array_elements(NEW.sop_progress) e
  WHERE (e->>'done')::boolean = true;

  IF v_total > 0 AND v_done = v_total AND NEW.status NOT IN ('resolved','escalated') THEN
    NEW.status := 'resolved';
    NEW.resolved_at := now();
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_incident_auto_resolve ON public.incidents;
CREATE TRIGGER trg_incident_auto_resolve
  BEFORE UPDATE OF sop_progress ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.auto_resolve_on_sop_complete();

-- 15 weitere SOP-Templates
INSERT INTO public.sop_templates (name, incident_type, severity, description, steps, auto_escalate_minutes, escalate_to_role) VALUES
  ('Reifenschaden', 'breakdown', 'high', 'Vorgehen bei Reifenpanne unterwegs',
   '[{"order":1,"text":"Sicheren Standort sicherstellen, Warnblinker"},{"order":2,"text":"Pannenhilfe-Hotline anrufen"},{"order":3,"text":"Fahrgäste evakuieren falls Autobahn"},{"order":4,"text":"Ersatzfahrzeug-Bedarf prüfen"},{"order":5,"text":"Verspätungs-Info an Kunden"}]'::jsonb, 20, 'office'),
  ('Klimaanlage defekt', 'breakdown', 'normal', 'Klimadefekt – Komfortbeeinträchtigung',
   '[{"order":1,"text":"Fenster-Lüftung aktivieren"},{"order":2,"text":"Wasser an Fahrgäste verteilen"},{"order":3,"text":"Werkstatt am Zielort vorbereiten"},{"order":4,"text":"Entschädigung (Gutschein) vorbereiten"}]'::jsonb, 60, 'office'),
  ('Tank-/Kraftstoff-Diebstahl', 'security', 'high', 'Diebstahl auf Parkplatz',
   '[{"order":1,"text":"Polizei verständigen"},{"order":2,"text":"Tankstelle in der Nähe lokalisieren"},{"order":3,"text":"Kasko-Versicherung informieren"},{"order":4,"text":"Foto-Dokumentation anhängen"}]'::jsonb, 30, 'admin'),
  ('Polizeikontrolle', 'other', 'normal', 'Routine- oder Sonderkontrolle',
   '[{"order":1,"text":"Alle Fahrzeugpapiere bereit halten"},{"order":2,"text":"Fahrer-Module-95 vorzeigen"},{"order":3,"text":"Tachograph-Daten zugänglich machen"},{"order":4,"text":"Dauer & Beanstandungen dokumentieren"}]'::jsonb, NULL, NULL),
  ('Grenzproblem / Zoll', 'other', 'high', 'Probleme an EU-Außengrenze',
   '[{"order":1,"text":"Passagierliste aktuell halten"},{"order":2,"text":"Fehlende Ausweise identifizieren"},{"order":3,"text":"Konsulat-Notfallnummern kontaktieren"},{"order":4,"text":"Office über Verzögerung informieren"}]'::jsonb, 45, 'admin'),
  ('Streik / Blockade', 'delay', 'high', 'Verkehrsblockade durch Streik/Demo',
   '[{"order":1,"text":"Aktuelle Lage via Verkehrsfunk prüfen"},{"order":2,"text":"Alternative Route berechnen"},{"order":3,"text":"ETA an Kunden senden"},{"order":4,"text":"Bei Stillstand > 2h: Verpflegung organisieren"}]'::jsonb, 60, 'office'),
  ('Wetter-Notlage (Sturm/Schnee)', 'delay', 'critical', 'Extremwetter mit Gefahr',
   '[{"order":1,"text":"DWD-Warnung prüfen"},{"order":2,"text":"Sicheren Standort ansteuern"},{"order":3,"text":"Heizung & Verpflegung sicherstellen"},{"order":4,"text":"Ggf. Hotelübernachtung organisieren"},{"order":5,"text":"Versicherung über Force Majeure informieren"}]'::jsonb, 30, 'admin'),
  ('Toiletten-Ausfall', 'breakdown', 'normal', 'WC im Bus defekt',
   '[{"order":1,"text":"WC sperren & beschildern"},{"order":2,"text":"Pausenfrequenz auf 90 Min erhöhen"},{"order":3,"text":"Fahrgäste freundlich informieren"},{"order":4,"text":"Werkstatt-Auftrag anlegen"}]'::jsonb, 120, 'office'),
  ('WLAN/Bordtechnik-Ausfall', 'breakdown', 'info', 'Komfort-Defekt',
   '[{"order":1,"text":"Router neu starten"},{"order":2,"text":"Fahrgäste informieren"},{"order":3,"text":"Ticket im IT-System anlegen"}]'::jsonb, NULL, NULL),
  ('Verlorene Gegenstände', 'other', 'info', 'Fundsachen-Management',
   '[{"order":1,"text":"Fundgegenstand fotografieren & beschreiben"},{"order":2,"text":"Im Fundbuch registrieren"},{"order":3,"text":"Eigentümer kontaktieren wenn bekannt"},{"order":4,"text":"Versand oder Abholung organisieren"}]'::jsonb, NULL, NULL),
  ('Diebstahl an Bord', 'security', 'high', 'Eigentumsdelikt unter Fahrgästen',
   '[{"order":1,"text":"Bus an sicherem Ort anhalten"},{"order":2,"text":"Polizei verständigen (110)"},{"order":3,"text":"Zeugen-Daten sammeln"},{"order":4,"text":"Bordvideo sichern"},{"order":5,"text":"Anzeige-Aktenzeichen dokumentieren"}]'::jsonb, 15, 'admin'),
  ('Aggressive Fahrgäste', 'security', 'high', 'Konflikt-Deeskalation',
   '[{"order":1,"text":"Deeskalation versuchen"},{"order":2,"text":"Bei Bedrohung: Polizei (110)"},{"order":3,"text":"Ggf. Bus stoppen & Person verweisen"},{"order":4,"text":"Vorfall protokollieren & Hausverbot prüfen"}]'::jsonb, 10, 'admin'),
  ('Krankheit / Ausfall Fahrer', 'medical', 'critical', 'Fahrer dienstunfähig',
   '[{"order":1,"text":"Bus sicher abstellen"},{"order":2,"text":"112 bei medizinischem Notfall"},{"order":3,"text":"Ersatz-Fahrer aus Bereitschaft alarmieren"},{"order":4,"text":"Fahrgäste informieren & betreuen"},{"order":5,"text":"Lenkzeit-Doku aktualisieren"}]'::jsonb, 20, 'admin'),
  ('Tachograph-Fehler', 'other', 'high', 'EU-Pflichtgerät defekt',
   '[{"order":1,"text":"Manuell-Aufzeichnung starten"},{"order":2,"text":"Werkstatttermin innerhalb 7 Tagen"},{"order":3,"text":"Office: Sondergenehmigung prüfen"},{"order":4,"text":"Reparatur dokumentieren"}]'::jsonb, 60, 'office'),
  ('Maut-Sperre / OBU-Defekt', 'breakdown', 'high', 'Toll-Collect Gerät blockiert',
   '[{"order":1,"text":"Toll Collect Hotline anrufen"},{"order":2,"text":"Manuelle Einbuchung über App/Terminal"},{"order":3,"text":"Belege sammeln & einreichen"},{"order":4,"text":"OBU-Tausch-Termin vereinbaren"}]'::jsonb, 45, 'office')
ON CONFLICT DO NOTHING;
