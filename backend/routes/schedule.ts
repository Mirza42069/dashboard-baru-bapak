import { Router } from 'express'
import { z } from 'zod'
import { withCtx, type Querier } from '../db'
import { asyncHandler, errors, validate } from '../http'
import { authenticate, requirePermission, paramScope, type ScopeSpec } from '../middleware'

export const scheduleRouter = Router()
scheduleRouter.use(authenticate)

const PERIOD_COLS = [
  'id', 'project_id', 'period_index', 'label',
  'start_date::text AS start_date', 'end_date::text AS end_date', 'status',
].join(', ')

// project_id behind a versionId, for routes whose URL only carries the version.
const versionScope: ScopeSpec = (req) =>
  withCtx(req.ctx, async (q) => {
    const r = await q<{ project_id: string }>(
      `SELECT project_id FROM boq_versions WHERE id = $1`, [req.params.versionId],
    )
    return r.rows[0]?.project_id ?? null
  }).then((id) => {
    if (!id) throw errors.notFound('Not found.')
    return { type: 'project' as const, id }
  })

async function assertDraft(q: Querier, versionId: string) {
  const r = await q<{ status: string }>(`SELECT status FROM boq_versions WHERE id = $1`, [versionId])
  if (!r.rowCount) throw errors.notFound('BoQ version not found.')
  if (r.rows[0].status !== 'draft') throw errors.unprocessable('Only a draft version can be edited.')
}

// ---- reporting periods ----------------------------------------------------

const iso = (d: Date) => d.toISOString().slice(0, 10)
const parse = (s: string) => new Date(s + 'T00:00:00Z')
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)

type Period = { period_index: number; label: string; start_date: string; end_date: string }

// Build period buckets covering [start, finish] at the project's cadence. Last
// bucket is clamped to finish so the grid ends exactly on the contract date.
function generatePeriods(start: string, finish: string, type: string): Period[] {
  const s = parse(start), f = parse(finish)
  if (f < s) throw errors.unprocessable('contract_finish is before the schedule start.')
  const out: Period[] = []
  let cur = s, i = 1
  while (cur <= f) {
    let end: Date, label: string
    if (type === 'monthly') {
      end = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 0))
      label = `M${i}`
    } else {
      end = addDays(cur, (type === 'biweekly' ? 14 : 7) - 1)
      label = `${type === 'biweekly' ? 'P' : 'W'}${i}`
    }
    if (end > f) end = f
    out.push({ period_index: i, label, start_date: iso(cur), end_date: iso(end) })
    cur = addDays(end, 1)
    i++
    if (i > 600) throw errors.unprocessable('Period range is too large; check the contract dates.')
  }
  return out
}

// GET /projects/:projectId/periods
scheduleRouter.get(
  '/projects/:projectId/periods',
  requirePermission('progress.view', paramScope('project', 'projectId')),
  asyncHandler(async (req, res) => {
    const r = await withCtx(req.ctx, (q) =>
      q(`SELECT ${PERIOD_COLS} FROM reporting_periods WHERE project_id = $1 ORDER BY period_index`, [
        req.params.projectId,
      ]),
    )
    res.json({ data: r.rows, page: { next_cursor: null, has_more: false } })
  }),
)

// POST /projects/:projectId/periods:generate — (re)build the grid from the
// project's schedule_start/contract_finish/period_type. Refuses once any
// progress exists so an established baseline's time axis can't shift underfoot.
scheduleRouter.post(
  '/projects/:projectId/periods:generate',
  requirePermission('project.manage', paramScope('project', 'projectId')),
  asyncHandler(async (req, res) => {
    const projectId = req.params.projectId
    const data = await withCtx(req.ctx, async (q) => {
      const p = await q<{
        schedule_start: string | null; contract_start: string | null
        contract_finish: string | null; period_type: string
      }>(
        // ::text so pg returns 'YYYY-MM-DD' strings, not Date objects.
        `SELECT schedule_start::text, contract_start::text, contract_finish::text, period_type
         FROM projects WHERE id = $1 AND deleted_at IS NULL`,
        [projectId],
      )
      if (!p.rowCount) throw errors.notFound('Project not found.')
      const { schedule_start, contract_start, contract_finish, period_type } = p.rows[0]
      const start = schedule_start ?? contract_start
      if (!start || !contract_finish) {
        throw errors.unprocessable('Set a schedule start (or contract start) and contract finish first.')
      }
      const prog = await q(`SELECT 1 FROM progress_entries WHERE project_id = $1 LIMIT 1`, [projectId])
      if (prog.rowCount) throw errors.conflict('Progress already recorded; periods can no longer be regenerated.')

      const periods = generatePeriods(start, contract_finish, period_type)
      if (!periods.length) throw errors.unprocessable('No periods fall within the contract dates.')
      await q(`DELETE FROM reporting_periods WHERE project_id = $1`, [projectId])
      // single multi-row insert
      const vals: string[] = []
      const args: (string | number)[] = [req.user!.tid, projectId]
      periods.forEach((p, idx) => {
        const b = idx * 4 + 3
        vals.push(`($1, $2, $${b}, $${b + 1}, $${b + 2}, $${b + 3})`)
        args.push(p.period_index, p.label, p.start_date, p.end_date)
      })
      await q(
        `INSERT INTO reporting_periods (tenant_id, project_id, period_index, label, start_date, end_date)
         VALUES ${vals.join(', ')}`,
        args,
      )
      const r = await q(
        `SELECT ${PERIOD_COLS} FROM reporting_periods WHERE project_id = $1 ORDER BY period_index`,
        [projectId],
      )
      return r.rows
    })
    res.status(201).json({ data, page: { next_cursor: null, has_more: false } })
  }),
)

