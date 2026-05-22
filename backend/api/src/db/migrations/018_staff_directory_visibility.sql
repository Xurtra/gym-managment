UPDATE roles
SET permissions = (
  SELECT jsonb_agg(DISTINCT value)
  FROM jsonb_array_elements_text(
    permissions || '["staff:directory_view"]'::jsonb
  ) AS value
)
WHERE name IN ('owner', 'manager', 'trainer', 'front_desk', 'sales', 'accountant');
