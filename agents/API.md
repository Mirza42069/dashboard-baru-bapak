# API.md — Construction MK Progress Dashboard

REST API surface built on the data model in `BACKEND.md`. This is the foundation: conventions, the auth/session lifecycle, the permission middleware that sits on top of the RBAC tables, the full endpoint catalog with per-endpoint permission gating, and the response shapes for the analytics (S-curve / portfolio) endpoints that are the product's payoff.

---

## 0. Implementation status

> **Updated 2026-06-23.** The build follows an **operator-provisioned** model — a platform admin creates each firm and its first tenant admin — which diverges from parts of this spec that were written for self-serve signup. This section is the source of truth for what is live; the sections below are annotated (➡️) where reality changed. Code lives in `backend/` (Express + `pg`); DB additions in `db/02_api_foundation.sql`.

**Implemented & wired to the live RLS database**
- **Platform-admin plane** (new — see §2.1): `/platform/auth/{login,refresh,logout,me}`, `POST /platform/tenants`, `GET /platform/tenants`, `POST /platform/tenants/{tenantId}/admins`.
- **Tenant auth**: `/auth/{login,refresh,logout,me}`.
- **Members**: `POST /members` (direct password + role), `GET /members`, `POST /members/{userId}/roles`, `DELETE /members/{userId}/roles/{assignmentId}`.
- **Clients**: full CRUD (`/clients`).
- **Projects**: full CRUD (`/projects`).
- **DB**: `fn_user_has_permission` (§3.1), SECURITY DEFINER auth-lookup functions, and RLS lockdown on the `platform_admins/sessions/refresh_tokens` tables.

**Changed from this spec**
- ❌ `POST /auth/register` (self-serve firm signup) — **removed**. Tenants are created by a platform admin (§2.1), never by self-signup. The schema's `tenants` RLS only admits platform-admin writes, so self-serve never worked anyway.
- 🔄 `POST /members/invite` (email invite) → **`POST /members`**: the tenant admin sets the member's email + password directly (status `active`) and assigns a role in one call.
- ➕ The platform-admin plane was absent from this spec (only `BACKEND.md` §9 described it); it is now defined in §2.1.
- 🔒 Per-request auth verifies the **JWT only** (no DB session load); revocation is bounded by the ~15-min access TTL. The §3.2 "load active user + session" step happens at login time, not per request.

**Not yet implemented (deferred)**
- Email-dependent flows: `/auth/verify-email`, `/auth/resend-verification`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password` (no mail sender yet; token tables exist).
- Custom roles (`/roles*`), `/permissions`, `GET|PATCH|DELETE /members/{userId}`, `/projects/{projectId}/members`.
- Everything from **§4.4 BoQ onward**: BoQ, reporting periods, progress, analytics / S-curve, audit-logs, attachments.
- Conventions declared in §1 but **not built**: cursor **pagination** (`limit`/`cursor`), **`Idempotency-Key`**, **rate limits** (`429` / `X-RateLimit-*`), **`If-Match`** concurrency, `sort=`. List endpoints currently return all in-scope rows with a stub `page: { next_cursor: null, has_more: false }`.

**Constraints that still bite**
- `POST /projects` needs an existing `client_id` (schema `NOT NULL`) — create a client first.
- Role wiring: `project_manager` holds `project.manage` but **not** `client.manage`; `field_engineer` / `viewer` cannot create projects. Grant roles accordingly when onboarding members.

---

## 1. Conventions

| Concern | Decision |
|---|---|
| Style | Resource-oriented REST, JSON over HTTPS |
| Base path | `/api/v1` (version in the path; breaking changes bump the major) |
| Content type | `application/json; charset=utf-8` |
| Auth scheme | `Authorization: Bearer <access_token>` (short-lived JWT) + rotating refresh token in an httpOnly cookie |
| Tenant context | **Derived from the token**, never from the URL. One user → one tenant, so there is no `/tenants/{id}/…` prefix. The `tid` claim sets `app.current_tenant_id` for RLS. |
| IDs | UUID strings |
| Timestamps | ISO-8601 UTC (`2025-12-05T09:00:00Z`); dates as `YYYY-MM-DD` |
| Casing | `snake_case` JSON keys |
| Pagination | Cursor-based: `?limit=&cursor=` → `{ data, page: { next_cursor, has_more } }` |
| Filtering / sorting | Resource query params; `sort=field` / `sort=-field` (prefix `-` = desc) |
| Mutations | `POST` create, `PATCH` partial update, `PUT` full replace/upsert, `DELETE` (soft where the schema soft-deletes) |
| Idempotency | `Idempotency-Key` header honored on `POST` creates |
| Rate limits | `429` with `Retry-After`; `X-RateLimit-*` headers on every response |

### 1.1 Error envelope

All non-2xx responses share one shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "details": [{ "field": "email", "issue": "required" }],
    "request_id": "req_01H...."
  }
}
```

