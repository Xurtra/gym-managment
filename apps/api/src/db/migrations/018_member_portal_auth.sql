ALTER TABLE members
  ADD COLUMN IF NOT EXISTS portal_password_hash text,
  ADD COLUMN IF NOT EXISTS portal_enabled_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_portal_login_at timestamptz;

CREATE TABLE IF NOT EXISTS member_refresh_tokens (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  replaced_by_token_id uuid REFERENCES member_refresh_tokens(id),
  created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS member_refresh_tokens_member_id_idx
  ON member_refresh_tokens(member_id);

CREATE INDEX IF NOT EXISTS member_refresh_tokens_gym_id_idx
  ON member_refresh_tokens(gym_id);
