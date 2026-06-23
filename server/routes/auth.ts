import { Router } from 'express'
import { z } from 'zod'
import { query, withCtx } from '../db'
import { Authed, asyncHandler, errors, validate } from '../http'
import { verifyPassword, newRefreshToken, hashRefresh, signAccess } from '../auth/crypto'
import { authenticate } from '../middleware'
import { env } from '../env'

export const authRouter = Router()

const REFRESH_COOKIE = 'refresh_token'
const COOKIE_PATH = '/api/v1/auth'
const cookieOpts = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'strict' as const,
  path: COOKIE_PATH,
  maxAge: env.REFRESH_TTL_S * 1000,
}
const MAX_FAILED = 5

async function startSession(res: any, userId: string, tid: string, req: Authed) {
  const { raw, hash } = newRefreshToken()
  const sid = await withCtx({ kind: 'tenant', tenantId: tid, userId }, async (q) => {
    const s = await q<{ id: string }>(
      `INSERT INTO user_sessions (tenant_id, user_id, user_agent, ip_address, expires_at)
       VALUES ($1,$2,$3,$4, now() + ($5 || ' seconds')::interval) RETURNING id`,
      [tid, userId, req.header('user-agent') ?? null, req.ip ?? null, env.REFRESH_TTL_S],
    )
    await q(
      `INSERT INTO refresh_tokens (tenant_id, session_id, token_hash, expires_at)
       VALUES ($1,$2,$3, now() + ($4 || ' seconds')::interval)`,
      [tid, s.rows[0].id, hash, env.REFRESH_TTL_S],
    )
    await q(`UPDATE users SET last_login_at = now(), failed_login_count = 0 WHERE id = $1`, [userId])
    return s.rows[0].id
  })
  res.cookie(REFRESH_COOKIE, raw, cookieOpts)
  return signAccess({ typ: 'tenant', sub: userId, tid, sid })
}

// POST /auth/login
authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = validate(
      z.object({ email: z.string().email(), password: z.string().min(1) }),
      req.body,
    )
    const r = await query(`SELECT * FROM fn_auth_user_by_email($1)`, [email])
    const u = r.rows[0]
    if (!u || u.status !== 'active') throw errors.unauth('Invalid credentials.')
    if (u.locked_until && new Date(u.locked_until) > new Date()) {
      throw errors.unauth('Account temporarily locked.')
    }
    if (!verifyPassword(password, u.password_hash)) {
      // count the failure under the user's own tenant context
      await withCtx({ kind: 'tenant', tenantId: u.tenant_id, userId: u.id }, (q) =>
        q(
          `UPDATE users SET failed_login_count = failed_login_count + 1,
             locked_until = CASE WHEN failed_login_count + 1 >= $2
                                 THEN now() + interval '15 minutes' ELSE locked_until END
           WHERE id = $1`,
          [u.id, MAX_FAILED],
        ),
      )
      throw errors.unauth('Invalid credentials.')
    }
    const access = await startSession(res, u.id, u.tenant_id, req as Authed)
    res.json({ access_token: access, token_type: 'Bearer', expires_in: env.ACCESS_TTL_S })
  }),
)

// POST /auth/refresh
authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE]
    if (!raw) throw errors.unauth('Missing refresh token.')
    const r = await query(`SELECT * FROM fn_auth_user_refresh($1)`, [hashRefresh(raw)])
    const t = r.rows[0]
    if (!t || t.session_revoked_at || new Date(t.session_expires) < new Date()) {
      throw errors.unauth('Session expired.')
    }
    const tenantCtx = { kind: 'tenant' as const, tenantId: t.tenant_id, userId: t.user_id }
    if (t.rt_used_at || t.rt_revoked_at || new Date(t.rt_expires) < new Date()) {
      await withCtx(tenantCtx, (q) =>
        q(`UPDATE user_sessions SET revoked_at = now() WHERE id = $1`, [t.session_id]),
      )
      throw errors.unauth('Refresh token reuse detected.')
    }
    const { raw: nraw, hash } = newRefreshToken()
    await withCtx(tenantCtx, async (q) => {
      const nt = await q<{ id: string }>(
        `INSERT INTO refresh_tokens (tenant_id, session_id, token_hash, expires_at)
         VALUES ($1,$2,$3, now() + ($4 || ' seconds')::interval) RETURNING id`,
        [t.tenant_id, t.session_id, hash, env.REFRESH_TTL_S],
      )
      await q(`UPDATE refresh_tokens SET used_at = now(), replaced_by = $2 WHERE id = $1`, [
        t.token_id,
        nt.rows[0].id,
      ])
      await q(`UPDATE user_sessions SET last_seen_at = now() WHERE id = $1`, [t.session_id])
    })
    res.cookie(REFRESH_COOKIE, nraw, cookieOpts)
    res.json({
      access_token: signAccess({ typ: 'tenant', sub: t.user_id, tid: t.tenant_id, sid: t.session_id }),
      token_type: 'Bearer',
      expires_in: env.ACCESS_TTL_S,
    })
  }),
)

// POST /auth/logout
authRouter.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    await withCtx(req.ctx, (q) =>
      q(`UPDATE user_sessions SET revoked_at = now() WHERE id = $1`, [req.user!.sid]),
    )
    res.clearCookie(REFRESH_COOKIE, { path: COOKIE_PATH })
    res.status(204).end()
  }),
)

// GET /auth/me — user, tenant, role assignments, effective permissions by scope.
authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const out = await withCtx(req.ctx, async (q) => {
      const user = (
        await q(`SELECT id, email, full_name, status FROM users WHERE id = $1`, [req.user!.id])
      ).rows[0]
      const tenant = (await q(`SELECT id, name, slug FROM tenants WHERE id = $1`, [req.user!.tid]))
        .rows[0]
      const assignments = (
        await q(
          `SELECT ra.id, r.key AS role, ra.scope_type, ra.scope_id
           FROM role_assignments ra JOIN roles r ON r.id = ra.role_id
           WHERE ra.user_id = $1`,
          [req.user!.id],
        )
      ).rows
      const perms = (
        await q(
          `SELECT DISTINCT ra.scope_type, ra.scope_id, rp.permission_key
           FROM role_assignments ra JOIN role_permissions rp ON rp.role_id = ra.role_id
           WHERE ra.user_id = $1`,
          [req.user!.id],
        )
      ).rows
      const by_scope: Record<string, string[]> = {}
      const tenantPerms: string[] = []
      for (const p of perms) {
        if (p.scope_type === 'tenant') tenantPerms.push(p.permission_key)
        else (by_scope[p.scope_id] ??= []).push(p.permission_key)
      }
      return { user, tenant, assignments, permissions: { tenant: tenantPerms, by_scope } }
    })
    res.json(out)
  }),
)
