CREATE TABLE access_devices (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  device_type text NOT NULL CHECK (device_type IN ('door_controller', 'kiosk')),
  status text NOT NULL CHECK (status IN ('active', 'offline', 'disabled')),
  api_key_hash text NOT NULL UNIQUE,
  api_key_preview text NOT NULL,
  last_heartbeat_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  rotated_at timestamptz
);

CREATE TABLE access_rules (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  plan_id uuid REFERENCES membership_plans(id) ON DELETE CASCADE,
  allow_all_active_members boolean NOT NULL DEFAULT false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (plan_id IS NOT NULL OR allow_all_active_members = true),
  CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE access_events (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  device_id uuid NOT NULL REFERENCES access_devices(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  decision text NOT NULL CHECK (decision IN ('unlock', 'deny')),
  reason text NOT NULL,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE INDEX access_devices_gym_idx ON access_devices (gym_id);
CREATE INDEX access_devices_location_idx ON access_devices (location_id);
CREATE INDEX access_rules_gym_location_idx ON access_rules (gym_id, location_id);
CREATE INDEX access_events_gym_occurred_idx ON access_events (gym_id, occurred_at DESC);
CREATE INDEX access_events_member_idx ON access_events (member_id, occurred_at DESC);
