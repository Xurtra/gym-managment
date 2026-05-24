CREATE UNIQUE INDEX members_gym_id_email_unique_idx
  ON members (gym_id, lower(email))
  WHERE email IS NOT NULL
    AND status != 'archived'
    AND record_status != 'archived';

CREATE UNIQUE INDEX members_gym_id_barcode_unique_idx
  ON members (gym_id, barcode)
  WHERE barcode IS NOT NULL
    AND status != 'archived'
    AND record_status != 'archived';
