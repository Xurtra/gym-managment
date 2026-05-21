ALTER TABLE users
  ADD COLUMN two_factor_secret text,
  ADD COLUMN two_factor_enabled_at timestamptz,
  ADD COLUMN recovery_code_hashes jsonb NOT NULL DEFAULT '[]'::jsonb;
