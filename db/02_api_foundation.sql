-- API foundation — additive layer over 01_schema.sql.
-- Source: API.md §3 (permission guard) + the auth-path / platform-plane gaps
-- discussed for the operator-provisioned flow:
--   platform admin -> creates tenant + tenant admin
--   tenant admin   -> creates members (direct password) -> clients -> projects
-- Nothing here alters existing tables; it adds functions and tightens the
-- platform plane's RLS. Runs after 01_schema.sql on a fresh init.

BEGIN;

-- 1. API.md §3.1 — generalized permission check used by requirePermission(). ----
CREATE OR REPLACE FUNCTION fn_user_has_permission(
    p_user uuid, p_perm text, p_scope_type scope_type, p_scope_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
    SELECT EXISTS (
        SELECT 1
        FROM role_assignments ra
        JOIN role_permissions rp ON rp.role_id = ra.role_id
        WHERE ra.user_id = p_user
          AND rp.permission_key = p_perm
          AND (
                ra.scope_type = 'tenant'                                   -- firm-wide covers all
             OR (p_scope_type = 'client'  AND ra.scope_type = 'client'  AND ra.scope_id = p_scope_id)
             OR (p_scope_type = 'project' AND ra.scope_type = 'project' AND ra.scope_id = p_scope_id)
             OR (p_scope_type = 'project' AND ra.scope_type = 'client'
                 AND ra.scope_id = (SELECT client_id FROM projects WHERE id = p_scope_id))
          )
    );
$$;

-- 2. Auth-path lookups. These run BEFORE any tenant/platform context exists, so
-- RLS would hide the very rows login needs. SECURITY DEFINER (owned by the
-- bootstrapping superuser) bypasses RLS for these narrow, read-only lookups
-- only. The app sets the proper context immediately after.

-- Tenant user login by email.
CREATE OR REPLACE FUNCTION fn_auth_user_by_email(p_email citext)
RETURNS TABLE (id uuid, tenant_id uuid, password_hash text, status user_status,
               full_name text, locked_until timestamptz, failed_login_count int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT id, tenant_id, password_hash, status, full_name, locked_until, failed_login_count
    FROM users WHERE email = p_email;
$$;

-- Platform-admin login by email.
CREATE OR REPLACE FUNCTION fn_auth_platform_admin_by_email(p_email citext)
RETURNS TABLE (id uuid, password_hash text, role platform_admin_role,
               status platform_admin_status, full_name text,
               locked_until timestamptz, failed_login_count int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT id, password_hash, role, status, full_name, locked_until, failed_login_count
    FROM platform_admins WHERE email = p_email;
$$;

-- Tenant refresh-token lookup by hash (cookie presented before context is set).
CREATE OR REPLACE FUNCTION fn_auth_user_refresh(p_hash text)
RETURNS TABLE (token_id uuid, session_id uuid, user_id uuid, tenant_id uuid,
               rt_expires timestamptz, rt_used_at timestamptz, rt_revoked_at timestamptz,
               session_revoked_at timestamptz, session_expires timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT rt.id, s.id, s.user_id, s.tenant_id,
           rt.expires_at, rt.used_at, rt.revoked_at, s.revoked_at, s.expires_at
    FROM refresh_tokens rt
    JOIN user_sessions s ON s.id = rt.session_id
    WHERE rt.token_hash = p_hash;
$$;

-- Platform refresh-token lookup by hash.
CREATE OR REPLACE FUNCTION fn_auth_platform_refresh(p_hash text)
RETURNS TABLE (token_id uuid, session_id uuid, platform_admin_id uuid,
               rt_expires timestamptz, rt_used_at timestamptz, rt_revoked_at timestamptz,
               session_revoked_at timestamptz, session_expires timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT rt.id, s.id, s.platform_admin_id,
           rt.expires_at, rt.used_at, rt.revoked_at, s.revoked_at, s.expires_at
    FROM platform_refresh_tokens rt
    JOIN platform_sessions s ON s.id = rt.session_id
    WHERE rt.token_hash = p_hash;
$$;

-- Lock the SECURITY DEFINER funcs to the app role (not PUBLIC).
REVOKE EXECUTE ON FUNCTION fn_auth_user_by_email(citext)            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION fn_auth_platform_admin_by_email(citext)  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION fn_auth_user_refresh(text)               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION fn_auth_platform_refresh(text)           FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION fn_auth_user_by_email(citext)            TO app_rls;
GRANT  EXECUTE ON FUNCTION fn_auth_platform_admin_by_email(citext)  TO app_rls;
GRANT  EXECUTE ON FUNCTION fn_auth_user_refresh(text)               TO app_rls;
GRANT  EXECUTE ON FUNCTION fn_auth_platform_refresh(text)           TO app_rls;

-- 3. Close the platform-plane hole: 01_schema.sql left platform_admins/sessions/
-- refresh_tokens with RLS OFF, so a tenant-context request could read operator
-- credentials. Gate them on the platform flag. A tenant request (flag unset)
-- now sees nothing; pre-auth lookups go through the SECURITY DEFINER funcs above.
DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['platform_admins','platform_sessions','platform_refresh_tokens'] LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
        EXECUTE format($f$
            CREATE POLICY platform_only ON %I
                USING (fn_is_platform_admin()) WITH CHECK (fn_is_platform_admin())
        $f$, t);
    END LOOP;
END $$;

COMMIT;
