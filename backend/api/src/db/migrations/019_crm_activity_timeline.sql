CREATE TABLE crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  consumer_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (
    activity_type IN (
      'note',
      'call',
      'email',
      'text',
      'reply',
      'tour_booked',
      'tour_completed',
      'trial_started',
      'trial_attended',
      'follow_up',
      'follow_up_outcome',
      'cancellation_reason'
    )
  ),
  title text NOT NULL,
  description text,
  outcome text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  follow_up_at timestamptz,
  created_by_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX crm_activities_gym_consumer_idx
  ON crm_activities(gym_id, consumer_id, occurred_at DESC, created_at DESC);

CREATE INDEX crm_activities_follow_up_idx
  ON crm_activities(gym_id, follow_up_at)
  WHERE follow_up_at IS NOT NULL;
