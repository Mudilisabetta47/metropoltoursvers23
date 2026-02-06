-- Create package_tours table for dynamic tour management
CREATE TABLE public.package_tours (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    destination TEXT NOT NULL,
    location TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Europa',
    duration_days INTEGER NOT NULL DEFAULT 7,
    price_from NUMERIC(10,2) NOT NULL,
    image_url TEXT,
    highlights TEXT[] DEFAULT '{}',
    description TEXT,
    itinerary JSONB DEFAULT '[]',
    included_services TEXT[] DEFAULT '{}',
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,
    max_participants INTEGER DEFAULT 50,
    current_participants INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    discount_percent INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cms_content table for dynamic content management
CREATE TABLE public.cms_content (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    section_key TEXT NOT NULL UNIQUE,
    title TEXT,
    subtitle TEXT,
    content TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cms_categories table for organizing content
CREATE TABLE public.cms_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    parent_id UUID REFERENCES public.cms_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_types table to replace hardcoded business services
CREATE TABLE public.service_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT NOT NULL,
    highlight TEXT,
    features TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.package_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

-- Package tours policies
CREATE POLICY "Package tours are viewable by everyone" 
ON public.package_tours 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage package tours" 
ON public.package_tours 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- CMS content policies
CREATE POLICY "CMS content is viewable by everyone" 
ON public.cms_content 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage CMS content" 
ON public.cms_content 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- CMS categories policies
CREATE POLICY "CMS categories are viewable by everyone" 
ON public.cms_categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage CMS categories" 
ON public.cms_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Service types policies
CREATE POLICY "Service types are viewable by everyone" 
ON public.service_types 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage service types" 
ON public.service_types 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_package_tours_updated_at
    BEFORE UPDATE ON public.package_tours
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_content_updated_at
    BEFORE UPDATE ON public.cms_content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_types_updated_at
    BEFORE UPDATE ON public.service_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();