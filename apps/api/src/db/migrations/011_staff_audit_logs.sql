CREATE TABLE staff_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES users(id),
  target_user_id uuid NOT NULL REFERENCES users(id),
  action text NOT NULL CHECK (action IN ('staff_role_changed', 'staff_access_removed')),
  previous_role_id uuid REFERENCES roles(id),
  next_role_id uuid REFERENCES roles(id),
  previous_status text CHECK (previous_status IN ('active', 'invited', 'disabled')),
  next_status text CHECK (next_status IN ('active', 'invited', 'disabled')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX staff_audit_logs_gym_id_created_at_idx ON staff_audit_logs(gym_id, created_at DESC);
CREATE INDEX staff_audit_logs_target_user_id_idx ON staff_audit_logs(target_user_id);
