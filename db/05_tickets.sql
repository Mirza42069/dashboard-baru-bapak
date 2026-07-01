-- Migration: per-project tickets. A ticket flags something going wrong on a
-- project (independent of BoQ/progress). Any open/in_progress ticket marks the
-- project as "problematic" on the dashboard. Idempotent for a live database.
BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        CREATE TYPE ticket_status AS ENUM ('open','in_progress','resolved','closed');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS tickets (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            uuid          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id           uuid          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    number               int           NOT NULL,               -- per-project "#12"
    title                text          NOT NULL,               -- what's going wrong
    description          text,
    responsible_name     text,                                 -- who's responsible
    responsible_contact  text,                                 -- how to reach them
    status               ticket_status NOT NULL DEFAULT 'open',
    created_by           uuid REFERENCES users(id),            -- reported-by
    resolved_at          timestamptz,
    created_at           timestamptz   NOT NULL DEFAULT now(), -- issue date
    updated_at           timestamptz   NOT NULL DEFAULT now(),
    deleted_at           timestamptz,
    UNIQUE (project_id, number)
);
CREATE INDEX IF NOT EXISTS idx_tickets_project ON tickets(project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_open ON tickets(project_id)
    WHERE deleted_at IS NULL AND status IN ('open','in_progress');

-- RLS: identical tenant_isolation shape to every other tenant-scoped table.
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets FORCE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tickets' AND policyname = 'tenant_isolation'
    ) THEN
        CREATE POLICY tenant_isolation ON tickets
            USING      (fn_is_platform_admin()
                        OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
            WITH CHECK (fn_is_platform_admin()
                        OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
    END IF;
END $$;

-- The blanket app_rls grant in 01_schema only covered tables that existed then.
GRANT SELECT, INSERT, UPDATE, DELETE ON tickets TO app_rls;

-- Permissions, mirroring boq.*: field engineers & managers edit, everyone views.
INSERT INTO permissions (key, category, description) VALUES
 ('ticket.view', 'Tickets', 'View project tickets'),
 ('ticket.edit', 'Tickets', 'Create and update tickets')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, k FROM roles r, unnest(ARRAY['ticket.view','ticket.edit']) k
WHERE r.tenant_id IS NULL AND r.key IN ('admin','project_manager','field_engineer')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, 'ticket.view' FROM roles r
WHERE r.tenant_id IS NULL AND r.key = 'viewer'
ON CONFLICT DO NOTHING;

COMMIT;
