CREATE TABLE contract_waiver_assignments (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES contract_waiver_documents(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'signed', 'void')),
  assigned_by_user_id uuid NOT NULL REFERENCES users(id),
  assigned_at timestamptz NOT NULL,
  signed_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE UNIQUE INDEX contract_waiver_assignments_active_unique_idx
  ON contract_waiver_assignments (gym_id, document_id, member_id)
  WHERE status <> 'void';

CREATE INDEX contract_waiver_assignments_gym_idx
  ON contract_waiver_assignments (gym_id, assigned_at DESC);

CREATE INDEX contract_waiver_assignments_member_idx
  ON contract_waiver_assignments (gym_id, member_id, assigned_at DESC);

CREATE TABLE contract_waiver_signatures (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES contract_waiver_assignments(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES contract_waiver_documents(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  document_title text NOT NULL,
  document_version integer NOT NULL CHECK (document_version > 0),
  signer_name text NOT NULL,
  signature_text text NOT NULL,
  signer_ip inet,
  signed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE INDEX contract_waiver_signatures_assignment_idx
  ON contract_waiver_signatures (assignment_id, signed_at DESC);
