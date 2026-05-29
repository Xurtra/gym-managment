CREATE TABLE weekly_revenue_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  summary text NOT NULL,
  revenue_leaks_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_estimated_revenue_cents integer NOT NULL DEFAULT 0,
  actions_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gym_id, week_start_date)
);

CREATE INDEX idx_weekly_revenue_plans_gym_id ON weekly_revenue_plans(gym_id);
CREATE INDEX idx_weekly_revenue_plans_week_start ON weekly_revenue_plans(week_start_date);
