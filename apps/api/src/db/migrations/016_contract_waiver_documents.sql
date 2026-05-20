CREATE TABLE contract_waiver_documents (
  id uuid PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('contract', 'waiver')),
  version integer NOT NULL CHECK (version > 0),
  requires_signature boolean NOT NULL DEFAULT true,
  signed_member_count integer NOT NULL DEFAULT 0 CHECK (signed_member_count >= 0),
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE UNIQUE INDEX contract_waiver_documents_unique_active_version_idx
  ON contract_waiver_documents (gym_id, lower(title), version)
  WHERE archived_at IS NULL;

CREATE INDEX contract_waiver_documents_gym_idx
  ON contract_waiver_documents (gym_id, archived_at, title);
