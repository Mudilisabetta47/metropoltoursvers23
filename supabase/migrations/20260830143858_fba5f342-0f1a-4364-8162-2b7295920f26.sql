CREATE TABLE public.advisor_leads (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  email text,
  phone text,
  name text,
  request_text text,
  reason text not null default 'unknown_destination',
  page_url text,
  status text not null default 'new',
  handled_by uuid references auth.users(id) on delete set null,
  handled_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.advisor_leads TO authenticated;
GRANT ALL ON public.advisor_leads TO service_role;

ALTER TABLE public.advisor_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view advisor leads" ON public.advisor_leads
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

CREATE POLICY "Staff can update advisor leads" ON public.advisor_leads
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

CREATE POLICY "Admins can delete advisor leads" ON public.advisor_leads
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_advisor_leads_created_at ON public.advisor_leads (created_at DESC);