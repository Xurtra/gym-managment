ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS studio_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS setup_wizard jsonb NOT NULL DEFAULT '{}'::jsonb;