| HTTP | `code` | When |
|---|---|---|
| 400 | `BAD_REQUEST` | Malformed request |
| 401 | `UNAUTHENTICATED` | Missing/expired/invalid access token |
| 403 | `FORBIDDEN` | Authenticated but lacks the required permission at this scope |
| 404 | `NOT_FOUND` | Resource absent or invisible under RLS/scope |
| 409 | `CONFLICT` | State conflict (e.g. activating a baseline whose weights ≠ 100%) |
| 422 | `UNPROCESSABLE` | Semantically invalid (e.g. progress on a locked period) |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL` | Unexpected server error |

> A resource the caller can't access returns **404, not 403**, so existence isn't leaked across tenants/scopes. (403 is reserved for cases where the resource is visible but the action isn't allowed.)

### 1.2 List envelope

```json
{
  "data": [ /* resources */ ],
  "page": { "next_cursor": "eyJpZCI6...", "has_more": true }
}
```

---

## 2. Authentication & session lifecycle

All endpoints below are unauthenticated unless noted. The access token is a short-lived JWT; the refresh token is opaque, stored hashed (`refresh_tokens`), and rotated on every use.

**Access token claims**

```json
{ "sub": "<user_id>", "tid": "<tenant_id>", "sid": "<session_id>",
  "iat": 1733300000, "exp": 1733300900 }
```

Lifetimes: access ≈ 15 min, refresh ≈ 30 days (sliding via rotation).

➡️ **Status:** `login` / `refresh` / `logout` / `me` are **implemented**. `register` is **removed** (operator-provisioned — §2.1). All email-dependent rows are **deferred** (no mail sender yet).

| Method | Path | Description | Status |
|---|---|---|---|
| ~~POST~~ | ~~`/auth/register`~~ | ~~Create a new tenant + owner user (firm signup)~~ | ❌ removed — see §2.1 |
| POST | `/auth/login` | Email + password → access token + refresh cookie | ✅ implemented |
| POST | `/auth/refresh` | Rotate refresh token → new access token | ✅ implemented |
| POST | `/auth/logout` | Revoke the current session + refresh chain | ✅ implemented |
| GET  | `/auth/me` | Current user, role assignments, effective permissions *(auth)* | ✅ implemented |
| POST | `/auth/change-password` | Change password for the logged-in user *(auth)* | ⏳ deferred |
| POST | `/auth/verify-email` | Confirm an email-verification token | ⏳ deferred |
| POST | `/auth/resend-verification` | Re-send the verification email | ⏳ deferred |
| POST | `/auth/forgot-password` | Begin password reset (always 202, no user enumeration) | ⏳ deferred |
| POST | `/auth/reset-password` | Set a new password with a reset token | ⏳ deferred |

➡️ **`POST /auth/register` — REMOVED.** Self-serve firm signup is not part of the operator-provisioned model and the schema's `tenants` RLS never permitted it. Firms are created by a platform admin via `POST /platform/tenants` and `POST /platform/tenants/{tenantId}/admins` (§2.1). The original request/response shape is dropped.

**`POST /auth/login`** → returns `{ access_token, token_type: "Bearer", expires_in }` + `Set-Cookie: refresh_token=…; HttpOnly; SameSite=Strict; Path=/api/v1/auth`.
Failures return `401 UNAUTHENTICATED`; repeated failures increment `failed_login_count` and may set `locked_until`.

**`POST /auth/refresh`** (sends refresh cookie) → new access token, new refresh cookie. Reuse of an already-rotated token revokes the whole `user_session` (theft detection) and returns `401`.

**`GET /auth/me`**

```json
{ "user": { "id": "…", "email": "rama@firm.com", "full_name": "Rama" },
  "tenant": { "id": "…", "slug": "konsultan-mk" },
  "assignments": [
    { "role": "project_manager", "scope_type": "project", "scope_id": "proj_…" },
    { "role": "viewer", "scope_type": "client", "scope_id": "cli_…" }
  ],
  "permissions": { "tenant": ["project.view"], "by_scope": { "proj_…": ["boq.edit","progress.approve","…"] } } }
