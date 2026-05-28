CREATE TABLE migration_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('draft', 'files_uploaded', 'detecting', 'ready_for_staging', 'approved', 'finalized', 'cancelled')),
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  approved_by_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  finalized_at timestamptz,
  summary_json jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE migration_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_batch_id uuid NOT NULL REFERENCES migration_batches(id) ON DELETE CASCADE,
  original_filename text NOT NULL,
  stored_file_path text NOT NULL,
  content_type text NOT NULL DEFAULT 'application/octet-stream',
  size_bytes integer NOT NULL DEFAULT 0,
  file_type text NOT NULL CHECK (file_type IN ('members', 'staff', 'membership_plans', 'classes', 'attendance', 'billing', 'appointments', 'unknown')),
  detected_file_type text CHECK (detected_file_type IS NULL OR detected_file_type IN ('members', 'staff', 'membership_plans', 'classes', 'attendance', 'billing', 'appointments', 'unknown')),
  file_type_confidence numeric(5,4),
  detection_reason text,
  row_count integer NOT NULL DEFAULT 0,
  column_headers_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  sample_rows_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL CHECK (status IN ('uploaded', 'detecting', 'needs_review', 'confirmed', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE migration_column_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_batch_id uuid NOT NULL REFERENCES migration_batches(id) ON DELETE CASCADE,
  migration_file_id uuid NOT NULL REFERENCES migration_files(id) ON DELETE CASCADE,
  source_column text NOT NULL,
  target_field text,
  confidence numeric(5,4),
  approved boolean NOT NULL DEFAULT false,
  approved_by_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE migration_staged_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_batch_id uuid NOT NULL REFERENCES migration_batches(id) ON DELETE CASCADE,
  migration_file_id uuid NOT NULL REFERENCES migration_files(id) ON DELETE CASCADE,
  source_row_number integer NOT NULL,
  source_row_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_name text,
  last_name text,
  full_name text,
  email text,
  phone text,
  date_of_birth date,
  address text,
  emergency_contact text,
  membership_status text,
  membership_plan_name text,
  start_date date,
  cancellation_date date,
  next_billing_date date,
  assigned_trainer_name text,
  notes text,
  tags_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  duplicate_group_id uuid,
  validation_status text NOT NULL,
  ai_confidence numeric(5,4),
  approved boolean NOT NULL DEFAULT false,
  imported_member_id uuid REFERENCES members(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE migration_staged_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_batch_id uuid NOT NULL REFERENCES migration_batches(id) ON DELETE CASCADE,
  migration_file_id uuid NOT NULL REFERENCES migration_files(id) ON DELETE CASCADE,
  source_row_number integer NOT NULL,
  source_row_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  full_name text,
  first_name text,
  last_name text,
  email text,
  phone text,
  old_role_name text,
  suggested_role_name text,
  final_role_name text,
  employment_status text,
  assigned_location text,
  trainer_flag boolean NOT NULL DEFAULT false,
  instructor_flag boolean NOT NULL DEFAULT false,
  permission_level text,
  pay_type text,
  hourly_rate numeric(12,2),
  notes text,
  validation_status text NOT NULL,
  ai_confidence numeric(5,4),
  approved boolean NOT NULL DEFAULT false,
  imported_staff_id uuid REFERENCES gym_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE migration_staged_membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_batch_id uuid NOT NULL REFERENCES migration_batches(id) ON DELETE CASCADE,
  migration_file_id uuid NOT NULL REFERENCES migration_files(id) ON DELETE CASCADE,
  source_row_number integer NOT NULL,
  source_row_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  plan_name text,
  plan_type text,
  price numeric(12,2),
  billing_frequency text,
  contract_length integer,
  class_limit integer,
  session_limit integer,
  active boolean NOT NULL DEFAULT true,
  notes text,
  validation_status text NOT NULL,
  ai_confidence numeric(5,4),
  approved boolean NOT NULL DEFAULT false,
  imported_plan_id uuid REFERENCES membership_plans(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE migration_role_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_batch_id uuid NOT NULL REFERENCES migration_batches(id) ON DELETE CASCADE,
  old_role_name text NOT NULL,
  suggested_role_name text,
  final_role_name text,
  confidence numeric(5,4),
  requires_review boolean NOT NULL DEFAULT true,
  approved boolean NOT NULL DEFAULT false,
  approved_by_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE migration_plan_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_batch_id uuid NOT NULL REFERENCES migration_batches(id) ON DELETE CASCADE,
  old_plan_name text NOT NULL,
  suggested_plan_type text,
  final_plan_type text,
  confidence numeric(5,4),
  requires_review boolean NOT NULL DEFAULT true,
  approved boolean NOT NULL DEFAULT false,
  approved_by_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE migration_validation_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_batch_id uuid NOT NULL REFERENCES migration_batches(id) ON DELETE CASCADE,
  migration_file_id uuid REFERENCES migration_files(id) ON DELETE CASCADE,
  staged_record_type text NOT NULL,
  staged_record_id uuid,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  error_code text NOT NULL,
  message text NOT NULL,
  field_name text,
  resolved boolean NOT NULL DEFAULT false,
  resolved_by_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE migration_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_batch_id uuid NOT NULL REFERENCES migration_batches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  before_json jsonb,
  after_json jsonb,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX migration_batches_gym_id_idx ON migration_batches(gym_id);
CREATE INDEX migration_batches_status_idx ON migration_batches(status);
CREATE INDEX migration_files_migration_batch_id_idx ON migration_files(migration_batch_id);
CREATE INDEX migration_files_file_type_idx ON migration_files(file_type);
CREATE INDEX migration_files_status_idx ON migration_files(status);
CREATE INDEX migration_files_detected_file_type_idx ON migration_files(detected_file_type);
CREATE INDEX migration_column_mappings_migration_batch_id_idx ON migration_column_mappings(migration_batch_id);
CREATE INDEX migration_column_mappings_migration_file_id_idx ON migration_column_mappings(migration_file_id);
CREATE INDEX migration_column_mappings_approved_idx ON migration_column_mappings(approved);
CREATE INDEX migration_staged_members_migration_batch_id_idx ON migration_staged_members(migration_batch_id);
CREATE INDEX migration_staged_members_migration_file_id_idx ON migration_staged_members(migration_file_id);
CREATE INDEX migration_staged_members_validation_status_idx ON migration_staged_members(validation_status);
CREATE INDEX migration_staged_members_approved_idx ON migration_staged_members(approved);
CREATE INDEX migration_staged_staff_migration_batch_id_idx ON migration_staged_staff(migration_batch_id);
CREATE INDEX migration_staged_staff_migration_file_id_idx ON migration_staged_staff(migration_file_id);
CREATE INDEX migration_staged_staff_validation_status_idx ON migration_staged_staff(validation_status);
CREATE INDEX migration_staged_staff_approved_idx ON migration_staged_staff(approved);
CREATE INDEX migration_staged_membership_plans_migration_batch_id_idx ON migration_staged_membership_plans(migration_batch_id);
CREATE INDEX migration_staged_membership_plans_migration_file_id_idx ON migration_staged_membership_plans(migration_file_id);
CREATE INDEX migration_staged_membership_plans_validation_status_idx ON migration_staged_membership_plans(validation_status);
CREATE INDEX migration_staged_membership_plans_approved_idx ON migration_staged_membership_plans(approved);
CREATE INDEX migration_role_mappings_migration_batch_id_idx ON migration_role_mappings(migration_batch_id);
CREATE INDEX migration_role_mappings_approved_idx ON migration_role_mappings(approved);
CREATE INDEX migration_plan_mappings_migration_batch_id_idx ON migration_plan_mappings(migration_batch_id);
CREATE INDEX migration_plan_mappings_approved_idx ON migration_plan_mappings(approved);
CREATE INDEX migration_validation_errors_migration_batch_id_idx ON migration_validation_errors(migration_batch_id);
CREATE INDEX migration_validation_errors_migration_file_id_idx ON migration_validation_errors(migration_file_id);
CREATE INDEX migration_validation_errors_severity_idx ON migration_validation_errors(severity);
CREATE INDEX migration_audit_logs_migration_batch_id_idx ON migration_audit_logs(migration_batch_id);
