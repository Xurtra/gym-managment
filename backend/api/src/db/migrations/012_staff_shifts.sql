CREATE TABLE staff_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  location_id uuid REFERENCES locations(id),
  role_id uuid NOT NULL REFERENCES roles(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  notes text,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX staff_shifts_gym_user_starts_at_idx ON staff_shifts(gym_id, user_id, starts_at);
CREATE INDEX staff_shifts_location_starts_at_idx ON staff_shifts(location_id, starts_at);