```

### 2.1 Platform-admin plane (operator) ➕ new

Separate identity (`platform_admins`), separate sessions, separate auth subsystem — **not tenant-scoped**. Access tokens carry `{ typ: "platform", sub, sid, role }` and never set a tenant context; cross-tenant reach comes from the `app.is_platform_admin` RLS bypass. Bootstrap the first operator out-of-band with `pnpm api:bootstrap [email] [password] [name]`.

| Method | Path | Description | Status |
|---|---|---|---|
| POST | `/platform/auth/login` | Operator email+password → access token + refresh cookie (`Path=/api/v1/platform/auth`) | ✅ |
| POST | `/platform/auth/refresh` | Rotate the platform refresh token | ✅ |
| POST | `/platform/auth/logout` | Revoke the platform session | ✅ |
| GET  | `/platform/auth/me` | Current operator | ✅ |
| POST | `/platform/tenants` | Create a firm `{ name, slug }` → `201 { tenant }` | ✅ |
| GET  | `/platform/tenants` | List firms | ✅ |
| POST | `/platform/tenants/{tenantId}/admins` | Create the firm's first tenant admin `{ email, password, full_name }`; grants the system `admin` role at `tenant` scope and stamps `tenants.owner_user_id` → `201 { user }` | ✅ |

```
# end-to-end provisioning flow
POST /platform/auth/login                       -> operator access token
POST /platform/tenants {name,slug}              -> { tenant: { id } }
POST /platform/tenants/{id}/admins {email,pw,…} -> tenant admin (can now /auth/login)
```

Tenant lifecycle beyond create (suspend/cancel, list members, deactivate operators) is **deferred**.

---

## 3. Authorization model & middleware

Every protected endpoint declares **(required permission, scope source)**. The guard resolves the scope id from the request, then asks the database whether the user holds that permission at a covering scope.

### 3.1 Generalized permission check (extends `fn_user_project_permissions`)

➡️ **Implemented** as-is in `db/02_api_foundation.sql`; `requirePermission` (`backend/middleware.ts`) calls it inside the request's tenant transaction.

```sql
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
                ra.scope_type = 'tenant'                                   -- firm-wide grant covers all
             OR (p_scope_type = 'client'  AND ra.scope_type = 'client'  AND ra.scope_id = p_scope_id)
             OR (p_scope_type = 'project' AND ra.scope_type = 'project' AND ra.scope_id = p_scope_id)
             OR (p_scope_type = 'project' AND ra.scope_type = 'client'
                 AND ra.scope_id = (SELECT client_id FROM projects WHERE id = p_scope_id))
          )
    );
