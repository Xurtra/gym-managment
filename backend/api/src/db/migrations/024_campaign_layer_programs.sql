CREATE TABLE campaign_layer_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  target_audience text NOT NULL,
  included_services_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_price_cents integer NOT NULL DEFAULT 0,
  capacity integer NOT NULL DEFAULT 1,
  schedule text NOT NULL,
  duration_weeks integer NOT NULL DEFAULT 1,
  campaign_copy text NOT NULL,
  post_program_upsell text NOT NULL,
  source_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_layer_programs_gym_id ON campaign_layer_programs(gym_id);
CREATE INDEX idx_campaign_layer_programs_status ON campaign_layer_programs(status);
CREATE INDEX idx_campaign_layer_programs_created_at ON campaign_layer_programs(created_at);
