
CREATE TABLE public.driver_navigation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_user_id UUID NOT NULL,
  sent_by UUID NOT NULL,
  destination_lat NUMERIC NOT NULL,
  destination_lng NUMERIC NOT NULL,
  destination_name TEXT NOT NULL,
  destination_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_navigation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and office manage navigation"
ON public.driver_navigation FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Drivers can view own navigation"
ON public.driver_navigation FOR SELECT TO authenticated
USING (auth.uid() = driver_user_id);

CREATE POLICY "Drivers can update own navigation status"
ON public.driver_navigation FOR UPDATE TO authenticated
USING (auth.uid() = driver_user_id)
WITH CHECK (auth.uid() = driver_user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_navigation;