$$;
```

Coverage rules: a **tenant** grant covers everything; a **client** grant covers that client and every project under it; a **project** grant covers only that project.

### 3.2 Request pipeline

```
1. authenticate         -> verify JWT signature/exp ONLY (no per-request session/DB load;
                           revocation bounded by the ~15-min access TTL)
2. set tenant context   -> SET LOCAL app.current_tenant_id = claims.tid
                                       app.current_user_id  = claims.sub   (per transaction)
3. authorize            -> resolve scope_id from route, call fn_user_has_permission(...)
4. handler              -> business logic; RLS guarantees tenant isolation as a backstop
```

➡️ Each step that touches the DB opens its own `withCtx` transaction with `SET LOCAL` GUCs (`backend/db.ts`). `app.current_user_id` is set but not yet consumed by any policy/trigger — `created_by`/audit actor are written explicitly in handlers.

### 3.3 Guard, framework-agnostic (TS flavor)

```ts
// requirePermission('boq.edit', { scope: 'project', from: p => p.params.projectId })
function requirePermission(perm: string, scope: ScopeSpec) {
  return async (req, res, next) => {
    const scopeId = scope.type === 'tenant' ? null : await scope.from(req);
    const ok = await db.oneFirst(sql`
      SELECT fn_user_has_permission(${req.user.id}, ${perm}, ${scope.type}, ${scopeId})`);
    if (!ok) throw new ForbiddenError(perm);   // -> 403, or 404 if the resource itself is invisible
    next();
  };
}
```

> Two layers defend tenant isolation: this guard (authorization) **and** Postgres RLS (the backstop). Even a handler bug can't read another tenant's rows because `app.current_tenant_id` constrains every query.

### 3.4 List-scoping

For collection endpoints (`GET /projects`, `/portfolio`), permission isn't a yes/no gate on a known id — the result set itself must be filtered to what the caller can see. List handlers join `role_assignments` so a field engineer scoped to two projects sees exactly those two, while a tenant-wide PM sees all. RLS handles the tenant boundary; the join handles the sub-tenant scope.

---

## 4. Endpoint catalog

Permission column = the key passed to `fn_user_has_permission`. Scope = where the guard reads the scope id. `tenant` scope means the grant must be tenant-wide (admin-type actions).

### 4.1 Members & roles (admin)

| Method | Path | Permission | Scope | Status |
|---|---|---|---|---|
| POST | `/members` | `member.manage` | tenant | ✅ create member w/ password + role |
| GET | `/members` | `member.manage` | tenant | ✅ |
| POST | `/members/{userId}/roles` | `member.manage` | tenant | ✅ |
| DELETE | `/members/{userId}/roles/{assignmentId}` | `member.manage` | tenant | ✅ |
| ~~POST~~ | ~~`/members/invite`~~ | `member.manage` | tenant | 🔄 replaced by `POST /members` |
| GET | `/members/{userId}` | `member.manage` | tenant | ⏳ deferred |
| PATCH | `/members/{userId}` | `member.manage` | tenant | ⏳ deferred |
| DELETE | `/members/{userId}` | `member.manage` | tenant | ⏳ deferred |
| GET | `/roles` | `member.manage` | tenant | ⏳ deferred |
| POST | `/roles` | `role.manage` | tenant | ⏳ deferred |
| PATCH | `/roles/{roleId}` | `role.manage` | tenant | ⏳ deferred |
| DELETE | `/roles/{roleId}` | `role.manage` | tenant | ⏳ deferred |
| PUT | `/roles/{roleId}/permissions` | `role.manage` | tenant | ⏳ deferred |
| GET | `/permissions` | *(any authenticated)* | — | ⏳ deferred |

➡️ **`POST /members`** (replaces `/members/invite`) — create a member with a password and an initial role grant in one call:

```json
// request
{ "email": "pm@firm.test", "password": "••••••••", "full_name": "Putri PM",
  "role_key": "project_manager", "scope_type": "tenant", "scope_id": null }
