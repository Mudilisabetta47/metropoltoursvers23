
-- Offers table
CREATE TABLE public.tour_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid REFERENCES public.package_tour_inquiries(id) ON DELETE SET NULL,
  offer_number text NOT NULL DEFAULT (('ANG-' || to_char(now(), 'YYYY')) || '-' || lpad(floor(random() * 1000000)::text, 6, '0')),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  destination text NOT NULL,
  departure_date text,
  participants integer NOT NULL DEFAULT 1,
  subtotal numeric NOT NULL DEFAULT 0,
  discount_percent numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  valid_until date DEFAULT (CURRENT_DATE + interval '14 days'),
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Offer line items
CREATE TABLE public.tour_offer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.tour_offers(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.tour_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_offer_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage offers" ON public.tour_offers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Agents view offers" ON public.tour_offers FOR SELECT USING (has_role(auth.uid(), 'agent'::app_role));
CREATE POLICY "Agents create offers" ON public.tour_offers FOR INSERT WITH CHECK (has_role(auth.uid(), 'agent'::app_role));
CREATE POLICY "Agents update offers" ON public.tour_offers FOR UPDATE USING (has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Admins manage offer items" ON public.tour_offer_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Agents manage offer items" ON public.tour_offer_items FOR ALL USING (has_role(auth.uid(), 'agent'::app_role));
