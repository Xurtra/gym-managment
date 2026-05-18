CREATE TABLE class_bookings (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  class_session_id uuid NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('booked', 'waitlisted', 'cancelled')),
  waitlist_position integer CHECK (waitlist_position IS NULL OR waitlist_position > 0),
  booked_at timestamptz NOT NULL,
  cancelled_at timestamptz,
  promoted_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (
    (status = 'waitlisted' AND waitlist_position IS NOT NULL)
    OR (status <> 'waitlisted' AND waitlist_position IS NULL)
  )
);

CREATE UNIQUE INDEX class_bookings_one_active_per_member_session_idx
  ON class_bookings (class_session_id, member_id)
  WHERE status IN ('booked', 'waitlisted');

CREATE UNIQUE INDEX class_bookings_waitlist_position_idx
  ON class_bookings (class_session_id, waitlist_position)
  WHERE status = 'waitlisted';

CREATE INDEX class_bookings_gym_idx ON class_bookings (gym_id);
CREATE INDEX class_bookings_member_idx ON class_bookings (member_id, created_at);
CREATE INDEX class_bookings_session_status_idx ON class_bookings (class_session_id, status);