// 201 -> { "user": { id, email, full_name, status: "active", role, assignment } }
```

**`POST /members/{userId}/roles`** — additional granular grant (note: `role_key`, not `role_id`):

```json
// request
{ "role_key": "project_manager", "scope_type": "project", "scope_id": "proj_123" }
// 201 -> the created role_assignment
```

### 4.2 Clients

➡️ **Implemented (full CRUD).** List is tenant-scoped via RLS; sub-tenant list-scoping (§3.4) is deferred — a tenant-wide viewer sees all clients in the firm.

| Method | Path | Permission | Scope |
|---|---|---|---|
| GET | `/clients` | `client.view` | tenant (list-scoped) |
| POST | `/clients` | `client.manage` | tenant |
| GET | `/clients/{clientId}` | `client.view` | client |
| PATCH | `/clients/{clientId}` | `client.manage` | client |
| DELETE | `/clients/{clientId}` | `client.manage` | client |

### 4.3 Projects

➡️ **Implemented**, except `GET /projects/{projectId}/members` (deferred). `POST /projects` requires an existing `client_id`. `GET /projects` supports `?client_id=`, `?status=`, `?q=`; cursor pagination and `sort=` are deferred.

| Method | Path | Permission | Scope | Status |
|---|---|---|---|---|
| GET | `/projects` | `project.view` | tenant (list-scoped) | ✅ |
| POST | `/projects` | `project.manage` | tenant | ✅ |
| GET | `/projects/{projectId}` | `project.view` | project | ✅ |
| PATCH | `/projects/{projectId}` | `project.manage` | project | ✅ |
| DELETE | `/projects/{projectId}` | `project.manage` | project | ✅ soft |
| GET | `/projects/{projectId}/members` | `project.view` | project | ⏳ deferred |

`GET /projects` filters: `?client_id=`, `?status=active`, `?q=` (name/code search), `sort=-created_at`.

```json
// GET /projects?status=active&limit=2
{ "data": [
    { "id": "proj_123", "name": "Gedung H", "code": "GH-01",
      "client": { "id": "cli_9", "name": "Owner PT X" },
      "status": "active", "data_date": "2025-12-05" }
  ],
  "page": { "next_cursor": "eyJ…", "has_more": true } }
```

> ➡️ **§4.4 – §4.8 are NOT YET IMPLEMENTED** (deferred per the agreed scope). BoQ, reporting periods, progress entries, analytics/S-curve, audit-logs, and attachments remain as specified below and are the next build phase. The underlying tables, triggers, and derivation functions already exist in `01_schema.sql`.

### 4.4 BoQ (versions & items)

| Method | Path | Permission | Scope |
|---|---|---|---|
| GET | `/projects/{projectId}/boq-versions` | `boq.view` | project |
| POST | `/projects/{projectId}/boq-versions` | `boq.edit` | project |
| GET | `/boq-versions/{versionId}` | `boq.view` | project |
| GET | `/boq-versions/{versionId}/items` | `boq.view` | project |
| POST | `/boq-versions/{versionId}/items` | `boq.edit` | project |
| PUT | `/boq-versions/{versionId}/items:bulk` | `boq.edit` | project |
| PATCH | `/boq-items/{itemId}` | `boq.edit` | project |
| DELETE | `/boq-items/{itemId}` | `boq.edit` | project |
| POST | `/boq-versions/{versionId}/recalc-weights` | `boq.edit` | project |
| POST | `/boq-versions/{versionId}/activate` | `boq.baseline` | project |
| POST | `/projects/{projectId}/boq-versions/import` | `boq.edit` | project |

Drafts are freely editable; editing items in a non-draft version returns `422`. A variation order = create a new draft cloned from the active version:

```json
// POST /projects/proj_123/boq-versions
{ "title": "VO-01", "clone_from": "ver_active", "reason": "Added basement scope" }
// 201 -> { "id": "ver_new", "version_no": 3, "status": "draft", ... }
```

```json
// PUT /boq-versions/ver_new/items:bulk   (also the target the importer writes to)
{ "items": [
    { "code": "1",   "description": "Preliminaries", "unit": "ls",
      "quantity": 1, "weight": 7.16, "weight_source": "manual",
      "progress_mode": "by_percent", "planned_start": "2025-09-22", "planned_finish": "2027-08-21" },
    { "code": "2.1", "description": "Pekerjaan Struktur", "unit": "m3",
      "parent_code": "2", "quantity": 1850, "unit_rate": 1250000,
      "weight_source": "derived", "progress_mode": "by_quantity",
      "planned_start": "2025-10-04", "planned_finish": "2026-05-02" }
  ] }
