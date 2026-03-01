
-- Add office and driver roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'office';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'driver';