// ---- planned distribution (the typed matrix) ------------------------------

// GET /boq-versions/:versionId/distribution — sparse cells for the matrix.
scheduleRouter.get(
  '/boq-versions/:versionId/distribution',
  requirePermission('boq.view', versionScope),
  asyncHandler(async (req, res) => {
    const r = await withCtx(req.ctx, (q) =>
      q(
        `SELECT d.boq_item_id, d.period_id, d.planned_pct
         FROM boq_item_distribution d
         JOIN boq_items i ON i.id = d.boq_item_id
         WHERE i.boq_version_id = $1`,
        [req.params.versionId],
      ),
    )
    res.json({ data: r.rows, page: { next_cursor: null, has_more: false } })
  }),
)

// PUT /boq-versions/:versionId/distribution:bulk — upsert the typed matrix on a
// draft. planned_pct is the item's own % planned for that period (its row sums
// to 100). A zero clears the cell. Touched items flip to distribution='manual'.
const distBody = z.object({
  cells: z.array(
    z.object({
      boq_item_id: z.string().uuid(),
      period_id: z.string().uuid(),
      planned_pct: z.number().min(0).max(100),
    }),
  ),
})
scheduleRouter.put(
  '/boq-versions/:versionId/distribution:bulk',
  requirePermission('boq.edit', versionScope),
  asyncHandler(async (req, res) => {
    const { cells } = validate(distBody, req.body)
    const versionId = req.params.versionId
    const data = await withCtx(req.ctx, async (q) => {
      await assertDraft(q, versionId)
      // only leaves of this version may carry a distribution
      const leaves = await q<{ id: string }>(
        `SELECT i.id FROM boq_items i
         WHERE i.boq_version_id = $1 AND i.deleted_at IS NULL
           AND NOT EXISTS (SELECT 1 FROM boq_items c WHERE c.parent_id = i.id AND c.deleted_at IS NULL)`,
        [versionId],
      )
      const leafIds = new Set(leaves.rows.map((r) => r.id))
      const tid = req.user!.tid
      const touched = new Set<string>()
      // ponytail: per-cell upsert. Matrices are small (items × periods); batch
      // into one statement if a big import ever drives this.
      for (const c of cells) {
        if (!leafIds.has(c.boq_item_id)) {
          throw errors.unprocessable('A cell references an item that is not a leaf of this version.')
        }
        touched.add(c.boq_item_id)
        if (c.planned_pct <= 0) {
          await q(`DELETE FROM boq_item_distribution WHERE boq_item_id = $1 AND period_id = $2`, [
            c.boq_item_id, c.period_id,
          ])
        } else {
          await q(
            `INSERT INTO boq_item_distribution (tenant_id, boq_item_id, period_id, planned_pct)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (boq_item_id, period_id) DO UPDATE SET planned_pct = EXCLUDED.planned_pct`,
            [tid, c.boq_item_id, c.period_id, c.planned_pct],
          )
        }
      }
      if (touched.size) {
        await q(
          `UPDATE boq_items SET distribution = 'manual' WHERE id = ANY($1::uuid[])`,
          [[...touched]],
        )
      }
      const r = await q(
        `SELECT d.boq_item_id, d.period_id, d.planned_pct
         FROM boq_item_distribution d
         JOIN boq_items i ON i.id = d.boq_item_id
         WHERE i.boq_version_id = $1`,
        [versionId],
      )
      return r.rows
    })
    res.json({ data, page: { next_cursor: null, has_more: false } })
  }),
)
