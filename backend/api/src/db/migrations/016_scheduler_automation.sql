CREATE TABLE scheduler_coverage_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name text NOT NULL,
  location_id uuid REFERENCES locations(id),
  role_id uuid NOT NULL REFERENCES roles(id),
  days_of_week jsonb NOT NULL DEFAULT '[]'::jsonb,
  start_time text NOT NULL,
  end_time text NOT NULL,
  required_staff integer NOT NULL DEFAULT 1 CHECK (required_staff > 0),
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE INDEX scheduler_coverage_rules_gym_idx ON scheduler_coverage_rules(gym_id);
CREATE INDEX scheduler_coverage_rules_role_idx ON scheduler_coverage_rules(role_id);

CREATE TABLE scheduler_availabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  days_of_week jsonb NOT NULL DEFAULT '[]'::jsonb,
  start_time text NOT NULL,
  end_time text NOT NULL,
  preference text NOT NULL DEFAULT 'available'
    CHECK (preference IN ('available', 'preferred', 'unavailable')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE INDEX scheduler_availabilities_gym_user_idx ON scheduler_availabilities(gym_id, user_id);

CREATE TABLE scheduler_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  shift_id uuid REFERENCES staff_shifts(id) ON DELETE SET NULL,
  request_type text NOT NULL DEFAULT 'complaint'
    CHECK (request_type IN ('time_off', 'swap', 'complaint')),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved', 'declined')),
  suggested_replacement_user_id uuid REFERENCES users(id),
  resolution_note text,
  resolved_by_user_id uuid REFERENCES users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX scheduler_requests_gym_status_idx ON scheduler_requests(gym_id, status);
CREATE INDEX scheduler_requests_gym_user_idx ON scheduler_requests(gym_id, user_id);

UPDATE roles
SET permissions = (
  SELECT jsonb_agg(DISTINCT value)
  FROM jsonb_array_elements_text(
    permissions || '[
      "schedule:read",
      "schedule:create",
      "schedule:publish",
      "schedule:requests_manage",
      "schedule:auto_resolve"
    ]'::jsonb
  ) AS value
)
WHERE name = 'owner';
