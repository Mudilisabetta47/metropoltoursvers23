-- Create table for package tour inquiries
CREATE TABLE public.package_tour_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_number TEXT NOT NULL UNIQUE,
  tour_id TEXT NOT NULL,
  destination TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  participants INTEGER NOT NULL DEFAULT 1,
  message TEXT,
  total_price NUMERIC(10,2) NOT NULL,
  departure_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.package_tour_inquiries ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own inquiries" 
ON public.package_tour_inquiries 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can create inquiries" 
ON public.package_tour_inquiries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Agents and admins can view all inquiries" 
ON public.package_tour_inquiries 
FOR SELECT 
USING (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents and admins can update inquiries" 
ON public.package_tour_inquiries 
FOR UPDATE 
USING (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'));

-- Create function to generate inquiry number
CREATE OR REPLACE FUNCTION public.generate_inquiry_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_part TEXT;
  seq_part TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  seq_part := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  new_number := 'INQ-' || year_part || '-' || seq_part;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.package_tour_inquiries WHERE inquiry_number = new_number) LOOP
    seq_part := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    new_number := 'INQ-' || year_part || '-' || seq_part;
  END LOOP;
  
  RETURN new_number;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_package_tour_inquiries_updated_at
BEFORE UPDATE ON public.package_tour_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();