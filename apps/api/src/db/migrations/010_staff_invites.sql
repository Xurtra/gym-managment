CREATE TABLE staff_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  email text NOT NULL,
  role_id uuid NOT NULL REFERENCES roles(id),
  invited_by_user_id uuid NOT NULL REFERENCES users(id),
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX staff_invites_pending_email_idx
  ON staff_invites(gym_id, email)
  WHERE status = 'pending';

CREATE INDEX staff_invites_gym_id_idx ON staff_invites(gym_id);
CREATE INDEX staff_invites_role_id_idx ON staff_invites(role_id);
