CREATE TABLE campaign_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  import_type text NOT NULL CHECK (import_type IN ('clients', 'bookings', 'services', 'memberships_packages', 'payments', 'rooms_devices')),
  original_filename text NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  imported_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  mappings_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  sample_rows_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE campaign_import_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_import_batch_id uuid NOT NULL REFERENCES campaign_import_batches(id) ON DELETE CASCADE,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  import_type text NOT NULL CHECK (import_type IN ('clients', 'bookings', 'services', 'memberships_packages', 'payments', 'rooms_devices')),
  source_row_number integer NOT NULL,
  source_row_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  normalized_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  validation_status text NOT NULL CHECK (validation_status IN ('ready', 'warning', 'critical', 'skipped')),
  errors_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  imported_entity_type text,
  imported_entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_import_batches_gym_id ON campaign_import_batches(gym_id);
CREATE INDEX idx_campaign_import_batches_import_type ON campaign_import_batches(import_type);
CREATE INDEX idx_campaign_import_batches_created_at ON campaign_import_batches(created_at);
CREATE INDEX idx_campaign_import_records_batch_id ON campaign_import_records(campaign_import_batch_id);
CREATE INDEX idx_campaign_import_records_gym_id ON campaign_import_records(gym_id);
CREATE INDEX idx_campaign_import_records_import_type ON campaign_import_records(import_type);
CREATE INDEX idx_campaign_import_records_validation_status ON campaign_import_records(validation_status);
