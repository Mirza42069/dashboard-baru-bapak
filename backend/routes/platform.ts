import { Router } from 'express'
import { z } from 'zod'
import { query, withCtx } from '../db'
import { Authed, asyncHandler, errors, validate } from '../http'
import {
  hashPassword,
  verifyPassword,
  newRefreshToken,
  hashRefresh,
  signAccess,
} from '../auth/crypto'
import { authenticatePlatform } from '../middleware'
import { env } from '../env'

export const platformRouter = Router()

const REFRESH_COOKIE = 'platform_refresh_token'
const COOKIE_PATH = '/api/v1/platform/auth'
const cookieOpts = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'strict' as const,
  path: COOKIE_PATH,
  maxAge: env.REFRESH_TTL_S * 1000,
}

// Issue a platform session + first refresh token, return the access token.
async function startSession(res: any, adminId: string, role: string, req: Authed) {
  const { raw, hash } = newRefreshToken()
  const sid = await withCtx({ kind: 'platform', platformAdminId: adminId }, async (q) => {
    const s = await q<{ id: string }>(
      `INSERT INTO platform_sessions (platform_admin_id, user_agent, ip_address, expires_at)
       VALUES ($1,$2,$3, now() + ($4 || ' seconds')::interval) RETURNING id`,
      [adminId, req.header('user-agent') ?? null, req.ip ?? null, env.REFRESH_TTL_S],
    )
    await q(
      `INSERT INTO platform_refresh_tokens (session_id, token_hash, expires_at)
       VALUES ($1,$2, now() + ($3 || ' seconds')::interval)`,
      [s.rows[0].id, hash, env.REFRESH_TTL_S],
    )
    return s.rows[0].id
  })
  res.cookie(REFRESH_COOKIE, raw, cookieOpts)
  return signAccess({ typ: 'platform', sub: adminId, sid, role })
}

// POST /platform/auth/login
platformRouter.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    const { email, password } = validate(
      z.object({ email: z.string().email(), password: z.string().min(1) }),
      req.body,
    )
    const r = await query(`SELECT * FROM fn_auth_platform_admin_by_email($1)`, [email])
    const a = r.rows[0]
    if (!a || a.status !== 'active' || !verifyPassword(password, a.password_hash)) {
      throw errors.unauth('Invalid credentials.')
    }
    const access = await startSession(res, a.id, a.role, req as Authed)
    res.json({ access_token: access, token_type: 'Bearer', expires_in: env.ACCESS_TTL_S })
  }),
)

// POST /platform/auth/refresh  — rotate; reuse of a spent token kills the session.
platformRouter.post(
  '/auth/refresh',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE]
    if (!raw) throw errors.unauth('Missing refresh token.')
    const r = await query(`SELECT * FROM fn_auth_platform_refresh($1)`, [hashRefresh(raw)])
    const t = r.rows[0]
    if (!t || t.session_revoked_at || new Date(t.session_expires) < new Date()) {
      throw errors.unauth('Session expired.')
    }
    if (t.rt_used_at || t.rt_revoked_at || new Date(t.rt_expires) < new Date()) {
      // theft / replay: nuke the session
      await withCtx({ kind: 'platform', platformAdminId: t.platform_admin_id }, (q) =>
        q(`UPDATE platform_sessions SET revoked_at = now() WHERE id = $1`, [t.session_id]),
      )
      throw errors.unauth('Refresh token reuse detected.')
    }
    const { raw: nraw, hash } = newRefreshToken()
    const role = await withCtx(
      { kind: 'platform', platformAdminId: t.platform_admin_id },
      async (q) => {
        const nt = await q<{ id: string }>(
          `INSERT INTO platform_refresh_tokens (session_id, token_hash, expires_at)
           VALUES ($1,$2, now() + ($3 || ' seconds')::interval) RETURNING id`,
          [t.session_id, hash, env.REFRESH_TTL_S],
        )
        await q(`UPDATE platform_refresh_tokens SET used_at = now(), replaced_by = $2 WHERE id = $1`, [
          t.token_id,
          nt.rows[0].id,
        ])
        await q(`UPDATE platform_sessions SET last_seen_at = now() WHERE id = $1`, [t.session_id])
        const a = await q<{ role: string }>(`SELECT role FROM platform_admins WHERE id = $1`, [
          t.platform_admin_id,
        ])
        return a.rows[0].role
      },
    )
    res.cookie(REFRESH_COOKIE, nraw, cookieOpts)
    res.json({
      access_token: signAccess({ typ: 'platform', sub: t.platform_admin_id, sid: t.session_id, role }),
      token_type: 'Bearer',
      expires_in: env.ACCESS_TTL_S,
    })
  }),
)

