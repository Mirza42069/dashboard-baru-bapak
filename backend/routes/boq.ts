import { Router } from 'express'
import { z } from 'zod'
import { withCtx, type Querier } from '../db'
import { Authed, asyncHandler, errors, validate } from '../http'
import { authenticate, requirePermission, paramScope, type ScopeSpec } from '../middleware'

export const boqRouter = Router()
boqRouter.use(authenticate)

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')

const VER_COLS = [
  'id', 'project_id', 'version_no', 'title', 'status', 'reason', 'total_value',
  'baselined_at', 'baselined_by', 'created_at', 'updated_at',
].join(', ')

const ITEM_COLS = [
  'id', 'boq_version_id', 'parent_id', 'code', 'description', 'unit', 'quantity',
  'unit_rate', 'value', 'weight', 'weight_source', 'planned_start', 'planned_finish',
  'distribution', 'progress_mode', 'sort_order', 'created_at', 'updated_at',
].join(', ')

// project-scoped guards for routes whose URL only carries a version/item id.
const projectOf = (req: Authed, sql: string, param: string) =>
  withCtx(req.ctx, async (q) => {
    const r = await q<{ project_id: string }>(sql, [req.params[param]])
    return r.rows[0]?.project_id ?? null
  }).then((id) => {
    if (!id) throw errors.notFound('Not found.')
    return { type: 'project' as const, id }
  })

const versionScope: ScopeSpec = (req) =>
  projectOf(req, `SELECT project_id FROM boq_versions WHERE id = $1`, 'versionId')
const itemScope: ScopeSpec = (req) =>
  projectOf(req, `SELECT project_id FROM boq_items WHERE id = $1 AND deleted_at IS NULL`, 'itemId')

// Drafts are freely editable; editing items in a non-draft version -> 422 (API.md §4.4).
async function assertDraft(q: Querier, versionId: string) {
  const r = await q<{ status: string }>(`SELECT status FROM boq_versions WHERE id = $1`, [versionId])
  if (!r.rowCount) throw errors.notFound('BoQ version not found.')
  if (r.rows[0].status !== 'draft') throw errors.unprocessable('Only a draft version can be edited.')
}

// ---- versions -------------------------------------------------------------

// GET /projects/:projectId/boq-versions
boqRouter.get(
  '/projects/:projectId/boq-versions',
  requirePermission('boq.view', paramScope('project', 'projectId')),
  asyncHandler(async (req, res) => {
    const r = await withCtx(req.ctx, (q) =>
      q(`SELECT ${VER_COLS} FROM boq_versions WHERE project_id = $1 ORDER BY version_no DESC`, [
        req.params.projectId,
      ]),
    )
    res.json({ data: r.rows, page: { next_cursor: null, has_more: false } })
  }),
)

// POST /projects/:projectId/boq-versions  (optionally clone_from an existing version)
const createVersion = z.object({
  title: z.string().min(1),
  reason: z.string().nullish(),
  clone_from: z.string().uuid().nullish(),
})
boqRouter.post(
  '/projects/:projectId/boq-versions',
  requirePermission('boq.edit', paramScope('project', 'projectId')),
  asyncHandler(async (req, res) => {
    const b = validate(createVersion, req.body)
    const projectId = req.params.projectId
    const out = await withCtx(req.ctx, async (q) => {
      const v = await q(
        `INSERT INTO boq_versions (tenant_id, project_id, version_no, title, reason, created_by, updated_by)
         VALUES ($1, $2,
           (SELECT COALESCE(MAX(version_no), 0) + 1 FROM boq_versions WHERE project_id = $2),
           $3, $4, $5, $5)
         RETURNING ${VER_COLS}`,
        [req.user!.tid, projectId, b.title, b.reason ?? null, req.user!.id],
      )
      const newId = v.rows[0].id
      if (b.clone_from) {
        const src = await q(`SELECT 1 FROM boq_versions WHERE id = $1 AND project_id = $2`, [
          b.clone_from, projectId,
        ])
        if (!src.rowCount) throw errors.unprocessable('clone_from is not a version of this project.')
        // copy items (parent_id wired in a second pass by code, since ids change)
        await q(
          `INSERT INTO boq_items
             (tenant_id, project_id, boq_version_id, code, description, unit, quantity, unit_rate,
              weight, weight_source, planned_start, planned_finish, distribution, progress_mode, sort_order)
           SELECT tenant_id, project_id, $1, code, description, unit, quantity, unit_rate,
                  weight, weight_source, planned_start, planned_finish, distribution, progress_mode, sort_order
           FROM boq_items WHERE boq_version_id = $2 AND deleted_at IS NULL`,
          [newId, b.clone_from],
        )
        await wireParentsFromClone(q, newId, b.clone_from)
      }
      return v.rows[0]
    })
    res.status(201).json({ version: out })
  }),
)

