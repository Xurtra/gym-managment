CREATE TABLE campaign_layer_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  campaign_type text NOT NULL CHECK (
    campaign_type IN (
      'unused_credit_reminder',
      'inactive_member_win_back',
      'first_visit_follow_up',
      'off_peak_room_fill',
      'premium_program_launch',
      'review_request',
      'membership_upgrade'
    )
  ),
  name text NOT NULL,
  target_segment text NOT NULL,
  sms_message text NOT NULL,
  email_subject text NOT NULL,
  email_body text NOT NULL,
  recommended_send_time timestamptz NOT NULL,
  expected_goal text NOT NULL,
  estimated_revenue_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'queued', 'sent', 'archived')),
  delivery_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_layer_campaigns_gym_id ON campaign_layer_campaigns(gym_id);
CREATE INDEX idx_campaign_layer_campaigns_type ON campaign_layer_campaigns(campaign_type);
CREATE INDEX idx_campaign_layer_campaigns_status ON campaign_layer_campaigns(status);
CREATE INDEX idx_campaign_layer_campaigns_created_at ON campaign_layer_campaigns(created_at);
