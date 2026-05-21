CREATE TABLE staff_availabilities (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekday integer NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  starts_at text NOT NULL CHECK (starts_at ~ '^\d{2}:\d{2}$'),
  ends_at text NOT NULL CHECK (ends_at ~ '^\d{2}:\d{2}$'),
  location_id uuid REFERENCES locations(id),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (ends_at > starts_at)
);

CREATE INDEX staff_availabilities_gym_user_idx
  ON staff_availabilities (gym_id, user_id, weekday, starts_at);

CREATE TABLE staff_tasks (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assigned_to_user_id uuid REFERENCES users(id),
  status text NOT NULL CHECK (status IN ('todo', 'in_progress', 'done', 'archived')),
  due_at timestamptz,
  completed_at timestamptz,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX staff_tasks_gym_status_idx ON staff_tasks (gym_id, status, created_at DESC);
CREATE INDEX staff_tasks_assigned_to_idx ON staff_tasks (assigned_to_user_id, due_at);
