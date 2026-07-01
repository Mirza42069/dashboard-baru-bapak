import { Router } from 'express'
import { z } from 'zod'
import { withCtx } from '../db'
import { asyncHandler, errors, validate } from '../http'
import {
  authenticate,
  requirePermission,
  paramScope,
  tenantScope,
  type ScopeSpec,
} from '../middleware'

export const ticketsRouter = Router()
ticketsRouter.use(authenticate)

const COLS = [
  'id', 'project_id', 'number', 'title', 'description', 'responsible_name',
  'responsible_contact', 'status', 'created_by', 'resolved_at', 'created_at', 'updated_at',
].join(', ')

// A ticket url only carries its own id; resolve the owning project for the scope guard.
const ticketScope: ScopeSpec = (req) =>
  withCtx(req.ctx, async (q) => {
    const r = await q<{ project_id: string }>(
      `SELECT project_id FROM tickets WHERE id = $1 AND deleted_at IS NULL`,
      [req.params.ticketId],
    )
    return r.rows[0]?.project_id ?? null
  }).then((id) => {
    if (!id) throw errors.notFound('Ticket not found.')
    return { type: 'project' as const, id }
  })

// GET /projects/:projectId/tickets — open ones first, newest number first.
ticketsRouter.get(
  '/projects/:projectId/tickets',
  requirePermission('ticket.view', paramScope('project', 'projectId')),
  asyncHandler(async (req, res) => {
    const r = await withCtx(req.ctx, (q) =>
      q(
        `SELECT ${COLS} FROM tickets
         WHERE project_id = $1 AND deleted_at IS NULL
         ORDER BY (status IN ('open','in_progress')) DESC, number DESC`,
        [req.params.projectId],
      ),
    )
    res.json({ data: r.rows, page: { next_cursor: null, has_more: false } })
  }),
)

// GET /tickets — every unresolved ticket in the tenant, for the dashboard feed.
ticketsRouter.get(
  '/tickets',
  requirePermission('ticket.view', tenantScope),
  asyncHandler(async (req, res) => {
    const r = await withCtx(req.ctx, (q) =>
      q(
        `SELECT ${COLS.split(', ').map((c) => 't.' + c).join(', ')}, p.name AS project_name
         FROM tickets t JOIN projects p ON p.id = t.project_id
         WHERE t.deleted_at IS NULL AND t.status IN ('open','in_progress')
         ORDER BY t.created_at DESC`,
      ),
    )
    res.json({ data: r.rows, page: { next_cursor: null, has_more: false } })
  }),
)

const createBody = z.object({
  title: z.string().min(1),
  description: z.string().nullish(),
  responsible_name: z.string().nullish(),
  responsible_contact: z.string().nullish(),
})

// POST /projects/:projectId/tickets — number is the next per-project sequence.
ticketsRouter.post(
  '/projects/:projectId/tickets',
  requirePermission('ticket.edit', paramScope('project', 'projectId')),
  asyncHandler(async (req, res) => {
    const b = validate(createBody, req.body)
    const projectId = req.params.projectId
    const out = await withCtx(req.ctx, async (q) => {
      const r = await q(
        `INSERT INTO tickets
           (tenant_id, project_id, number, title, description,
            responsible_name, responsible_contact, created_by)
         VALUES ($1, $2,
           (SELECT COALESCE(MAX(number), 0) + 1 FROM tickets WHERE project_id = $2),
           $3, $4, $5, $6, $7)
         RETURNING ${COLS}`,
        [
          req.user!.tid, projectId, b.title, b.description ?? null,
          b.responsible_name ?? null, b.responsible_contact ?? null, req.user!.id,
        ],
      )
      return r.rows[0]
    })
    res.status(201).json({ ticket: out })
  }),
)

// PATCH /tickets/:ticketId — omitted fields keep their value (COALESCE);
// resolved_at tracks the status. Fixed columns → no dynamic SQL to get wrong.
const patchBody = z.object({
  title: z.string().min(1).nullish(),
  description: z.string().nullish(),
  responsible_name: z.string().nullish(),
  responsible_contact: z.string().nullish(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).nullish(),
})
ticketsRouter.patch(
  '/tickets/:ticketId',
  requirePermission('ticket.edit', ticketScope),
  asyncHandler(async (req, res) => {
    const b = validate(patchBody, req.body)
    const out = await withCtx(req.ctx, async (q) => {
      const r = await q(
        `UPDATE tickets SET
           title               = COALESCE($2, title),
           description         = COALESCE($3, description),
           responsible_name    = COALESCE($4, responsible_name),
           responsible_contact = COALESCE($5, responsible_contact),
           status              = COALESCE($6, status),
           resolved_at         = CASE
             WHEN $6 IN ('resolved','closed')  THEN COALESCE(resolved_at, now())
             WHEN $6 IN ('open','in_progress') THEN NULL
             ELSE resolved_at END,
           updated_at          = now()
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING ${COLS}`,
        [
          req.params.ticketId, b.title ?? null, b.description ?? null,
          b.responsible_name ?? null, b.responsible_contact ?? null, b.status ?? null,
        ],
      )
      if (!r.rowCount) throw errors.notFound('Ticket not found.')
      return r.rows[0]
    })
    res.json({ ticket: out })
  }),
)

// DELETE /tickets/:ticketId — soft-delete, but only a closed ticket.
ticketsRouter.delete(
  '/tickets/:ticketId',
  requirePermission('ticket.edit', ticketScope),
  asyncHandler(async (req, res) => {
    await withCtx(req.ctx, async (q) => {
      const cur = await q<{ status: string }>(
        `SELECT status FROM tickets WHERE id = $1 AND deleted_at IS NULL`,
        [req.params.ticketId],
      )
      if (!cur.rowCount) throw errors.notFound('Ticket not found.')
      if (cur.rows[0].status !== 'closed') {
        throw errors.unprocessable('Only a closed ticket can be deleted.')
      }
      await q(
        `UPDATE tickets SET deleted_at = now(), updated_at = now() WHERE id = $1`,
        [req.params.ticketId],
      )
    })
    res.status(204).end()
  }),
)
