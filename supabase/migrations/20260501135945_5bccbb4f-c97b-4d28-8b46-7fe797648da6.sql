-- SOP Templates für Incident-Workflows
CREATE TABLE IF NOT EXISTS public.sop_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  severity TEXT,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  auto_escalate_minutes INTEGER,
  escalate_to_role TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sop_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view SOPs" ON public.sop_templates FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office') OR public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Admins manage SOPs" ON public.sop_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

-- SLA-relevante Felder auf incidents
ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS sop_template_id UUID,
  ADD COLUMN IF NOT EXISTS sop_progress JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;

-- Trip-Pünktlichkeitsmessungen
CREATE TABLE IF NOT EXISTS public.trip_otp_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL,
  scheduled_departure TIMESTAMPTZ NOT NULL,
  actual_departure TIMESTAMPTZ,
  scheduled_arrival TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  delay_minutes INTEGER,
  delay_reason TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_otp_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage OTP log" ON public.trip_otp_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office') OR public.has_role(auth.uid(), 'driver'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office') OR public.has_role(auth.uid(), 'driver'));

-- Seed gängige SOPs
INSERT INTO public.sop_templates (name, incident_type, severity, description, steps, auto_escalate_minutes, escalate_to_role) VALUES
  ('Bus-Panne', 'breakdown', 'critical', 'Standard-Vorgehen bei Fahrzeugausfall',
   '[{"order":1,"text":"Fahrer kontaktieren & Standort bestätigen"},{"order":2,"text":"Pannenhilfe (ADAC Truck Service) anrufen"},{"order":3,"text":"Ersatzbus aus Pool prüfen"},{"order":4,"text":"Fahrgäste per SMS informieren"},{"order":5,"text":"ETA an Reklamationsteam weitergeben"},{"order":6,"text":"Schadensprotokoll anlegen"}]'::jsonb,
   15, 'admin'),
  ('Verspätung > 30 Min', 'delay', 'high', 'Eskalation bei größeren Verspätungen',
   '[{"order":1,"text":"Ursache mit Fahrer klären"},{"order":2,"text":"Neue ETA berechnen"},{"order":3,"text":"Alle Buchungen mit Push-Nachricht informieren"},{"order":4,"text":"Anschluss-Verbindungen prüfen"},{"order":5,"text":"Bei > 60 Min: Entschädigungsangebot vorbereiten"}]'::jsonb,
   30, 'office'),
  ('Unfall mit Fahrgästen', 'accident', 'critical', 'Akut-Plan bei Unfall',
   '[{"order":1,"text":"112 anrufen wenn Verletzte"},{"order":2,"text":"Standort & Lage erfassen"},{"order":3,"text":"Geschäftsführung sofort benachrichtigen"},{"order":4,"text":"Versicherung (ERGO) informieren"},{"order":5,"text":"Alternativtransport organisieren"},{"order":6,"text":"Pressekontakt vorbereiten"},{"order":7,"text":"Polizei-Aktenzeichen dokumentieren"}]'::jsonb,
   5, 'admin'),
  ('Beschwerde Fahrer-Verhalten', 'complaint', 'normal', 'Vorgehen bei Personalbeschwerde',
   '[{"order":1,"text":"Beschwerdedetails dokumentieren"},{"order":2,"text":"Fahrer im persönlichen Gespräch konfrontieren"},{"order":3,"text":"Stellungnahme einholen"},{"order":4,"text":"Schulungsbedarf prüfen"},{"order":5,"text":"Kunde informieren & Lösung anbieten"}]'::jsonb,
   120, 'office')
ON CONFLICT DO NOTHING;