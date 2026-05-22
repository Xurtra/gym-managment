ALTER TABLE roles
  ADD COLUMN parent_role_id uuid REFERENCES roles(id);

UPDATE roles child
SET parent_role_id = owner_role.id
FROM roles owner_role
WHERE child.gym_id = owner_role.gym_id
  AND owner_role.name = 'owner'
  AND child.name <> 'owner'
  AND child.parent_role_id IS NULL;

CREATE INDEX roles_parent_role_id_idx ON roles(parent_role_id);