// POST /platform/auth/logout
platformRouter.post(
  '/auth/logout',
  authenticatePlatform,
  asyncHandler(async (req, res) => {
    await withCtx(req.ctx, (q) =>
      q(`UPDATE platform_sessions SET revoked_at = now() WHERE id = $1`, [req.admin!.sid]),
    )
    res.clearCookie(REFRESH_COOKIE, { path: COOKIE_PATH })
    res.status(204).end()
  }),
)

// GET /platform/auth/me
platformRouter.get(
  '/auth/me',
  authenticatePlatform,
  asyncHandler(async (req, res) => {
    const r = await withCtx(req.ctx, (q) =>
      q(`SELECT id, email, full_name, role, status FROM platform_admins WHERE id = $1`, [
        req.admin!.id,
      ]),
    )
    res.json({ admin: r.rows[0] })
  }),
)

// POST /platform/tenants — provision a firm.
platformRouter.post(
  '/tenants',
  authenticatePlatform,
  asyncHandler(async (req, res) => {
    const body = validate(
      z.object({
        name: z.string().min(1),
        slug: z
          .string()
          .min(1)
          .regex(/^[a-z0-9-]+$/, 'lowercase letters, digits, hyphens only'),
      }),
      req.body,
    )
    const tenant = await withCtx(req.ctx, async (q) => {
      const t = await q(
        `INSERT INTO tenants (name, slug) VALUES ($1,$2) RETURNING id, name, slug, status`,
        [body.name, body.slug],
      )
      await q(
        `INSERT INTO audit_logs (tenant_id, actor_platform_id, action, entity_type, entity_id, after)
         VALUES ($1,$2,'tenant.create','tenant',$1,$3)`,
        [t.rows[0].id, req.admin!.id, t.rows[0]],
      )
      return t.rows[0]
    })
    res.status(201).json({ tenant })
  }),
)

// GET /platform/tenants
platformRouter.get(
  '/tenants',
  authenticatePlatform,
  asyncHandler(async (req, res) => {
    const r = await withCtx(req.ctx, (q) =>
      q(`SELECT id, name, slug, status, owner_user_id, created_at
         FROM tenants ORDER BY created_at DESC`),
    )
    res.json({ data: r.rows, page: { next_cursor: null, has_more: false } })
  }),
)

// POST /platform/tenants/:tenantId/admins — create the firm's tenant admin.
platformRouter.post(
  '/tenants/:tenantId/admins',
  authenticatePlatform,
  asyncHandler(async (req, res) => {
    const body = validate(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        full_name: z.string().min(1),
      }),
      req.body,
    )
    const tenantId = req.params.tenantId
    const result = await withCtx(req.ctx, async (q) => {
      const t = await q(`SELECT id FROM tenants WHERE id = $1`, [tenantId])
      if (!t.rowCount) throw errors.notFound('Tenant not found.')

      const role = await q<{ id: string }>(
        `SELECT id FROM roles WHERE tenant_id IS NULL AND key = 'admin'`,
      )
      const user = await q(
        `INSERT INTO users (tenant_id, email, password_hash, full_name, status, email_verified_at)
         VALUES ($1,$2,$3,$4,'active', now())
         RETURNING id, email, full_name, status`,
        [tenantId, body.email, hashPassword(body.password), body.full_name],
      )
      await q(
        `INSERT INTO role_assignments (tenant_id, user_id, role_id, scope_type, scope_id)
         VALUES ($1,$2,$3,'tenant', NULL)`,
        [tenantId, user.rows[0].id, role.rows[0].id],
      )
      // first admin becomes the firm owner
      await q(`UPDATE tenants SET owner_user_id = $2 WHERE id = $1 AND owner_user_id IS NULL`, [
        tenantId,
        user.rows[0].id,
      ])
      await q(
        `INSERT INTO audit_logs (tenant_id, actor_platform_id, action, entity_type, entity_id)
         VALUES ($1,$2,'tenant.admin.create','user',$3)`,
        [tenantId, req.admin!.id, user.rows[0].id],
      )
      return user.rows[0]
    })
    res.status(201).json({ user: result })
  }),
)
