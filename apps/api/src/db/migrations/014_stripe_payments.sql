CREATE TABLE stripe_payment_accounts (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL UNIQUE REFERENCES gyms(id) ON DELETE CASCADE,
  stripe_account_id text NOT NULL UNIQUE,
  onboarding_complete boolean NOT NULL DEFAULT false,
  charges_enabled boolean NOT NULL DEFAULT false,
  payouts_enabled boolean NOT NULL DEFAULT false,
  requirements_currently_due jsonb NOT NULL DEFAULT '[]'::jsonb,
  dashboard_url text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE stripe_payment_transactions (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  stripe_account_id text,
  stripe_payment_intent_id text,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL,
  application_fee_cents integer NOT NULL DEFAULT 0 CHECK (application_fee_cents >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('card_reader', 'manual_entry')),
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  note text,
  receipt_email text,
  refunded_amount_cents integer NOT NULL DEFAULT 0 CHECK (refunded_amount_cents >= 0),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX stripe_payment_transactions_gym_created_idx
  ON stripe_payment_transactions (gym_id, created_at DESC);
CREATE INDEX stripe_payment_transactions_member_idx
  ON stripe_payment_transactions (member_id, created_at DESC);
