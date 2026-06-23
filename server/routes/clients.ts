import { Router } from 'express'
import { z } from 'zod'
import { withCtx } from '../db'
import { asyncHandler, errors, validate } from '../http'
import { authenticate, requirePermission, tenantScope, paramScope } from '../middleware'

export const clientsRouter = Router()
clientsRouter.use(authenticate)

const clientBody = z.object({
  name: z.string().min(1),
  code: z.string().min(1).nullish(),
  contact: z.record(z.string(), z.any()).default({}),
})

// POST /clients
clientsRouter.post(
  '/clients',
  requirePermission('client.manage', tenantScope),
  asyncHandler(async (req, res) => {
    const b = validate(clientBody, req.body)
    const r = await withCtx(req.ctx, (q) =>
      q(
        `INSERT INTO clients (tenant_id, name, code, contact, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$5)
         RETURNING id, name, code, contact, created_at`,
        [req.user!.tid, b.name, b.code ?? null, b.contact, req.user!.id],
      ),
    ).catch((e) => {
      if (e?.code === '23505') throw errors.conflict('A client with this code already exists.')
      throw e
    })
    res.status(201).json({ client: r.rows[0] })
  }),
)

// GET /clients  (RLS scopes to tenant; sub-tenant list-scoping deferred — see note)
clientsRouter.get(
  '/clients',
  requirePermission('client.view', tenantScope),
  asyncHandler(async (req, res) => {
    const r = await withCtx(req.ctx, (q) =>
      q(`SELECT id, name, code, contact, created_at FROM clients
         WHERE deleted_at IS NULL ORDER BY created_at DESC`),
    )
    res.json({ data: r.rows, page: { next_cursor: null, has_more: false } })
  }),
)

// GET /clients/:clientId
clientsRouter.get(
  '/clients/:clientId',
  requirePermission('client.view', paramScope('client', 'clientId')),
  asyncHandler(async (req, res) => {
    const r = await withCtx(req.ctx, (q) =>
      q(`SELECT id, name, code, contact, created_at, updated_at FROM clients
         WHERE id = $1 AND deleted_at IS NULL`, [req.params.clientId]),
    )
    if (!r.rowCount) throw errors.notFound('Client not found.')
    res.json({ client: r.rows[0] })
  }),
)

// PATCH /clients/:clientId
clientsRouter.patch(
  '/clients/:clientId',
  requirePermission('client.manage', paramScope('client', 'clientId')),
  asyncHandler(async (req, res) => {
    const b = validate(clientBody.partial(), req.body)
    const r = await withCtx(req.ctx, (q) =>
      q(
        `UPDATE clients SET
           name    = COALESCE($2, name),
           code    = COALESCE($3, code),
           contact = COALESCE($4, contact),
           updated_by = $5
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING id, name, code, contact, updated_at`,
        [req.params.clientId, b.name ?? null, b.code ?? null, b.contact ?? null, req.user!.id],
      ),
    )
    if (!r.rowCount) throw errors.notFound('Client not found.')
    res.json({ client: r.rows[0] })
  }),
)

// DELETE /clients/:clientId  (soft)
clientsRouter.delete(
  '/clients/:clientId',
  requirePermission('client.manage', paramScope('client', 'clientId')),
  asyncHandler(async (req, res) => {
    const r = await withCtx(req.ctx, (q) =>
      q(`UPDATE clients SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`, [
        req.params.clientId,
      ]),
    )
    if (!r.rowCount) throw errors.notFound('Client not found.')
    res.status(204).end()
  }),
)
