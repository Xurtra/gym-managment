CREATE TABLE stripe_subscriptions (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
  stripe_account_id text,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  stripe_checkout_session_id text UNIQUE,
  status text NOT NULL CHECK (status IN ('incomplete', 'trialing', 'active', 'past_due', 'paused', 'canceled', 'expired')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX stripe_subscriptions_gym_idx ON stripe_subscriptions (gym_id);
CREATE INDEX stripe_subscriptions_member_idx ON stripe_subscriptions (member_id);
CREATE INDEX stripe_subscriptions_plan_idx ON stripe_subscriptions (plan_id);
CREATE INDEX stripe_subscriptions_status_idx ON stripe_subscriptions (status);