// GET /boq-versions/:versionId
boqRouter.get(
  '/boq-versions/:versionId',
  requirePermission('boq.view', versionScope),
  asyncHandler(async (req, res) => {
    const r = await withCtx(req.ctx, (q) =>
      q(`SELECT ${VER_COLS} FROM boq_versions WHERE id = $1`, [req.params.versionId]),
    )
    if (!r.rowCount) throw errors.notFound('BoQ version not found.')
    res.json({ version: r.rows[0] })
  }),
)

// POST /boq-versions/:versionId/recalc-weights
boqRouter.post(
  '/boq-versions/:versionId/recalc-weights',
  requirePermission('boq.edit', versionScope),
  asyncHandler(async (req, res) => {
    const out = await withCtx(req.ctx, async (q) => {
      await assertDraft(q, req.params.versionId)
      await q(`SELECT fn_recalc_boq_weights($1)`, [req.params.versionId])
      const r = await q(`SELECT ${VER_COLS} FROM boq_versions WHERE id = $1`, [req.params.versionId])
      return r.rows[0]
    })
    res.json({ version: out })
  }),
)

// POST /boq-versions/:versionId/activate  (baseline). Trigger enforces leaf weights ~100% -> 409.
boqRouter.post(
  '/boq-versions/:versionId/activate',
  requirePermission('boq.baseline', versionScope),
  asyncHandler(async (req, res) => {
    const out = await withCtx(req.ctx, async (q) => {
      const cur = await q<{ status: string; project_id: string }>(
        `SELECT status, project_id FROM boq_versions WHERE id = $1`,
        [req.params.versionId],
      )
      if (!cur.rowCount) throw errors.notFound('BoQ version not found.')
      if (cur.rows[0].status !== 'draft') {
        throw errors.conflict('Only a draft version can be activated.')
      }
      // supersede the prior baseline first (uq_boq_active allows one active per project)
      await q(
        `UPDATE boq_versions SET status = 'superseded', updated_by = $3
         WHERE project_id = $1 AND status = 'active' AND id <> $2`,
        [cur.rows[0].project_id, req.params.versionId, req.user!.id],
      )
      const r = await q(
        `UPDATE boq_versions
         SET status = 'active', baselined_at = now(), baselined_by = $2, updated_by = $2
         WHERE id = $1 RETURNING ${VER_COLS}`,
        [req.params.versionId, req.user!.id],
      )
      return r.rows[0]
    })
    res.json({ version: out })
  }),
)

// ---- items ----------------------------------------------------------------

const itemInput = z.object({
  code: z.string().min(1),
  description: z.string().min(1),
  unit: z.string().nullish(),
  parent_code: z.string().nullish(),
  quantity: z.number().nullish(),
  unit_rate: z.number().nullish(),
  weight: z.number().min(0).nullish(),
  weight_source: z.enum(['derived', 'manual']).default('derived'),
  distribution: z.enum(['linear', 'manual']).default('linear'),
  progress_mode: z.enum(['by_quantity', 'by_percent']).default('by_quantity'),
  planned_start: dateStr.nullish(),
  planned_finish: dateStr.nullish(),
  sort_order: z.number().int().nullish(),
})
type ItemInput = z.infer<typeof itemInput>

