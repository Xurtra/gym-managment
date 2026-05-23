ALTER TABLE members
  ADD COLUMN record_status text NOT NULL DEFAULT 'active'
    CHECK (record_status IN ('active', 'inactive', 'archived')),
  ADD COLUMN lead_stage text NOT NULL DEFAULT 'none'
    CHECK (lead_stage IN ('none', 'open', 'converted', 'closed'));

UPDATE members
SET lead_stage = 'open',
    status = 'active',
    record_status = 'active'
WHERE status = 'lead';

UPDATE members
SET record_status = 'archived',
    lead_stage = CASE WHEN lead_stage = 'none' THEN 'closed' ELSE lead_stage END
WHERE status = 'archived' OR archived_at IS NOT NULL;

CREATE INDEX members_gym_id_lead_stage_idx ON members(gym_id, lead_stage);
CREATE INDEX members_gym_id_record_status_idx ON members(gym_id, record_status);

UPDATE membership_plans
SET class_access_limit = 1
WHERE billing_interval IN ('one_time', 'package') AND class_access_limit IS NULL;
