CREATE TABLE public.dispo_ai_examples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_email_id UUID REFERENCES public.dispo_emails(id) ON DELETE SET NULL,
  subject TEXT,
  body_text TEXT NOT NULL,
  from_email TEXT,
  is_inquiry BOOLEAN NOT NULL,
  label TEXT NOT NULL DEFAULT 'anfrage',
  extracted JSONB NOT NULL DEFAULT '{}'::jsonb,
  note TEXT,
  use_for_training BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispo_ai_examples TO authenticated;
GRANT ALL ON public.dispo_ai_examples TO service_role;

ALTER TABLE public.dispo_ai_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage dispo ai examples"
ON public.dispo_ai_examples FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

CREATE INDEX idx_dispo_ai_examples_training ON public.dispo_ai_examples (use_for_training, is_inquiry, created_at DESC);

CREATE TRIGGER update_dispo_ai_examples_updated_at
BEFORE UPDATE ON public.dispo_ai_examples
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();