```

```json
// POST /boq-versions/ver_new/activate
// 200 -> { "id": "ver_new", "status": "active", "baselined_at": "…" }
// 409 CONFLICT if leaf weights ≠ ~100% -> { "error": { "code": "CONFLICT",
//        "message": "Leaf weights must sum to ~100% (got 92.4%)." } }
```

### 4.5 Reporting periods

| Method | Path | Permission | Scope |
|---|---|---|---|
| GET | `/projects/{projectId}/periods` | `progress.view` | project |
| POST | `/projects/{projectId}/periods:generate` | `project.manage` | project |
| GET | `/periods/{periodId}` | `progress.view` | project |
| POST | `/periods/{periodId}/submit` | `progress.submit` | project |
| POST | `/periods/{periodId}/approve` | `progress.approve` | project |
| POST | `/periods/{periodId}/reopen` | `progress.approve` | project |

`approve` runs `fn_refresh_period_summary`, advances `projects.data_date`, and locks subsequent edits. `reopen` is audited.

### 4.6 Progress entries

| Method | Path | Permission | Scope |
|---|---|---|---|
| GET | `/periods/{periodId}/progress` | `progress.view` | project |
| PUT | `/periods/{periodId}/progress/{itemId}` | `progress.submit` | project |
| PUT | `/periods/{periodId}/progress:bulk` | `progress.submit` | project |

Progress is **cumulative-to-date**; the server computes `pct_complete` from the item's mode and the weekly delta from the prior period.

```json
// PUT /periods/per_05/progress:bulk
{ "entries": [
    { "boq_item_id": "itm_struktur", "cumulative_quantity": 740 },   // by_quantity item
    { "boq_item_id": "itm_prelim",   "cumulative_percent": 35 }      // by_percent item
  ] }
```
```json
// 200
{ "data": [
    { "boq_item_id": "itm_struktur", "cumulative_quantity": 740, "pct_complete": 40.0 },
    { "boq_item_id": "itm_prelim",   "cumulative_percent": 35,   "pct_complete": 35.0 }
  ] }
// 422 if the period is locked/approved.
```

### 4.7 Analytics & dashboards (the payoff)

| Method | Path | Permission | Scope | Returns |
|---|---|---|---|---|
| GET | `/projects/{projectId}/s-curve` | `progress.view` | project | planned vs actual series |
| GET | `/projects/{projectId}/summary` | `progress.view` | project | current status |
| GET | `/projects/{projectId}/boq-progress` | `progress.view` | project | per-item planned/actual table |
| GET | `/projects/{projectId}/laggards` | `progress.view` | project | items ranked by schedule drag |
| GET | `/portfolio` | `project.view` | tenant (list-scoped) | all accessible projects + status |

**`GET /projects/{projectId}/s-curve`** — backs the kurva-S chart. `actual_cum` is `null` past `data_date` so the line stops cleanly instead of dropping to zero.

```json
{ "project_id": "proj_123", "baseline_version": 2, "data_date": "2025-12-05",
  "series": [
    { "period_index": 1, "end_date": "2025-09-26", "planned_cum": 0.07, "actual_cum": 0.99,
      "planned_weekly": 0.07, "actual_weekly": 0.99, "deviation": 0.92 },
    { "period_index": 11, "end_date": "2025-12-05", "planned_cum": 8.77, "actual_cum": 19.55,
      "planned_weekly": 0.96, "actual_weekly": 7.74, "deviation": 10.78 },
    { "period_index": 12, "end_date": "2025-12-12", "planned_cum": 9.73, "actual_cum": null,
      "planned_weekly": 0.96, "actual_weekly": null, "deviation": null }
  ] }
