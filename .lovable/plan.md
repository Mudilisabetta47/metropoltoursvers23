

## Problem

The Settings page (`/admin/settings`) does not persist any data. The `handleSave` function (line 184) only shows a toast notification — it never writes to the database. All values are hardcoded defaults in `useState` and reset on every page reload.

## Plan

### 1. Create `app_settings` table (DB migration)

A single key-value table to store all settings sections:

```sql
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  settings jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write
CREATE POLICY "Admins manage settings" ON public.app_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
```

Each section (general, booking, finance, etc.) gets one row with `section_key` = "general", "booking", etc. and `settings` = the JSON object.

### 2. Update `AdminSettings.tsx`

- **Load on mount**: Fetch all rows from `app_settings`, parse each section's JSON into the corresponding state (falling back to current hardcoded defaults if no DB row exists yet).
- **Fix `handleSave`**: Upsert the section's state as JSON into `app_settings` using `upsert` with `onConflict: 'section_key'`. Show success/error toast based on result.
- Sections affected: general, booking, routes, tours, finance, crm, staff, notifications, templates, operations, vehicles (11 sections total).

### 3. Technical details

```text
Flow:
  Page load → SELECT * FROM app_settings
            → merge DB values over defaults for each section
  
  Save click → UPSERT into app_settings
               WHERE section_key = '<section>'
               SET settings = <state JSON>, updated_by = auth.uid()
```

No other files need changes. The existing UI inputs and state management stay the same — only the load and save logic gets connected to the database.