async function insertItem(q: Querier, tid: string, projectId: string, versionId: string, it: ItemInput) {
  const r = await q(
    `INSERT INTO boq_items
       (tenant_id, project_id, boq_version_id, code, description, unit, quantity, unit_rate,
        weight, weight_source, planned_start, planned_finish, distribution, progress_mode, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING ${ITEM_COLS}`,
    [
      tid, projectId, versionId, it.code, it.description, it.unit ?? null, it.quantity ?? null,
      it.unit_rate ?? null, it.weight ?? 0, it.weight_source, it.planned_start ?? null,
      it.planned_finish ?? null, it.distribution, it.progress_mode, it.sort_order ?? 0,
    ],
  )
  return r.rows[0]
}

// After cloning items into a new version, re-point parent_id by matching codes.
async function wireParentsFromClone(q: Querier, versionId: string, fromVersionId: string) {
  await q(
    `UPDATE boq_items n SET parent_id = p.id
     FROM boq_items o
     JOIN boq_items op ON op.id = o.parent_id
     JOIN boq_items p  ON p.boq_version_id = $1 AND p.code = op.code
     WHERE o.boq_version_id = $2 AND o.deleted_at IS NULL
       AND n.boq_version_id = $1 AND n.code = o.code`,
    [versionId, fromVersionId],
  )
}

async function resolveParent(q: Querier, versionId: string, parentCode?: string | null) {
  if (!parentCode) return null
  const r = await q<{ id: string }>(
    `SELECT id FROM boq_items WHERE boq_version_id = $1 AND code = $2 AND deleted_at IS NULL`,
    [versionId, parentCode],
  )
  if (!r.rowCount) throw errors.unprocessable(`parent_code '${parentCode}' not found in this version.`)
  return r.rows[0].id
}

// GET /boq-versions/:versionId/items
boqRouter.get(
  '/boq-versions/:versionId/items',
  requirePermission('boq.view', versionScope),
  asyncHandler(async (req, res) => {
    const r = await withCtx(req.ctx, (q) =>
      q(
        `SELECT ${ITEM_COLS} FROM boq_items
         WHERE boq_version_id = $1 AND deleted_at IS NULL
         ORDER BY sort_order, code`,
        [req.params.versionId],
      ),
    )
    res.json({ data: r.rows, page: { next_cursor: null, has_more: false } })
  }),
)

// POST /boq-versions/:versionId/items  (single item into a draft)
boqRouter.post(
  '/boq-versions/:versionId/items',
  requirePermission('boq.edit', versionScope),
  asyncHandler(async (req, res) => {
    const it = validate(itemInput, req.body)
    const versionId = req.params.versionId
    const out = await withCtx(req.ctx, async (q) => {
      await assertDraft(q, versionId)
      const ver = await q<{ project_id: string }>(
        `SELECT project_id FROM boq_versions WHERE id = $1`, [versionId],
      )
      const parentId = await resolveParent(q, versionId, it.parent_code)
      const row = await insertItem(q, req.user!.tid, ver.rows[0].project_id, versionId, it)
      if (parentId) {
        const r = await q(
          `UPDATE boq_items SET parent_id = $2 WHERE id = $1 RETURNING ${ITEM_COLS}`,
          [row.id, parentId],
        )
        return r.rows[0]
      }
      return row
    })
    res.status(201).json({ item: out })
  }),
)

