CREATE TABLE scheduler_settings (
  gym_id uuid PRIMARY KEY REFERENCES gyms(id) ON DELETE CASCADE,
  planning_horizon_days integer NOT NULL DEFAULT 14 CHECK (planning_horizon_days BETWEEN 1 AND 90),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO scheduler_settings (gym_id, planning_horizon_days, created_at, updated_at)
SELECT id, 14, now(), now()
FROM gyms
ON CONFLICT (gym_id) DO NOTHING;

CREATE TABLE scheduler_preference_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  days_of_week jsonb NOT NULL DEFAULT '[]'::jsonb,
  start_time text NOT NULL,
  end_time text NOT NULL,
  preference text NOT NULL DEFAULT 'preferred'
    CHECK (preference IN ('available', 'preferred', 'unavailable')),
  notes text,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'approved', 'declined')),
  resolution_note text,
  resolved_by_user_id uuid REFERENCES users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE INDEX scheduler_preference_requests_gym_status_idx
  ON scheduler_preference_requests(gym_id, status);

CREATE INDEX scheduler_preference_requests_gym_user_idx
  ON scheduler_preference_requests(gym_id, user_id);