```

**`GET /projects/{projectId}/summary`**

```json
{ "project_id": "proj_123", "as_of": "2025-12-05",
  "planned_cum": 8.77, "actual_cum": 19.55,
  "deviation": 10.78, "schedule_ratio": 2.23, "schedule_status": "ahead" }
```

**`GET /projects/{projectId}/laggards?limit=10`** — drag = `weight × (planned_pct − actual_pct) / 100`, so it answers "fix this first," not "here are 40 behind items."

```json
{ "as_of": "2025-12-05",
  "items": [
    { "code": "2.3", "description": "Pekerjaan MEP", "weight": 28.73,
      "planned_pct": 22.0, "actual_pct": 9.0, "schedule_drag": 3.73 }
  ] }
```

**`GET /portfolio`** — the centralization view. Filters: `?client_id=`, `?schedule_status=behind`, `?status=active`, `sort=deviation` (most-behind first).

```json
{ "data": [
    { "project_id": "proj_777", "name": "Gedung E", "client": { "id": "cli_9", "name": "Owner PT X" },
      "actual_cum": 41.2, "planned_cum": 48.0, "deviation": -6.8, "schedule_ratio": 0.86,
      "schedule_status": "behind", "as_of": "2025-12-05" }
  ],
  "page": { "next_cursor": null, "has_more": false } }
```

### 4.8 Audit & attachments

| Method | Path | Permission | Scope |
|---|---|---|---|
| GET | `/audit-logs` | `tenant.manage` | tenant |
| POST | `/attachments` | `progress.submit` | project (via entity) |
| GET | `/attachments` | `progress.view` | project (via entity) |
| DELETE | `/attachments/{id}` | `progress.submit` | project (via entity) |

`GET /audit-logs` filters: `?entity_type=`, `?entity_id=`, `?actor_id=`, `?from=`, `?to=`.
`POST /attachments` returns a presigned upload URL + a registered `attachments` row; files go straight to object storage, the DB stores only the `storage_key`. *(An `audit.view` permission can be added later if audit access should be decoupled from `tenant.manage`.)*

---

## 5. Cross-cutting behaviors

- **Validation** errors aggregate into `details[]` (422/400) rather than failing on the first field.
- **Concurrency**: mutable resources accept `If-Match` against an `updated_at`/version; mismatch → `409`.
- **Soft deletes**: `DELETE` on clients/projects/boq-items sets `deleted_at`; they vanish from lists but remain for history and audit.
- **Time zone**: all reads/writes are UTC; the client localizes. Period dates are plain dates (no TZ).
- **Webhooks** (future): tenant-configurable callbacks on `period.approved`, `boq.baselined`, `project.status_changed`.

---

## 6. Out of scope / future

- **Excel import pipeline** behind `POST /projects/{projectId}/boq-versions/import` — accepts the uploaded schedule sheet, maps rows to items, regenerates the planned curve, returns a dry-run diff before commit.
- **Report exports** — `GET /projects/{projectId}/report?format=pdf|xlsx` (weekly progress report, formatted multi-tab sheet).
- **Notifications** — in-app + email digests for behind-schedule and pending-approval states.
- **EVM/cost layer** — value-based earned value (CPI, forecast-at-completion) once `unit_rate` coverage is reliable.
- **SSO/OIDC** — additive to the system-owned auth, if enterprise tenants need it.
- **Bulk/portfolio export** of the dashboard data for BI tools.
