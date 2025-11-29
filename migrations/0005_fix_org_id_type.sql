-- 1. Dodaj novu UUID kolonu
ALTER TABLE organizations ADD COLUMN id_new UUID DEFAULT gen_random_uuid();

-- 2. Kopiraj postojeće ID-jeve (ako su već UUID format)
UPDATE organizations SET id_new = id::uuid WHERE id IS NOT NULL;

-- 3. Ažuriraj foreign key reference u organization_mappings
ALTER TABLE organization_mappings ADD COLUMN internal_org_id_new UUID;
UPDATE organization_mappings SET internal_org_id_new = internal_org_id::uuid;
ALTER TABLE organization_mappings DROP COLUMN internal_org_id;
ALTER TABLE organization_mappings RENAME COLUMN internal_org_id_new TO internal_org_id;

-- 4. Ažuriraj folders tabelu
ALTER TABLE folders ADD COLUMN organization_id_new UUID;
UPDATE folders SET organization_id_new = organization_id::uuid;
ALTER TABLE folders DROP COLUMN organization_id;
ALTER TABLE folders RENAME COLUMN organization_id_new TO organization_id;

-- 5. Ažuriraj organization_members tabelu
ALTER TABLE organization_members ADD COLUMN organization_id_new UUID;
UPDATE organization_members SET organization_id_new = organization_id::uuid;
ALTER TABLE organization_members DROP COLUMN organization_id;
ALTER TABLE organization_members RENAME COLUMN organization_id_new TO organization_id;

-- 6. Ukloni staru kolonu i preimenuj novu
ALTER TABLE organizations DROP COLUMN id;
ALTER TABLE organizations RENAME COLUMN id_new TO id;

-- 7. Ponovo dodaj primary key
ALTER TABLE organizations ADD PRIMARY KEY (id);