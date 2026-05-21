ALTER TABLE class_sessions
  ADD COLUMN cancellation_cutoff_minutes integer NOT NULL DEFAULT 0 CHECK (cancellation_cutoff_minutes >= 0),
  ADD COLUMN late_cancellation_fee_cents integer NOT NULL DEFAULT 0 CHECK (late_cancellation_fee_cents >= 0);

ALTER TABLE class_bookings
  ADD COLUMN source text NOT NULL DEFAULT 'member' CHECK (source IN ('member', 'staff')),
  ADD COLUMN created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN cancelled_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN cancellation_reason text,
  ADD COLUMN is_late_cancellation boolean NOT NULL DEFAULT false,
  ADD COLUMN late_cancellation_fee_cents integer NOT NULL DEFAULT 0 CHECK (late_cancellation_fee_cents >= 0),
  ADD COLUMN staff_override boolean NOT NULL DEFAULT false,
  ADD COLUMN override_reason text;

CREATE TABLE notification_events (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('waitlist_promoted')),
  status text NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  recipient_member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  related_booking_id uuid REFERENCES class_bookings(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX notification_events_gym_idx ON notification_events (gym_id, created_at);
CREATE INDEX notification_events_status_idx ON notification_events (status);
