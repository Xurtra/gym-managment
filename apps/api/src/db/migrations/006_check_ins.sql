CREATE TABLE check_ins (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  class_session_id uuid REFERENCES class_sessions(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES class_bookings(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('allowed', 'denied')),
  method text NOT NULL CHECK (method IN ('staff_manual', 'barcode', 'qr_code')),
  denied_reason text,
  staff_override boolean NOT NULL DEFAULT false,
  override_reason text,
  checked_in_at timestamptz NOT NULL,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX check_ins_gym_idx ON check_ins (gym_id, checked_in_at);
CREATE INDEX check_ins_member_idx ON check_ins (member_id, checked_in_at);
CREATE INDEX check_ins_class_session_idx ON check_ins (class_session_id);
