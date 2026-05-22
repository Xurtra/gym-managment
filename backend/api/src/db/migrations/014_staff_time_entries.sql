CREATE TABLE staff_time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  location_id uuid REFERENCES locations(id),
  clocked_in_at timestamptz NOT NULL,
  clocked_out_at timestamptz,
  clocked_in_by_user_id uuid NOT NULL REFERENCES users(id),
  clocked_out_by_user_id uuid REFERENCES users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (clocked_out_at IS NULL OR clocked_out_at >= clocked_in_at)
);

CREATE UNIQUE INDEX staff_time_entries_one_open_idx
  ON staff_time_entries(gym_id, user_id)
  WHERE clocked_out_at IS NULL;

CREATE INDEX staff_time_entries_gym_clocked_in_idx
  ON staff_time_entries(gym_id, clocked_in_at DESC);

