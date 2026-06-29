-- Migration: scope boq_items code uniqueness to (version, parent) instead of
-- (version) — the same code may recur under different parents. Run against
-- databases initialized before this change (01_schema.sql already has it).
BEGIN;

DO $$
DECLARE c text;
BEGIN
    SELECT conname INTO c FROM pg_constraint
    WHERE conrelid = 'boq_items'::regclass AND contype = 'u'
      AND pg_get_constraintdef(oid) ILIKE '%(boq_version_id, code)%';
    IF c IS NOT NULL THEN
        EXECUTE format('ALTER TABLE boq_items DROP CONSTRAINT %I', c);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_boq_item_code ON boq_items (boq_version_id, parent_id, code)
    NULLS NOT DISTINCT WHERE deleted_at IS NULL;

COMMIT;
