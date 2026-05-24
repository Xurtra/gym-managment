ALTER TABLE roles
  ADD COLUMN creates_reservable_resource boolean NOT NULL DEFAULT false;

UPDATE roles
SET creates_reservable_resource = true,
    updated_at = now()
WHERE is_system = true
  AND name = 'trainer';

ALTER TABLE reservable_resources
  ALTER COLUMN location_id DROP NOT NULL,
  ADD COLUMN linked_staff_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN created_from_role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  ADD COLUMN auto_managed boolean NOT NULL DEFAULT false;

ALTER TABLE facility_reservations
  ADD COLUMN location_id uuid REFERENCES locations(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX reservable_resources_active_staff_link_idx
  ON reservable_resources(gym_id, linked_staff_user_id)
  WHERE linked_staff_user_id IS NOT NULL AND status <> 'archived';

INSERT INTO reservable_resources (
  id,
  gym_id,
  location_id,
  parent_resource_id,
  name,
  resource_type,
  status,
  is_bookable,
  is_exclusive,
  capacity,
  amenities,
  rentable_hours,
  slot_rules,
  pricing,
  payment_requirement,
  confirmation_mode,
  cancellation_policy,
  linked_staff_user_id,
  created_from_role_id,
  auto_managed,
  archived_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  gym_users.gym_id,
  NULL,
  NULL,
  trim(users.first_name || ' ' || users.last_name),
  lower(regexp_replace(roles.name, '[^a-zA-Z0-9]+', '_', 'g')),
  'active',
  true,
  true,
  1,
  '[]'::jsonb,
  NULL,
  '{"minDurationMinutes":30,"maxDurationMinutes":120,"incrementMinutes":30,"bufferBeforeMinutes":0,"bufferAfterMinutes":0}'::jsonb,
  '{"amountCents":0}'::jsonb,
  'free',
  'automatic',
  '{"cutoffMinutes":0,"feeCents":0}'::jsonb,
  gym_users.user_id,
  roles.id,
  true,
  NULL,
  now(),
  now()
FROM gym_users
JOIN roles ON roles.id = gym_users.role_id
JOIN users ON users.id = gym_users.user_id
WHERE gym_users.status = 'active'
  AND roles.creates_reservable_resource = true
  AND NOT EXISTS (
    SELECT 1
    FROM reservable_resources existing
    WHERE existing.gym_id = gym_users.gym_id
      AND existing.linked_staff_user_id = gym_users.user_id
      AND existing.status <> 'archived'
  );
