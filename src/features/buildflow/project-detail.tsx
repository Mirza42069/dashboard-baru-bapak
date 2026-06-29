import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { GripVertical, Pencil, Plus, Upload } from 'lucide-react'
import { toast } from 'sonner'
import {
  activateBoqVersion,
  createBoqItem,
  createBoqVersion,
  getProject,
  listBoqItems,
  listBoqVersions,
  patchBoqItem,
  recalcBoqWeights,
  type BoqItem,
  type BoqItemInput,
  type BoqVersion,
  type Project as ApiProject,
} from '@/lib/auth-api'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { gbp } from './boq'
import { EmptyState, MetricCard, Panel, StatusPill } from './components'
import { systems } from './data'

const workPackages: { name: string; pct: number }[] = []

const progressKpis: { label: string; value: string; sub: string }[] = []

const gantt: { name: string; start: number; span: number }[] = []

const documents: {
  name: string
  ext: string
  type: string
  size: string
  updated: string
}[] = []

const projectTabs = [
  { value: 'overview', label: 'Overview' },
  { value: 'boq', label: 'Bill of Quantities' },
  { value: 'progress', label: 'Progress & Integrations' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'documents', label: 'Documents' },
  { value: 'team', label: 'Team' },
]

const statusTone = (s: string) =>
  s === 'On track' || s === 'active' || s === 'completed'
    ? 'good'
    : s === 'At risk' || s === 'planning' || s === 'on_hold'
      ? 'risk'
      : s === 'Delayed' || s === 'cancelled'
        ? 'danger'
        : ('muted' as const)

const formatMoney = (value: ApiProject['contract_value']) => {
  if (value == null) return 'Not set'
  const amount = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(amount)) return String(value)
  return '£' + Math.round(amount).toLocaleString('en-GB')
}

const formatDate = (value: string | null) => value || 'Not set'

const memberInitials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

const projectMetricTone = (status: ApiProject['status']) =>
  status === 'active' || status === 'completed'
    ? 'good'
    : status === 'cancelled'
      ? 'risk'
      : ('neutral' as const)

