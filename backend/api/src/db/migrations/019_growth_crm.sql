ALTER TABLE members
  ADD COLUMN lead_source text,
  ADD COLUMN interest_level text CHECK (interest_level IN ('low', 'medium', 'high')),
  ADD COLUMN assigned_staff_id uuid REFERENCES gym_users(id) ON DELETE SET NULL,
  ADD COLUMN next_follow_up_at timestamptz,
  ADD COLUMN consent_email boolean NOT NULL DEFAULT true,
  ADD COLUMN consent_sms boolean NOT NULL DEFAULT false,
  ADD COLUMN consent_phone boolean NOT NULL DEFAULT true,
  ADD COLUMN contact_preference text CHECK (contact_preference IN ('email', 'sms', 'phone', 'any')),
  ADD COLUMN retention_flag text CHECK (retention_flag IN ('at_risk', 'lapsed', 'churned'));

CREATE INDEX members_gym_next_follow_up_idx ON members(gym_id, next_follow_up_at)
  WHERE next_follow_up_at IS NOT NULL AND lead_stage = 'open';
CREATE INDEX members_gym_retention_flag_idx ON members(gym_id, retention_flag)
  WHERE retention_flag IS NOT NULL;

CREATE TABLE growth_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  consumer_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES gym_users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('call', 'sms', 'email', 'note')),
  notes text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX growth_interactions_consumer_idx
  ON growth_interactions(consumer_id, occurred_at DESC);
CREATE INDEX growth_interactions_gym_idx
  ON growth_interactions(gym_id, occurred_at DESC);
