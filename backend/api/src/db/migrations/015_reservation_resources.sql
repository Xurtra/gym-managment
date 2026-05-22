CREATE TABLE reservable_resources (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  parent_resource_id uuid REFERENCES reservable_resources(id) ON DELETE SET NULL,
  name text NOT NULL,
  resource_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'archived')),
  is_bookable boolean NOT NULL DEFAULT true,
  is_exclusive boolean NOT NULL DEFAULT true,
  capacity integer NOT NULL DEFAULT 1 CHECK (capacity > 0),
  amenities jsonb NOT NULL DEFAULT '[]'::jsonb,
  rentable_hours jsonb,
  slot_rules jsonb NOT NULL,
  pricing jsonb NOT NULL,
  payment_requirement text NOT NULL CHECK (payment_requirement IN ('free', 'pay_upfront', 'pay_later')),
  confirmation_mode text NOT NULL CHECK (confirmation_mode IN ('automatic', 'staff_approval')),
  cancellation_policy jsonb NOT NULL,
  archived_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE facility_reservations (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES reservable_resources(id) ON DELETE CASCADE,
  allocation_id uuid,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  amount_cents integer NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  payment_requirement text NOT NULL CHECK (payment_requirement IN ('free', 'pay_upfront', 'pay_later')),
  payment_status text NOT NULL CHECK (payment_status IN ('not_required', 'unpaid', 'paid', 'refunded')),
  payment_reference text,
  cancellation_fee_cents integer NOT NULL DEFAULT 0 CHECK (cancellation_fee_cents >= 0),
  refund_amount_cents integer NOT NULL DEFAULT 0 CHECK (refund_amount_cents >= 0),
  cancelled_at timestamptz,
  cancelled_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  cancellation_reason text,
  note text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (ends_at > starts_at)
);

CREATE TABLE resource_allocations (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES reservable_resources(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('class_session', 'facility_reservation')),
  class_session_id uuid REFERENCES class_sessions(id) ON DELETE CASCADE,
  facility_reservation_id uuid REFERENCES facility_reservations(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  buffer_before_minutes integer NOT NULL DEFAULT 0 CHECK (buffer_before_minutes >= 0),
  buffer_after_minutes integer NOT NULL DEFAULT 0 CHECK (buffer_after_minutes >= 0),
  staff_override boolean NOT NULL DEFAULT false,
  override_reason text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (ends_at > starts_at),
  CHECK (
    (source = 'class_session' AND class_session_id IS NOT NULL AND facility_reservation_id IS NULL)
    OR
    (source = 'facility_reservation' AND facility_reservation_id IS NOT NULL AND class_session_id IS NULL)
  )
);

ALTER TABLE facility_reservations
  ADD CONSTRAINT facility_reservations_allocation_id_fkey
  FOREIGN KEY (allocation_id) REFERENCES resource_allocations(id) ON DELETE SET NULL;

CREATE INDEX reservable_resources_gym_location_idx ON reservable_resources(gym_id, location_id);
CREATE INDEX reservable_resources_parent_idx ON reservable_resources(parent_resource_id);
CREATE INDEX resource_allocations_resource_time_idx ON resource_allocations(resource_id, starts_at, ends_at);
CREATE INDEX resource_allocations_gym_time_idx ON resource_allocations(gym_id, starts_at, ends_at);
CREATE INDEX facility_reservations_gym_time_idx ON facility_reservations(gym_id, starts_at, ends_at);
CREATE INDEX facility_reservations_member_idx ON facility_reservations(member_id, starts_at);
