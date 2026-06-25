import { Router } from 'express'
import { z } from 'zod'
import { withCtx } from '../db'
import { asyncHandler, errors, validate } from '../http'
import { authenticate, requirePermission, tenantScope, paramScope } from '../middleware'

export const projectsRouter = Router()
projectsRouter.use(authenticate)

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')
const createBody = z.object({
  client_id: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1).nullish(),
  description: z.string().nullish(),
  location: z.string().nullish(),
  contract_no: z.string().nullish(),
  contract_value: z.number().nonnegative().nullish(),
  contract_start: dateStr.nullish(),
  contract_finish: dateStr.nullish(),
  period_type: z.enum(['weekly', 'biweekly', 'monthly']).default('weekly'),
  schedule_start: dateStr.nullish(),
})

const COLS = [
  'id', 'client_id', 'name', 'code', 'description', 'location', 'contract_no',
  'contract_value', 'contract_start', 'contract_finish', 'status', 'period_type',
  'schedule_start', 'data_date', 'created_at',
]
const projCols = COLS.join(', ')
const projColsP = COLS.map((c) => `p.${c}`).join(', ') // qualified, for joins

// POST /projects — requires an existing client (projects.client_id is NOT NULL).
projectsRouter.post(
  '/projects',
  requirePermission('project.manage', tenantScope),
  asyncHandler(async (req, res) => {
    const b = validate(createBody, req.body)
    const out = await withCtx(req.ctx, async (q) => {
      const c = await q(`SELECT 1 FROM clients WHERE id = $1 AND deleted_at IS NULL`, [b.client_id])
      if (!c.rowCount) throw errors.unprocessable('client_id does not reference a known client.')
      const r = await q(
        `INSERT INTO projects
           (tenant_id, client_id, name, code, description, location, contract_no,
            contract_value, contract_start, contract_finish, period_type, schedule_start,
            created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13)
         RETURNING ${projCols}`,
        [
          req.user!.tid, b.client_id, b.name, b.code ?? null, b.description ?? null,
          b.location ?? null, b.contract_no ?? null, b.contract_value ?? null,
          b.contract_start ?? null, b.contract_finish ?? null, b.period_type,
          b.schedule_start ?? null, req.user!.id,
        ],
      )
      return r.rows[0]
    }).catch((e) => {
      if (e?.code === '23505') throw errors.conflict('A project with this code already exists.')
      throw e
    })
    res.status(201).json({ project: out })
  }),
)

// GET /projects  filters: ?client_id= &status= &q=
projectsRouter.get(
  '/projects',
  requirePermission('project.view', tenantScope),
  asyncHandler(async (req, res) => {
    const f = validate(
      z.object({
        client_id: z.string().uuid().optional(),
        status: z
          .enum(['planning', 'active', 'on_hold', 'completed', 'cancelled'])
          .optional(),
        q: z.string().optional(),
      }),
      req.query,
    )
    const r = await withCtx(req.ctx, (qy) =>
      qy(
        `SELECT ${projColsP}, c.name AS client_name
         FROM projects p JOIN clients c ON c.id = p.client_id
         WHERE p.deleted_at IS NULL
           AND ($1::uuid IS NULL OR p.client_id = $1)
           AND ($2::project_status IS NULL OR p.status = $2)
           AND ($3::text IS NULL OR p.name ILIKE '%'||$3||'%' OR p.code ILIKE '%'||$3||'%')
         ORDER BY p.created_at DESC`,
        [f.client_id ?? null, f.status ?? null, f.q ?? null],
      ),
    )
    const data = r.rows.map((row: any) => {
      const { client_name, client_id, ...rest } = row
      return { ...rest, client_id, client: { id: client_id, name: client_name } }
    })
    res.json({ data, page: { next_cursor: null, has_more: false } })
  }),
)

// GET /projects/:projectId
projectsRouter.get(
  '/projects/:projectId',
  requirePermission('project.view', paramScope('project', 'projectId')),
  asyncHandler(async (req, res) => {
    const r = await withCtx(req.ctx, (q) =>
      q(`SELECT ${projCols}, updated_at FROM projects WHERE id = $1 AND deleted_at IS NULL`, [
        req.params.projectId,
      ]),
    )
    if (!r.rowCount) throw errors.notFound('Project not found.')
    res.json({ project: r.rows[0] })
  }),
)

// PATCH /projects/:projectId
projectsRouter.patch(
  '/projects/:projectId',
  requirePermission('project.manage', paramScope('project', 'projectId')),
  asyncHandler(async (req, res) => {
    const b = validate(
      createBody.partial().extend({
        status: z
          .enum(['planning', 'active', 'on_hold', 'completed', 'cancelled'])
          .optional(),
      }),
      req.body,
    )
    const r = await withCtx(req.ctx, (q) =>
      q(
        `UPDATE projects SET
           name           = COALESCE($2, name),
           code           = COALESCE($3, code),
           description    = COALESCE($4, description),
           location       = COALESCE($5, location),
           contract_value = COALESCE($6, contract_value),
           status         = COALESCE($7, status),
           updated_by     = $8
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING ${projCols}, updated_at`,
        [
          req.params.projectId, b.name ?? null, b.code ?? null, b.description ?? null,
          b.location ?? null, b.contract_value ?? null, b.status ?? null, req.user!.id,
        ],
      ),
    )
    if (!r.rowCount) throw errors.notFound('Project not found.')
    res.json({ project: r.rows[0] })
  }),
)

// DELETE /projects/:projectId  (soft)
projectsRouter.delete(
  '/projects/:projectId',
  requirePermission('project.manage', paramScope('project', 'projectId')),
  asyncHandler(async (req, res) => {
    const r = await withCtx(req.ctx, (q) =>
      q(`UPDATE projects SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`, [
        req.params.projectId,
      ]),
    )
    if (!r.rowCount) throw errors.notFound('Project not found.')
    res.status(204).end()
  }),
)