// PUT /boq-versions/:versionId/items:bulk  (replace all items in a draft; importer target)
const bulkBody = z.object({ items: z.array(itemInput) })
boqRouter.put(
  '/boq-versions/:versionId/items:bulk',
  requirePermission('boq.edit', versionScope),
  asyncHandler(async (req, res) => {
    const { items } = validate(bulkBody, req.body)
    const versionId = req.params.versionId
    const data = await withCtx(req.ctx, async (q) => {
      await assertDraft(q, versionId)
      const ver = await q<{ project_id: string }>(
        `SELECT project_id FROM boq_versions WHERE id = $1`, [versionId],
      )
      const projectId = ver.rows[0].project_id
      await q(`DELETE FROM boq_items WHERE boq_version_id = $1`, [versionId])
      for (const it of items) await insertItem(q, req.user!.tid, projectId, versionId, it)
      // wire parents by parent_code (all rows now exist in this version)
      const withParents = items.filter((it) => it.parent_code)
      if (withParents.length) {
        await q(
          `UPDATE boq_items n SET parent_id = p.id
           FROM (VALUES ${withParents
             .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
             .join(', ')}) AS m(code, parent_code)
           JOIN boq_items p ON p.boq_version_id = $${withParents.length * 2 + 1} AND p.code = m.parent_code
           WHERE n.boq_version_id = $${withParents.length * 2 + 1} AND n.code = m.code`,
          [...withParents.flatMap((it) => [it.code, it.parent_code]), versionId],
        )
      }
      const r = await q(
        `SELECT ${ITEM_COLS} FROM boq_items
         WHERE boq_version_id = $1 AND deleted_at IS NULL ORDER BY sort_order, code`,
        [versionId],
      )
      return r.rows
    })
    res.json({ data, page: { next_cursor: null, has_more: false } })
  }),
)

// PATCH /boq-items/:itemId
const patchItem = itemInput.partial().omit({ parent_code: true })
boqRouter.patch(
  '/boq-items/:itemId',
  requirePermission('boq.edit', itemScope),
  asyncHandler(async (req, res) => {
    const b = validate(patchItem, req.body)
    const out = await withCtx(req.ctx, async (q) => {
      const v = await q<{ boq_version_id: string }>(
        `SELECT boq_version_id FROM boq_items WHERE id = $1 AND deleted_at IS NULL`,
        [req.params.itemId],
      )
      if (!v.rowCount) throw errors.notFound('BoQ item not found.')
      await assertDraft(q, v.rows[0].boq_version_id)
      const r = await q(
        `UPDATE boq_items SET
           code           = COALESCE($2, code),
           description    = COALESCE($3, description),
           unit           = COALESCE($4, unit),
           quantity       = COALESCE($5, quantity),
           unit_rate      = COALESCE($6, unit_rate),
           weight         = COALESCE($7, weight),
           weight_source  = COALESCE($8, weight_source),
           distribution   = COALESCE($9, distribution),
           progress_mode  = COALESCE($10, progress_mode),
           planned_start  = COALESCE($11, planned_start),
           planned_finish = COALESCE($12, planned_finish),
           sort_order     = COALESCE($13, sort_order)
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING ${ITEM_COLS}`,
        [
          req.params.itemId, b.code ?? null, b.description ?? null, b.unit ?? null,
          b.quantity ?? null, b.unit_rate ?? null, b.weight ?? null, b.weight_source ?? null,
          b.distribution ?? null, b.progress_mode ?? null, b.planned_start ?? null,
          b.planned_finish ?? null, b.sort_order ?? null,
        ],
      )
      return r.rows[0]
    })
    res.json({ item: out })
  }),
)

// DELETE /boq-items/:itemId  (soft; draft only)
boqRouter.delete(
  '/boq-items/:itemId',
  requirePermission('boq.edit', itemScope),
  asyncHandler(async (req, res) => {
    await withCtx(req.ctx, async (q) => {
      const v = await q<{ boq_version_id: string }>(
        `SELECT boq_version_id FROM boq_items WHERE id = $1 AND deleted_at IS NULL`,
        [req.params.itemId],
      )
      if (!v.rowCount) throw errors.notFound('BoQ item not found.')
      await assertDraft(q, v.rows[0].boq_version_id)
      await q(`UPDATE boq_items SET deleted_at = now() WHERE id = $1`, [req.params.itemId])
    })
    res.status(204).end()
  }),
)
