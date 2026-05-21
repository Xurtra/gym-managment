ALTER TABLE gyms
  ADD COLUMN logo_url text,
  ADD COLUMN brand_colors jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN business_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN operating_hours jsonb NOT NULL DEFAULT '{}'::jsonb;
