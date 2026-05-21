CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  barcode text,
  status text NOT NULL CHECK (status IN ('lead', 'trial', 'active', 'past_due', 'frozen', 'cancelled', 'expired', 'archived')),
  emergency_contact jsonb,
  notes text,
  tag_names jsonb NOT NULL DEFAULT '[]'::jsonb,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gym_id, email),
  UNIQUE (gym_id, barcode)
);

CREATE TABLE membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  billing_interval text NOT NULL CHECK (billing_interval IN ('monthly', 'yearly', 'one_time', 'package')),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  signup_fee_cents integer NOT NULL DEFAULT 0 CHECK (signup_fee_cents >= 0),
  trial_days integer NOT NULL DEFAULT 0 CHECK (trial_days >= 0),
  auto_renew boolean NOT NULL DEFAULT true,
  contract_length_months integer CHECK (contract_length_months >= 0),
  class_access_limit integer CHECK (class_access_limit >= 0),
  is_public boolean NOT NULL DEFAULT true,
  status text NOT NULL CHECK (status IN ('active', 'archived')),
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gym_id, name)
);

CREATE TABLE class_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  default_duration_minutes integer NOT NULL CHECK (default_duration_minutes > 0),
  default_capacity integer NOT NULL CHECK (default_capacity > 0),
  default_waitlist_capacity integer NOT NULL DEFAULT 0 CHECK (default_waitlist_capacity >= 0),
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gym_id, name)
);

CREATE TABLE class_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  class_type_id uuid NOT NULL REFERENCES class_types(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  trainer_user_id uuid REFERENCES users(id),
  room_name text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  waitlist_capacity integer NOT NULL DEFAULT 0 CHECK (waitlist_capacity >= 0),
  status text NOT NULL CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX members_gym_id_status_idx ON members(gym_id, status);
CREATE INDEX membership_plans_gym_id_status_idx ON membership_plans(gym_id, status);
CREATE INDEX class_types_gym_id_idx ON class_types(gym_id);
CREATE INDEX class_sessions_gym_id_starts_at_idx ON class_sessions(gym_id, starts_at);
CREATE INDEX class_sessions_location_id_starts_at_idx ON class_sessions(location_id, starts_at);
