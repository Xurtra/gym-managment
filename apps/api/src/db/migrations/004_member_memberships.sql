CREATE TABLE member_memberships (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'paused', 'canceled', 'expired')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX member_memberships_gym_idx ON member_memberships (gym_id);
CREATE INDEX member_memberships_member_idx ON member_memberships (member_id, starts_at);
CREATE INDEX member_memberships_plan_idx ON member_memberships (plan_id);
CREATE INDEX member_memberships_status_idx ON member_memberships (status);
