CREATE TABLE IF NOT EXISTS member_portal_tokens (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  purpose text NOT NULL CHECK (purpose IN ('setup', 'reset')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS member_portal_tokens_member_id_idx
  ON member_portal_tokens(member_id);

CREATE INDEX IF NOT EXISTS member_portal_tokens_gym_id_idx
  ON member_portal_tokens(gym_id);
