
-- Job Listings table
CREATE TABLE public.job_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text NOT NULL DEFAULT 'Allgemein',
  location text NOT NULL DEFAULT 'Düsseldorf',
  employment_type text NOT NULL DEFAULT 'Vollzeit',
  description text,
  requirements text[] NOT NULL DEFAULT '{}',
  benefits text[] NOT NULL DEFAULT '{}',
  salary_range text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage job listings" ON public.job_listings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Job listings viewable by everyone" ON public.job_listings FOR SELECT TO public
  USING (is_active = true);

-- Job Applications table
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_listing_id uuid REFERENCES public.job_listings(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text,
  status text NOT NULL DEFAULT 'new',
  internal_notes text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit applications" ON public.job_applications FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Admins manage applications" ON public.job_applications FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin Mailbox table for internal webmail system
CREATE TABLE public.admin_mailbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder text NOT NULL DEFAULT 'inbox',
  subject text NOT NULL,
  body text NOT NULL DEFAULT '',
  sender_email text,
  sender_name text,
  recipient_email text,
  recipient_name text,
  source_type text NOT NULL DEFAULT 'manual',
  source_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  is_starred boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  replied_at timestamptz,
  reply_body text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_mailbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and office manage mailbox" ON public.admin_mailbox FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "System can insert into mailbox" ON public.admin_mailbox FOR INSERT TO public
  WITH CHECK (true);

-- Admin Mail Templates
CREATE TABLE public.admin_mail_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_mail_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage mail templates" ON public.admin_mail_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
