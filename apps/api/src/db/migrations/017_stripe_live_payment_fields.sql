ALTER TABLE stripe_payment_transactions
  ADD COLUMN IF NOT EXISTS stripe_client_secret text;
