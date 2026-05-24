ALTER TABLE gyms
  ADD COLUMN migration_checklist jsonb NOT NULL DEFAULT '{}'::jsonb;
