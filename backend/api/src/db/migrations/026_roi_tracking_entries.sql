CREATE TABLE roi_tracking_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('campaign', 'weekly_action')),
  source_id text NOT NULL,
  source_label text NOT NULL,
  bookings_generated integer NOT NULL DEFAULT 0,
  revenue_generated_cents integer NOT NULL DEFAULT 0,
  memberships_sold integer NOT NULL DEFAULT 0,
  packages_sold integer NOT NULL DEFAULT 0,
  notes text,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_roi_tracking_entries_gym_id ON roi_tracking_entries(gym_id);
CREATE INDEX idx_roi_tracking_entries_source ON roi_tracking_entries(source_type, source_id);
CREATE INDEX idx_roi_tracking_entries_created_at ON roi_tracking_entries(created_at);
