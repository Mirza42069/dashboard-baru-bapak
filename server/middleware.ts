import type { Response, NextFunction } from 'express'
import { Authed, asyncHandler, errors } from './http'
import { verifyAccess } from './auth/crypto'
import { withCtx } from './db'

export type ScopeType = 'tenant' | 'client' | 'project'

// Tenant auth: verify the Bearer JWT and set the tenant trust plane.
// Session revocation is bounded by the 15-min access TTL (logout kills refresh);
// ponytail: instant revocation would need a per-request session check or denylist.
export const authenticate = asyncHandler(async (req, _res, next) => {
  const claims = readBearer(req)
  if (!claims || claims.typ !== 'tenant') throw errors.unauth()
  req.user = { id: claims.sub, tid: claims.tid, sid: claims.sid }
  req.ctx = { kind: 'tenant', tenantId: claims.tid, userId: claims.sub }
  next()
})

export const authenticatePlatform = asyncHandler(async (req, _res, next) => {
  const claims = readBearer(req)
  if (!claims || claims.typ !== 'platform') throw errors.unauth()
  req.admin = { id: claims.sub, sid: claims.sid, role: claims.role }
  req.ctx = { kind: 'platform', platformAdminId: claims.sub }
  next()
})

function readBearer(req: Authed) {
  const h = req.header('authorization')
  if (!h?.startsWith('Bearer ')) return null
  try {
    return verifyAccess(h.slice(7))
  } catch {
    return null
  }
}

// Where the guard reads the scope id from the request.
export type ScopeSpec = (req: Authed) => { type: ScopeType; id: string | null }
export const tenantScope: ScopeSpec = () => ({ type: 'tenant', id: null })
export const paramScope =
  (type: 'client' | 'project', param: string): ScopeSpec =>
  (req) => ({ type, id: req.params[param] })

// API.md §3.3 — ask the DB whether the user holds the permission at a covering scope.
export function requirePermission(perm: string, scope: ScopeSpec) {
  return asyncHandler(async (req: Authed, _res: Response, next: NextFunction) => {
    const { type, id } = scope(req)
    const ok = await withCtx(req.ctx, async (q) => {
      const r = await q<{ ok: boolean }>(
        'SELECT fn_user_has_permission($1,$2,$3,$4) AS ok',
        [req.user!.id, perm, type, id],
      )
      return r.rows[0].ok
    })
    if (!ok) throw errors.forbidden(`Missing permission: ${perm}`)
    next()
  })
}