export function ProjectDetailPage() {
  const { id } = useParams({ from: '/_authenticated/projects/$id' })
  const { auth } = useAuthStore()
  const [project, setProject] = useState<ApiProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('boq')

  useEffect(() => {
    if (!auth.accessToken) return
    async function loadProject() {
      setLoading(true)
      try {
        const res = await getProject(auth.accessToken, id)
        setProject(res.project)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load project.')
        setProject(null)
      } finally {
        setLoading(false)
      }
    }

    void loadProject()
  }, [auth.accessToken, id])

  if (loading) return <EmptyState message='Loading project...' />
  if (!project) return <EmptyState message='Project not found.' />

  const tabLabel = projectTabs.find((t) => t.value === tab)?.label ?? 'Overview'

  return (
    <div>
      <div className='mb-3 flex items-center gap-2 text-xs text-muted-foreground'>
        <Link to='/projects' className='hover:text-foreground'>
          Projects
        </Link>
        <span>/</span>
        <span>{project.name}</span>
        <span>/</span>
        <span className='font-medium text-foreground'>{tabLabel}</span>
      </div>

      <div className='mb-4 flex flex-wrap items-start justify-between gap-4'>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
              {project.name}
            </h1>
            <StatusPill tone={statusTone(project.status)}>
              {project.status}
            </StatusPill>
          </div>
          <div className='mt-1 font-mono text-xs text-muted-foreground'>
            {project.code}
          </div>
        </div>
        <div className='text-right'>
          <div className='text-[10px] tracking-[0.16em] text-muted-foreground uppercase'>
            Overall progress
          </div>
          <div className='font-mono text-xl font-semibold text-foreground'>
            0%
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className='mb-5 h-auto flex-wrap justify-start gap-1 rounded-none border-b border-border bg-transparent p-0'>
          {projectTabs.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className='rounded-md rounded-b-none border-b-2 border-transparent px-3 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none'
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value='overview'>
          <OverviewTab project={project} />
        </TabsContent>
        <TabsContent value='boq'>
          <BoqTab projectId={project.id} />
        </TabsContent>
        <TabsContent value='progress'>
          <ProgressTab />
        </TabsContent>
        <TabsContent value='schedule'>
          <ScheduleTab />
        </TabsContent>
        <TabsContent value='documents'>
          <DocumentsTab />
        </TabsContent>
        <TabsContent value='team'>
          <TeamTab project={project} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OverviewTab({ project }: { project: ApiProject }) {
  const projectMeta: [string, string][] = [
    ['Client', project.client.name],
    ['Project code', project.code || 'Not set'],
    ['Description', project.description || 'Not set'],
    ['Location', project.location || 'Not set'],
    ['Contract number', project.contract_no || 'Not set'],
    ['Contract value', formatMoney(project.contract_value)],
    ['Contract start', formatDate(project.contract_start)],
    ['Contract finish', formatDate(project.contract_finish)],
    ['Reporting period', project.period_type],
    ['Schedule start', formatDate(project.schedule_start)],
    ['Data date', formatDate(project.data_date)],
    [
      'Project managers',
      project.managers.map((m) => m.full_name || m.email).join(', ') || 'Not assigned',
    ],
  ]

  return (
    <div>
      <div className='mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          label='Progress'
          value='0%'
          hint='earned value basis'
          tone='good'
        />
        <MetricCard
          label='Contract value'
          value={formatMoney(project.contract_value)}
          hint='current revision'
        />
        <MetricCard
          label='Managers'
          value={String(project.managers.length)}
          hint='assigned users'
          tone='neutral'
        />
        <MetricCard
          label='Status'
          value={project.status}
          hint='project lifecycle'
          tone={projectMetricTone(project.status)}
        />
      </div>
      <div className='grid gap-4 xl:grid-cols-2'>
        <Panel title='Project details'>
          {projectMeta.length ? (
            <div className='divide-y divide-border'>
              {projectMeta.map(([label, value]) => (
                <div
                  key={label}
                  className='flex justify-between py-2.5 text-xs'
                >
                  <span className='text-muted-foreground'>{label}</span>
                  <span className='font-medium text-foreground'>{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message='No project details available.' />
          )}
        </Panel>
        <Panel title='Progress by work package'>
          <WorkPackages />
        </Panel>
      </div>
    </div>
  )
}

function WorkPackages() {
  return (
    <div className='space-y-3'>
      {workPackages.length ? (
        workPackages.map((w) => (
          <div key={w.name}>
            <div className='mb-1.5 flex justify-between text-xs text-foreground'>
              <span>{w.name}</span>
              <span className='font-mono text-muted-foreground'>{w.pct}%</span>
            </div>
            <Progress value={w.pct} className='h-2 bg-muted' />
          </div>
        ))
      ) : (
        <EmptyState message='No work packages available.' />
      )}
    </div>
  )
}

const num = (v: string | number | null | undefined) =>
  v == null ? 0 : Number(v)
const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : 'Something went wrong.'

const BOQ_GRID = '90px minmax(160px,1.8fr) 60px 108px 128px 140px 84px'

type Section = { header: BoqItem | null; leaves: BoqItem[] }

// Flat boq_items -> 2-level sections: a parent item (one referenced as someone's
// parent_id) is a section header; everything else is a leaf, grouped under its
// parent or collected as "Ungrouped".
function buildSections(items: BoqItem[]): Section[] {
  const sorted = [...items].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      a.code.localeCompare(b.code, undefined, { numeric: true })
  )
  const parentIds = new Set(
    sorted.filter((i) => i.parent_id).map((i) => i.parent_id as string)
  )
  const isHeader = (i: BoqItem) => parentIds.has(i.id)
  const grouped = (i: BoqItem) => i.parent_id != null && parentIds.has(i.parent_id)
  const sections: Section[] = sorted
    .filter(isHeader)
    .map((h) => ({
      header: h,
      leaves: sorted.filter((i) => i.parent_id === h.id && !isHeader(i)),
    }))
  const orphans = sorted.filter((i) => !isHeader(i) && !grouped(i))
  if (orphans.length) sections.push({ header: null, leaves: orphans })
  return sections
}

// Move dragId to sit where targetId currently is, within an ordered id list.
function moveBefore(ids: string[], dragId: string, targetId: string) {
  const without = ids.filter((x) => x !== dragId)
  const at = without.indexOf(targetId)
  without.splice(at < 0 ? without.length : at, 0, dragId)
  return without
}

function BoqTab({ projectId }: { projectId: string }) {
  const { auth } = useAuthStore()
  const token = auth.accessToken
  const [versions, setVersions] = useState<BoqVersion[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [items, setItems] = useState<BoqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [subTab, setSubTab] = useState<'quantities' | 'revisions'>('quantities')

  const loadItems = useCallback(
    async (versionId: string) => {
      if (!token) return
      const { data } = await listBoqItems(token, versionId)
      setItems(data)
    },
    [token]
  )

  useEffect(() => {
    if (!token) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const { data } = await listBoqVersions(token, projectId)
        if (cancelled) return
        setVersions(data)
        const pick = data.find((v) => v.status === 'active') ?? data[0] ?? null
        setCurrentId(pick?.id ?? null)
        setItems(pick ? (await listBoqItems(token, pick.id)).data : [])
      } catch (err) {
        if (!cancelled) toast.error(errMsg(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, projectId])

  const current = versions.find((v) => v.id === currentId) ?? null
  const draft = current?.status === 'draft'

  const refresh = async (selectId?: string) => {
    if (!token) return
    const { data } = await listBoqVersions(token, projectId)
    setVersions(data)
    const pick =
      (selectId ? data.find((v) => v.id === selectId) : undefined) ??
      data.find((v) => v.status === 'active') ??
      data[0] ??
      null
    setCurrentId(pick?.id ?? null)
    if (pick) await loadItems(pick.id)
    else setItems([])
  }

  const run = async (fn: () => Promise<void>) => {
    if (!token || busy) return
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  const createFirst = () =>
    run(async () => {
      const { version } = await createBoqVersion(token!, projectId, {
        title: 'Rev 1',
      })
      await refresh(version.id)
      setSubTab('quantities')
      toast.success('BoQ draft created — add line items, then activate.')
    })

  const revise = () =>
    run(async () => {
      const existing = versions.find((v) => v.status === 'draft')
      if (existing) {
        setCurrentId(existing.id)
        await loadItems(existing.id)
        setSubTab('quantities')
        return
      }
      const active = versions.find((v) => v.status === 'active') ?? current
      const nextNo = Math.max(0, ...versions.map((v) => v.version_no)) + 1
      const { version } = await createBoqVersion(token!, projectId, {
        title: `Rev ${nextNo}`,
        clone_from: active?.id ?? null,
      })
      await refresh(version.id)
      setSubTab('quantities')
    })

  const activate = () =>
    run(async () => {
      await recalcBoqWeights(token!, current!.id)
      await activateBoqVersion(token!, current!.id)
      await refresh()
      toast.success('Baseline activated.')
    })

  const addItem = (input: BoqItemInput) =>
    run(async () => {
      await createBoqItem(token!, current!.id, input)
      await loadItems(current!.id)
    })

  const addSection = (input: { code: string; description: string }) =>
    run(async () => {
      await createBoqItem(token!, current!.id, { ...input, parent_id: null })
      await loadItems(current!.id)
    })

  // Persist a drag-reordered group by rewriting its members' sort_order.
  const reorder = (orderedIds: string[]) =>
    run(async () => {
      await Promise.all(
        orderedIds.map((id, idx) => {
          const it = items.find((i) => i.id === id)
          return it && it.sort_order !== idx
            ? patchBoqItem(token!, id, { sort_order: idx })
            : null
        })
      )
      await loadItems(current!.id)
    })

  const commitCell = (
    itemId: string,
    field: 'quantity' | 'unit_rate',
    value: number
  ) =>
    run(async () => {
      const { item } = await patchBoqItem(token!, itemId, { [field]: value })
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)))
    })

  if (loading) return <EmptyState message='Loading bill of quantities…' />
  if (!current) return <BoqEmpty onCreate={createFirst} busy={busy} />

  const sections = buildSections(items)
  const total = sections.reduce(
    (s, sec) =>
      s + sec.leaves.reduce((t, l) => t + num(l.quantity) * num(l.unit_rate), 0),
    0
  )

  return (
    <div>
      <div
        className={cn(
          'mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3',
          draft ? 'bg-muted/60' : 'bg-card'
        )}
      >
        <div className='flex items-center gap-3'>
          <span
            className={cn(
              'rounded-md px-2 py-1 text-[11px] font-semibold',
              draft ? 'bg-foreground text-background' : 'bg-muted text-foreground'
            )}
          >
            {draft ? 'Draft ' : ''}Rev {current.version_no}
          </span>
          <StatusPill
            tone={
              current.status === 'active' ? 'good' : draft ? 'risk' : 'muted'
            }
          >
            {current.status}
          </StatusPill>
          <span className='text-xs text-muted-foreground'>
            {draft ? 'Quantities & rates unlocked' : current.title}
          </span>
        </div>
        <div className='flex gap-2'>
          {draft ? (
            <Button
              size='sm'
              className='rounded-md text-xs'
              disabled={busy}
              onClick={activate}
            >
              Activate baseline
            </Button>
          ) : (
            <Button
              size='sm'
              className='rounded-md text-xs'
              disabled={busy}
              onClick={revise}
            >
              <Pencil className='size-3.5' /> Revise BoQ
            </Button>
          )}
        </div>
      </div>

      <div className='mb-3 flex gap-1'>
        {(['quantities', 'revisions'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSubTab(s)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs capitalize transition',
              subTab === s
                ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {subTab === 'quantities' ? (
        <>
          <BoqGrid
            sections={sections}
            total={total}
            draft={draft}
            busy={busy}
            onCommit={commitCell}
            onReorder={reorder}
          />
          {draft && (
            <AddItemForm
              sections={sections}
              onAdd={addItem}
              onAddSection={addSection}
              busy={busy}
            />
          )}
          <p className='mt-3 text-[11px] text-muted-foreground'>
            {draft && 'Drag the ⠿ handle to reorder. '}% complete &amp; field
            progress arrive with the reporting-period API (not yet wired).
          </p>
        </>
      ) : (
        <RevisionHistory
          versions={versions}
          currentId={current.id}
          onView={(id) =>
            void (async () => {
              setCurrentId(id)
              await loadItems(id)
              setSubTab('quantities')
            })()
          }
        />
      )}
    </div>
  )
}

function BoqEmpty({
  onCreate,
  busy,
}: {
  onCreate: () => void
  busy: boolean
}) {
  return (
    <div className='rounded-lg border border-border bg-card p-10 text-center'>
      <div className='mx-auto mb-3 grid size-12 place-items-center rounded-lg border border-dashed border-border bg-muted text-muted-foreground'>
        ▤
      </div>
      <div className='text-base font-semibold text-foreground'>
        No Bill of Quantities yet
      </div>
      <p className='mx-auto mt-1.5 mb-5 max-w-md text-xs text-muted-foreground'>
        Create the first draft, add sections & line items, then activate it as
        the baseline.
      </p>
      <Button
        size='sm'
        className='rounded-md text-xs'
        disabled={busy}
        onClick={onCreate}
      >
        <Plus className='size-3.5' /> Create BoQ draft
      </Button>
    </div>
  )
}

function BoqGrid({
  sections,
  total,
  draft,
  busy,
  onCommit,
  onReorder,
}: {
  sections: Section[]
  total: number
  draft: boolean
  busy: boolean
  onCommit: (id: string, field: 'quantity' | 'unit_rate', value: number) => void
  onReorder: (orderedIds: string[]) => void
}) {
  const [editing, setEditing] = useState<{
    id: string
    field: 'quantity' | 'unit_rate'
  } | null>(null)
  // Drag-reorder within a group: 'S' = section headers, `L:<parent>` = leaves.
  const [drag, setDrag] = useState<{ id: string; group: string } | null>(null)

  const groupIds = (group: string): string[] => {
    if (group === 'S')
      return sections.map((s) => s.header?.id).filter(Boolean) as string[]
    const sec = sections.find((s) => `L:${s.header?.id ?? 'orphan'}` === group)
    return sec ? sec.leaves.map((l) => l.id) : []
  }
  const drop = (group: string, targetId: string) => {
    if (!drag || drag.group !== group || drag.id === targetId) return setDrag(null)
    onReorder(moveBefore(groupIds(group), drag.id, targetId))
    setDrag(null)
  }
  const dragProps = (id: string, group: string) =>
    !draft
      ? {}
      : {
          draggable: true,
          onDragStart: () => setDrag({ id, group }),
          onDragEnd: () => setDrag(null),
        }
  const dropProps = (group: string, targetId: string) =>
    !draft
      ? {}
      : {
          onDragOver: (e: React.DragEvent) =>
            drag?.group === group && e.preventDefault(),
          onDrop: () => drop(group, targetId),
        }

  if (!sections.length)
    return (
      <EmptyState
        message={
          draft
            ? 'No line items yet — add a section, then items below.'
            : 'This version has no line items.'
        }
      />
    )

  const cell = (l: BoqItem, field: 'quantity' | 'unit_rate') => {
    const isEditing = draft && editing?.id === l.id && editing.field === field
    if (isEditing)
      return (
        <input
          autoFocus
          type='number'
          defaultValue={num(l[field])}
          disabled={busy}
          onBlur={(e) => {
            onCommit(l.id, field, Number(e.target.value))
            setEditing(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') setEditing(null)
          }}
          className='h-full w-full rounded-sm border-2 border-primary bg-background px-1.5 text-right font-mono text-xs outline-none'
        />
      )
    return (
      <div
        onClick={() => draft && setEditing({ id: l.id, field })}
        className={cn(
          'flex h-full items-center justify-end px-2 font-mono text-xs',
          draft ? 'cursor-pointer hover:bg-muted' : 'text-muted-foreground'
        )}
      >
        {field === 'unit_rate'
          ? num(l.unit_rate).toFixed(2)
          : num(l.quantity).toLocaleString('en-GB')}
      </div>
    )
  }

  return (
    <div className='overflow-x-auto rounded-lg border border-border bg-card'>
      <div className='min-w-[860px]'>
        <div
          className='grid border-b border-border bg-muted/60 text-[10px] tracking-wide text-muted-foreground uppercase'
          style={{ gridTemplateColumns: BOQ_GRID }}
        >
          <div className='p-2.5'>Code</div>
          <div className='p-2.5'>Description</div>
          <div className='p-2.5 text-center'>Unit</div>
          <div className='p-2.5 text-right'>Qty{!draft && ' 🔒'}</div>
          <div className='p-2.5 text-right'>Rate{!draft && ' 🔒'}</div>
          <div className='p-2.5 text-right'>Amount</div>
          <div className='p-2.5 text-right'>Weight</div>
        </div>

        {sections.map((sec, idx) => {
          const amt = sec.leaves.reduce(
            (t, l) => t + num(l.quantity) * num(l.unit_rate),
            0
          )
          const wt = sec.leaves.reduce((t, l) => t + num(l.weight), 0)
          return (
            <div key={sec.header?.id ?? `orphan-${idx}`}>
              <div
                className={cn(
                  'flex items-center justify-between bg-muted/40 px-2.5 py-2',
                  draft && sec.header && 'cursor-grab',
                  drag?.id === sec.header?.id && 'opacity-50'
                )}
                {...(sec.header ? dragProps(sec.header.id, 'S') : {})}
                {...(sec.header ? dropProps('S', sec.header.id) : {})}
              >
                <div className='flex items-center gap-2 text-xs font-semibold text-foreground'>
                  {sec.header ? (
                    <>
                      {draft && (
                        <GripVertical className='size-3.5 text-muted-foreground' />
                      )}
                      <span className='grid place-items-center rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground'>
                        {sec.header.code}
                      </span>
                      <span>{sec.header.description}</span>
                    </>
                  ) : (
                    <span className='text-muted-foreground'>Ungrouped items</span>
                  )}
                </div>
                <span className='text-[11px] text-muted-foreground'>
                  {sec.leaves.length} items
                </span>
              </div>

              {sec.leaves.map((l) => {
                const group = `L:${sec.header?.id ?? 'orphan'}`
                return (
                <div
                  key={l.id}
                  className={cn(
                    'grid items-stretch border-b border-border/60 text-xs',
                    drag?.id === l.id && 'opacity-50'
                  )}
                  style={{ gridTemplateColumns: BOQ_GRID }}
                  {...dropProps(group, l.id)}
                >
                  <div
                    className={cn(
                      'flex items-center gap-1 p-2.5 font-mono text-[11px] text-muted-foreground',
                      draft && 'cursor-grab'
                    )}
                    {...dragProps(l.id, group)}
                  >
                    {draft && <GripVertical className='size-3.5' />}
                    {l.code}
                  </div>
                  <div className='p-2.5 text-foreground'>{l.description}</div>
                  <div className='p-2.5 text-center text-muted-foreground'>
                    {l.unit ?? '—'}
                  </div>
                  <div className='border-l border-border/50'>
                    {cell(l, 'quantity')}
                  </div>
                  <div className='border-l border-border/50'>
                    {cell(l, 'unit_rate')}
                  </div>
                  <div className='flex items-center justify-end p-2.5 font-mono text-foreground'>
                    {gbp(num(l.quantity) * num(l.unit_rate))}
                  </div>
                  <div className='flex items-center justify-end p-2.5 font-mono text-[11px] text-muted-foreground'>
                    {num(l.weight).toFixed(2)}%
                  </div>
                </div>
                )
              })}

              <div
                className='grid bg-muted/30 text-[11px]'
                style={{ gridTemplateColumns: BOQ_GRID }}
              >
                <div className='col-span-5 p-2.5 text-right text-muted-foreground italic'>
                  Subtotal{sec.header ? ` — ${sec.header.description}` : ''}
                </div>
                <div className='p-2.5 text-right font-mono font-semibold text-foreground'>
                  {gbp(amt)}
                </div>
                <div className='p-2.5 text-right font-mono text-muted-foreground'>
                  {wt.toFixed(2)}%
                </div>
              </div>
            </div>
          )
        })}

        <div
          className='grid border-t border-border bg-muted/60 text-xs'
          style={{ gridTemplateColumns: BOQ_GRID }}
        >
          <div className='col-span-5 p-3 font-semibold text-foreground'>
            Contract total
          </div>
          <div className='p-3 text-right font-mono font-semibold text-foreground'>
            {gbp(total)}
          </div>
          <div className='p-3' />
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn('flex flex-col gap-1', className)}>
      <span className='text-[10px] tracking-wide text-muted-foreground uppercase'>
        {label}
      </span>
      {children}
    </label>
  )
}

function AddItemForm({
  sections,
  onAdd,
  onAddSection,
  busy,
}: {
  sections: Section[]
  onAdd: (item: BoqItemInput) => void
  onAddSection: (input: { code: string; description: string }) => void
  busy: boolean
}) {
  // Any existing item can be a parent; sections (headers) first, then leaves.
  const parents = sections.flatMap((s) => [
    ...(s.header ? [s.header] : []),
    ...s.leaves,
  ])

  const emptySection = { code: '', description: '' }
  const emptyItem = {
    parent_id: '',
    code: '',
    description: '',
    unit: '',
    quantity: '',
    unit_rate: '',
  }
  const [sec, setSec] = useState(emptySection)
  const [it, setIt] = useState(emptyItem)
  const setS =
    (k: keyof typeof emptySection) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setSec((p) => ({ ...p, [k]: e.target.value }))
  const setI =
    (k: keyof typeof emptyItem) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setIt((p) => ({ ...p, [k]: e.target.value }))

  const submitSection = () => {
    if (!sec.code.trim() || !sec.description.trim()) {
      toast.error('Section code and title are required.')
      return
    }
    onAddSection({ code: sec.code.trim(), description: sec.description.trim() })
    setSec(emptySection)
  }

  const submitItem = () => {
    if (!it.parent_id) {
      toast.error('Choose a parent for the line item.')
      return
    }
    if (!it.code.trim() || !it.description.trim()) {
      toast.error('Code and description are required.')
      return
    }
    onAdd({
      parent_id: it.parent_id,
      code: it.code.trim(),
      description: it.description.trim(),
      unit: it.unit.trim() || null,
      quantity: it.quantity ? Number(it.quantity) : null,
      unit_rate: it.unit_rate ? Number(it.unit_rate) : null,
    })
    setIt({ ...emptyItem, parent_id: it.parent_id })
  }

  const selectCls =
    'h-8 rounded-md border border-input bg-background px-2 text-xs'

  return (
    <div className='mt-3 space-y-3'>
      <div className='rounded-lg border border-dashed border-border bg-muted/30 p-3'>
        <div className='mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase'>
          Add section
        </div>
        <div className='flex flex-wrap items-end gap-2'>
          <Field label='Code' className='w-24'>
            <Input value={sec.code} onChange={setS('code')} className='h-8 text-xs' />
          </Field>
          <Field label='Section title' className='min-w-44 flex-1'>
            <Input
              value={sec.description}
              onChange={setS('description')}
              className='h-8 text-xs'
            />
          </Field>
          <Button
            size='sm'
            variant='outline'
            className='h-8 rounded-md text-xs'
            disabled={busy}
            onClick={submitSection}
          >
            <Plus className='size-3.5' /> Add section
          </Button>
        </div>
      </div>

      <div className='rounded-lg border border-dashed border-border bg-muted/30 p-3'>
        <div className='mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase'>
          Add line item
        </div>
        {parents.length === 0 ? (
          <p className='text-xs text-muted-foreground'>
            Add a section first — every line item needs a parent.
          </p>
        ) : (
          <div className='flex flex-wrap items-end gap-2'>
            <Field label='Parent' className='min-w-44'>
              <select
                value={it.parent_id}
                onChange={setI('parent_id')}
                className={selectCls}
              >
                <option value='' disabled>
                  Select parent…
                </option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.description}
                  </option>
                ))}
              </select>
            </Field>
            <Field label='Code' className='w-20'>
              <Input value={it.code} onChange={setI('code')} className='h-8 text-xs' />
            </Field>
            <Field label='Description' className='min-w-40 flex-1'>
              <Input
                value={it.description}
                onChange={setI('description')}
                className='h-8 text-xs'
              />
            </Field>
            <Field label='Unit' className='w-16'>
              <Input value={it.unit} onChange={setI('unit')} className='h-8 text-xs' />
            </Field>
            <Field label='Qty' className='w-24'>
              <Input
                type='number'
                value={it.quantity}
                onChange={setI('quantity')}
                className='h-8 text-xs'
              />
            </Field>
            <Field label='Rate' className='w-28'>
              <Input
                type='number'
                value={it.unit_rate}
                onChange={setI('unit_rate')}
                className='h-8 text-xs'
              />
            </Field>
            <Button
              size='sm'
              className='h-8 rounded-md text-xs'
              disabled={busy}
              onClick={submitItem}
            >
              <Plus className='size-3.5' /> Add
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function RevisionHistory({
  versions,
  currentId,
  onView,
}: {
  versions: BoqVersion[]
  currentId: string
  onView: (id: string) => void
}) {
  const tone = (s: BoqVersion['status']) =>
    s === 'active' ? 'good' : s === 'draft' ? 'risk' : 'muted'
  const date = (v: BoqVersion) =>
    new Date(v.baselined_at ?? v.created_at).toLocaleDateString('en-GB')
  return (
    <Panel
      title='Revision history'
      description='Each baseline is a version. The active version is the baseline for progress & valuation; earlier ones are superseded.'
    >
      {versions.length ? (
        <div className='divide-y divide-border'>
          {[...versions]
            .sort((a, b) => b.version_no - a.version_no)
            .map((v) => (
              <div
                key={v.id}
                className='grid items-center gap-3 py-3 text-xs'
                style={{ gridTemplateColumns: '90px 110px 1fr 150px 60px' }}
              >
                <span className='w-fit rounded-md bg-muted px-2 py-1 text-[11px] font-semibold text-foreground'>
                  Rev {v.version_no}
                </span>
                <StatusPill tone={tone(v.status)}>{v.status}</StatusPill>
                <span className='text-foreground'>
                  {v.title}
                  {v.reason ? ` · ${v.reason}` : ''}
                </span>
                <span className='text-muted-foreground'>{date(v)}</span>
                <button
                  onClick={() => onView(v.id)}
                  className={cn(
                    'text-right text-[11px]',
                    v.id === currentId
                      ? 'font-semibold text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {v.id === currentId ? 'Viewing' : 'View →'}
                </button>
              </div>
            ))}
        </div>
      ) : (
        <EmptyState message='No revisions yet.' />
      )}
    </Panel>
  )
}

function ProgressTab() {
  return (
    <div>
      <div className='mb-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]'>
        <Panel title='S-curve · planned vs actual'>
          <EmptyState message='No progress curve available.' />
        </Panel>
        <div className='grid gap-4'>
          {progressKpis.length ? (
            progressKpis.map((k) => (
              <MetricCard
                key={k.label}
                label={k.label}
                value={k.value}
                hint={k.sub}
              />
            ))
          ) : (
            <EmptyState message='No progress metrics available.' />
          )}
        </div>
      </div>
      <div className='grid gap-4 xl:grid-cols-2'>
        <Panel title='Progress by work package'>
          <WorkPackages />
        </Panel>
        <Panel
          title='Project integrations'
          action={
            <Button size='sm' className='rounded-md text-xs'>
              <Plus className='size-3.5' /> Connect
            </Button>
          }
        >
          {systems.length ? (
            <div className='divide-y divide-border'>
              {systems.map((g) => (
                <div key={g.name} className='flex items-center gap-3 py-2.5'>
                  <div className='grid size-8 flex-none place-items-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground'>
                    {g.initials}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='text-xs font-medium text-foreground'>
                      {g.name}
                    </div>
                    <div className='text-[11px] text-muted-foreground'>
                      {g.type} · synced {g.sync}
                    </div>
                  </div>
                  <StatusPill tone={g.status === 'Connected' ? 'good' : 'risk'}>
                    {g.status}
                  </StatusPill>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message='No project integrations available.' />
          )}
        </Panel>
      </div>
    </div>
  )
}

function ScheduleTab() {
  return (
    <Panel title='Programme · indicative Gantt'>
      <div className='flex pl-40 text-[10px] tracking-wide text-muted-foreground uppercase'>
        {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
          <div key={q} className='flex-1'>
            {q}
          </div>
        ))}
      </div>
      {gantt.length ? (
        <div className='mt-2 space-y-2'>
          {gantt.map((g) => (
            <div key={g.name} className='flex items-center'>
              <div className='w-40 flex-none text-xs text-foreground'>
                {g.name}
              </div>
              <div className='relative h-5 flex-1 rounded bg-muted'>
                <div
                  className='absolute inset-y-0 rounded bg-primary/70'
                  style={{
                    left: `${(g.start / 4) * 100}%`,
                    width: `${(g.span / 4) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message='No schedule available.' />
      )}
    </Panel>
  )
}

function DocumentsTab() {
  return (
    <Panel
      title='Documents'
      action={
        <Button size='sm' className='rounded-md text-xs'>
          <Upload className='size-3.5' /> Upload
        </Button>
      }
    >
      <div
        className='grid gap-2.5 border-b border-border pb-2 text-[10px] tracking-wide text-muted-foreground uppercase'
        style={{ gridTemplateColumns: '1.8fr 110px 90px 130px' }}
      >
        <div>File</div>
        <div>Type</div>
        <div>Size</div>
        <div>Updated</div>
      </div>
      {documents.length ? (
        documents.map((d) => (
          <div
            key={d.name}
            className='grid items-center gap-2.5 border-b border-border py-2.5 text-xs'
            style={{ gridTemplateColumns: '1.8fr 110px 90px 130px' }}
          >
            <div className='flex items-center gap-2.5'>
              <span className='grid size-7 flex-none place-items-center rounded bg-muted text-[9px] font-semibold text-muted-foreground'>
                {d.ext}
              </span>
              <span className='font-medium text-foreground'>{d.name}</span>
            </div>
            <div className='text-muted-foreground'>{d.type}</div>
            <div className='font-mono text-[11px] text-muted-foreground'>
              {d.size}
            </div>
            <div className='text-[11px] text-muted-foreground'>{d.updated}</div>
          </div>
        ))
      ) : (
        <EmptyState message='No documents available.' />
      )}
    </Panel>
  )
}

function TeamTab({ project }: { project: ApiProject }) {
  return (
    <Panel
      title='Project team'
      action={
        <Button size='sm' className='rounded-md text-xs'>
          <Plus className='size-3.5' /> Assign member
        </Button>
      }
    >
      <div className='divide-y divide-border'>
        {project.managers.length ? (
          project.managers.map((u) => (
            <div key={u.email} className='flex items-center gap-3 py-2.5'>
              <span className='grid size-8 flex-none place-items-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground'>
                {memberInitials(u.full_name || u.email)}
              </span>
              <div className='flex-1'>
                <div className='text-xs font-medium text-foreground'>
                  {u.full_name || u.email}
                </div>
                <div className='text-[11px] text-muted-foreground'>
                  {u.email}
                </div>
              </div>
              <div className='rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground'>
                Project Manager
              </div>
            </div>
          ))
        ) : (
          <EmptyState message='No project team available.' />
        )}
      </div>
    </Panel>
  )
}
