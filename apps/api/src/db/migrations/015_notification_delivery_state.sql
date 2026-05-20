ALTER TABLE notification_events
  ADD COLUMN sent_at timestamptz,
  ADD COLUMN failed_at timestamptz,
  ADD COLUMN failure_reason text;

CREATE INDEX notification_events_delivery_idx
  ON notification_events (gym_id, status, created_at DESC);
