-- Fix PUBLIC_SENSITIVE_COLUMN_EXPOSURE for trips table
-- This migration revokes access to sensitive staff IDs from anonymous users.
-- driver_user_id and guide_user_id are staff UUIDs and should not be public.

-- 1. Revoke sensitive columns from anonymous role
-- internal_notes is already revoked in previous migrations, but we include it for completeness.
REVOKE SELECT (driver_user_id, guide_user_id, internal_notes) ON public.trips FROM anon;

-- Note: We maintain access for 'authenticated' role for driver_user_id and guide_user_id
-- to ensure that driver-specific features and admin dashboards continue to function
-- without requiring significant application-level changes.
