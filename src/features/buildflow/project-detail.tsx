import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import {
  Check,
  ChevronDown,
  Download,
  Pencil,
  Plus,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MetricCard, Panel, StatusPill } from './components'
import { projects, systems } from './data'
import {
  boqSeedLeaves,
  computeTotals,
  gbp,
  leafStatus,
  type BoqLeaf,
} from './boq'

// Exact BoQ grid columns from wireframe (decoded design L265).
const GRID = '74px 1.9fr 52px 100px 96px 104px 168px 104px'

const projectMeta = [
  ['Client', 'Meridian Construction Ltd'],
  ['Contract', 'JCT D&B 2016'],
  ['Location', 'Riverside, Leeds'],
  ['Start on site', '12 Jan 2026'],
  ['Practical completion', '30 Nov 2026'],
  ['Quantity surveyor', 'A. Okafor'],
]

const workPackages = [
  { name: 'Substructure', pct: 92 },
  { name: 'Superstructure', pct: 48 },
  { name: 'Envelope', pct: 14 },
  { name: 'MEP first fix', pct: 31 },
  { name: 'Fit-out', pct: 6 },
]

const progressKpis = [
  { label: 'Earned value', value: '£612k', sub: 'of £1.42m contract' },
  { label: 'Schedule variance', value: '−4 d', sub: '2 packages slipping' },
  { label: 'Cost variance', value: '+£18k', sub: 'forecast over budget' },
]

const gantt = [
  { name: 'Enabling works', start: 0, span: 1 },
  { name: 'Substructure', start: 0.4, span: 1.1 },
  { name: 'Superstructure', start: 1.2, span: 1.6 },
  { name: 'Envelope', start: 2.2, span: 1.2 },
  { name: 'MEP', start: 2.0, span: 1.5 },
  { name: 'Fit-out & handover', start: 3.0, span: 1.0 },
]

const documents = [
  { name: 'tender_BoQ_rev2.xlsx', ext: 'XLS', type: 'Bill of quantities', size: '186 KB', updated: '2 days ago' },
  { name: 'GA_drawings_set_C.pdf', ext: 'PDF', type: 'Drawings', size: '12.4 MB', updated: '5 days ago' },
  { name: 'programme_v4.mpp', ext: 'MPP', type: 'Programme', size: '904 KB', updated: '1 week ago' },
  { name: 'site_diary_wk12.pdf', ext: 'PDF', type: 'Site record', size: '2.1 MB', updated: '1 week ago' },
  { name: 'valuation_05.pdf', ext: 'PDF', type: 'Valuation', size: '430 KB', updated: '2 weeks ago' },
]

const projectTeam = [
  { initials: 'AO', name: 'A. Okafor', email: 'a.okafor@meridian.co', role: 'Project manager' },
  { initials: 'LM', name: 'L. Marsh', email: 'l.marsh@meridian.co', role: 'Quantity surveyor' },
  { initials: 'DS', name: 'D. Singh', email: 'd.singh@meridian.co', role: 'Site manager' },
  { initials: 'RA', name: 'R. Adeyemi', email: 'r.adeyemi@meridian.co', role: 'Engineer' },
]

type Revision = {
  rev: string
  status: string
  tone: 'good' | 'muted'
  note: string
  date: string
  by: string
}

const seedRevisions: Revision[] = [
  { rev: '2', status: 'Active', tone: 'good', note: 'Re-measure of curtain walling after design freeze', date: '14 Mar', by: 'A. Okafor' },
  { rev: '1', status: 'Superseded', tone: 'muted', note: 'Initial tender BoQ import', date: '12 Jan', by: 'L. Marsh' },
]

const projectTabs = [
  { value: 'overview', label: 'Overview' },
  { value: 'boq', label: 'Bill of Quantities' },
  { value: 'progress', label: 'Progress & Integrations' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'documents', label: 'Documents' },
  { value: 'team', label: 'Team' },
]

const statusTone = (s: string) =>
  s === 'On track'
    ? 'good'
    : s === 'At risk'
      ? 'risk'
      : s === 'Delayed'
        ? 'danger'
        : ('muted' as const)

export function ProjectDetailPage() {
  const { code } = useParams({ from: '/_authenticated/projects/$code' })
  const project = projects.find((p) => p.code === code) ?? projects[0]
  const [tab, setTab] = useState('boq')

  const tabLabel =
    projectTabs.find((t) => t.value === tab)?.label ?? 'Overview'

  return (
    <div>
      {/* breadcrumb — wireframe L157-162 */}
      <div className='mb-3 flex items-center gap-2 text-xs text-muted-foreground'>
        <Link to='/projects' className='hover:text-foreground'>
          Projects
        </Link>
        <span>/</span>
        <span>{project.name}</span>
        <span>/</span>
        <span className='font-medium text-foreground'>{tabLabel}</span>
      </div>

      {/* project header — wireframe L163-170 */}
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
            {project.code} · Meridian Construction Ltd · Riverside, Leeds
          </div>
        </div>
        <div className='text-right'>
          <div className='text-[10px] tracking-[0.16em] text-muted-foreground uppercase'>
            Overall progress
          </div>
          <div className='font-mono text-xl font-semibold text-foreground'>
            {project.progress}%
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        {/* tab bar — wireframe L171-176 */}
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
          <BoqTab projectName={project.name} />
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
          <TeamTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---- OVERVIEW (wireframe L178-197) ----
function OverviewTab({ project }: { project: (typeof projects)[number] }) {
  return (
    <div>
      <div className='mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard label='Progress' value={`${project.progress}%`} hint='earned value basis' tone='good' />
        <MetricCard label='Contract value' value={project.value} hint='current revision' />
        <MetricCard label='Budget used' value={`${project.budgetUsed}%`} hint='of contract value' tone={project.budgetUsed > 70 ? 'risk' : 'neutral'} />
        <MetricCard label='Risk' value={project.risk} hint='QS assessment' tone={project.risk === 'High' ? 'risk' : 'neutral'} />
      </div>
      <div className='grid gap-4 xl:grid-cols-2'>
        <Panel title='Project details'>
          <div className='divide-y divide-border'>
            {projectMeta.map(([label, value]) => (
              <div key={label} className='flex justify-between py-2.5 text-xs'>
                <span className='text-muted-foreground'>{label}</span>
                <span className='font-medium text-foreground'>{value}</span>
              </div>
            ))}
          </div>
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
      {workPackages.map((w) => (
        <div key={w.name}>
          <div className='mb-1.5 flex justify-between text-xs text-foreground'>
            <span>{w.name}</span>
            <span className='font-mono text-muted-foreground'>{w.pct}%</span>
          </div>
          <Progress value={w.pct} className='h-2 bg-muted' />
        </div>
      ))}
    </div>
  )
}

// ---- BILL OF QUANTITIES (wireframe L199-386) ----
function BoqTab({ projectName }: { projectName: string }) {
  const [stage, setStage] = useState<'empty' | 'import' | 'data'>('data')
  const [mode, setMode] = useState<'active' | 'draft'>('active')
  const [subTab, setSubTab] = useState<'quantities' | 'revisions' | 'field'>(
    'quantities'
  )
  const [leaves, setLeaves] = useState<BoqLeaf[]>(boqSeedLeaves)
  const [revisions, setRevisions] = useState<Revision[]>(seedRevisions)

  if (stage === 'empty')
    return <BoqEmpty onImport={() => setStage('import')} onScratch={() => setStage('data')} />
  if (stage === 'import')
    return (
      <BoqImport
        onCancel={() => setStage('data')}
        onFinish={() => setStage('data')}
      />
    )

  const activeRev = revisions.find((r) => r.status === 'Active')?.rev ?? '2'
  const nextRev = String(Number(activeRev) + 1)

  const saveRevision = () => {
    setRevisions((prev) => [
      { rev: nextRev, status: 'Active', tone: 'good', note: 'Quantity & rate revision', date: 'Today', by: 'A. Okafor' },
      ...prev.map((r) => ({ ...r, status: r.status === 'Active' ? 'Superseded' : r.status, tone: 'muted' as const })),
    ])
    setMode('active')
  }
  const discardDraft = () => {
    setLeaves(boqSeedLeaves)
    setMode('active')
  }

  return (
    <div>
      {/* revision / mode bar — wireframe L243-255 */}
      {mode === 'active' ? (
        <div className='mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-3'>
          <div className='flex items-center gap-3'>
            <span className='rounded-md bg-muted px-2 py-1 text-[11px] font-semibold text-foreground'>
              Rev {activeRev}
            </span>
            <StatusPill tone='good'>Active</StatusPill>
            <span className='text-xs text-muted-foreground'>
              Issued 14 Mar · A. Okafor
            </span>
          </div>
          <div className='flex gap-2'>
            <ExportDialog />
            <Button size='sm' className='rounded-md text-xs' onClick={() => setMode('draft')}>
              <Pencil className='size-3.5' /> Revise BoQ
            </Button>
          </div>
        </div>
      ) : (
        <div className='mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/60 p-3'>
          <div className='flex items-center gap-3'>
            <span className='rounded-md bg-foreground px-2 py-1 text-[11px] font-semibold text-background'>
              Draft Rev {nextRev}
            </span>
            <span className='text-xs text-foreground'>
              Quantities & rates unlocked · progress locked while drafting
            </span>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' className='rounded-md text-xs' onClick={discardDraft}>
              Discard
            </Button>
            <Button size='sm' className='rounded-md text-xs' onClick={saveRevision}>
              Save as Rev {nextRev}
            </Button>
          </div>
        </div>
      )}

      {/* BoQ secondary nav — wireframe L257-260 */}
      <div className='mb-3 flex gap-1'>
        {(['quantities', 'revisions', 'field'] as const).map((s) => (
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
            {s === 'field' ? 'Field update' : s}
          </button>
        ))}
      </div>

      {subTab === 'quantities' && (
        <QuantitiesGrid mode={mode} leaves={leaves} setLeaves={setLeaves} />
      )}
      {subTab === 'revisions' && <RevisionHistory revisions={revisions} />}
      {subTab === 'field' && (
        <FieldUpdate
          projectName={projectName}
          leaves={leaves}
          setLeaves={setLeaves}
        />
      )}
    </div>
  )
}

function BoqEmpty({ onImport, onScratch }: { onImport: () => void; onScratch: () => void }) {
  return (
    <div className='rounded-lg border border-border bg-card p-10 text-center'>
      <div className='mx-auto mb-3 grid size-12 place-items-center rounded-lg border border-dashed border-border bg-muted text-muted-foreground'>
        ▤
      </div>
      <div className='text-base font-semibold text-foreground'>
        No Bill of Quantities yet
      </div>
      <p className='mx-auto mb-5 mt-1.5 max-w-md text-xs text-muted-foreground'>
        Start from an existing priced spreadsheet, or build the BoQ from scratch.
        Most teams import their tender BoQ, then adjust.
      </p>
      <div className='flex flex-wrap justify-center gap-3'>
        <button
          onClick={onImport}
          className='flex w-52 flex-col items-center gap-1.5 rounded-lg border border-border bg-muted/50 p-4 transition hover:bg-muted'
        >
          <Upload className='size-5 text-muted-foreground' />
          <span className='text-sm font-medium text-foreground'>Import from Excel</span>
          <span className='text-[11px] text-muted-foreground'>.xlsx / .csv · recommended</span>
        </button>
        <button
          onClick={onScratch}
          className='flex w-52 flex-col items-center gap-1.5 rounded-lg border border-dashed border-border p-4 transition hover:bg-muted/40'
        >
          <Plus className='size-5 text-muted-foreground' />
          <span className='text-sm font-medium text-foreground'>Create from scratch</span>
          <span className='text-[11px] text-muted-foreground'>add sections & line items</span>
        </button>
      </div>
    </div>
  )
}

const importMappings = [
  { src: 'Item Ref', field: 'Code', match: 'Exact', tone: 'good' as const },
  { src: 'Description of Works', field: 'Description', match: 'Exact', tone: 'good' as const },
  { src: 'UoM', field: 'Unit', match: 'Likely', tone: 'risk' as const },
  { src: 'Quantity', field: 'Quantity', match: 'Exact', tone: 'good' as const },
  { src: 'Rate (£)', field: 'Rate', match: 'Exact', tone: 'good' as const },
  { src: 'Amount', field: 'Amount (derived)', match: 'Review', tone: 'risk' as const },
]

function BoqImport({ onCancel, onFinish }: { onCancel: () => void; onFinish: () => void }) {
  return (
    <div>
      {/* stepper — wireframe L219-223 */}
      <div className='mb-5 flex items-center gap-3'>
        <Step n={1} label='Upload file' />
        <div className='h-px w-8 bg-border' />
        <Step n={2} label='Map columns' />
      </div>
      <div className='grid gap-4 lg:grid-cols-[300px_1fr]'>
        <div className='space-y-3'>
          <div className='rounded-lg border-2 border-dashed border-border bg-muted/40 p-6 text-center'>
            <div className='mx-auto mb-3 grid size-10 place-items-center rounded-lg border border-border bg-card text-muted-foreground'>
              <Upload className='size-4' />
            </div>
            <div className='text-sm font-medium text-foreground'>Drop Excel / CSV here</div>
            <div className='mb-3 text-[11px] text-muted-foreground'>.xlsx, .xls, .csv up to 20MB</div>
            <Button size='sm' className='rounded-md text-xs'>Browse files</Button>
          </div>
          <div className='flex items-center gap-3 rounded-md border border-border bg-card p-2.5'>
            <div className='grid size-7 place-items-center rounded bg-muted text-[10px] font-semibold text-muted-foreground'>
              XLS
            </div>
            <div className='flex-1'>
              <div className='text-xs font-medium text-foreground'>tender_BoQ.xlsx</div>
              <div className='text-[11px] text-muted-foreground'>142 rows detected</div>
            </div>
            <Check className='size-4 text-emerald-600' />
          </div>
        </div>
        <Panel title='Map spreadsheet columns to BoQ fields' description='Auto-matched where possible. Adjust any mapping below.'>
          <div
            className='grid gap-2 border-b border-border pb-2 text-[10px] tracking-wide text-muted-foreground uppercase'
            style={{ gridTemplateColumns: '1fr 28px 1fr 80px' }}
          >
            <div>Source column</div>
            <div />
            <div>BoQ field</div>
            <div>Match</div>
          </div>
          {importMappings.map((m) => (
            <div
              key={m.src}
              className='grid items-center gap-2 border-b border-border py-2.5'
              style={{ gridTemplateColumns: '1fr 28px 1fr 80px' }}
            >
              <div className='rounded border border-border bg-muted px-2 py-1.5 font-mono text-[11px] text-muted-foreground'>
                {m.src}
              </div>
              <div className='text-center text-muted-foreground'>→</div>
              <div className='flex justify-between rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground'>
                <span>{m.field}</span>
                <ChevronDown className='size-3 text-muted-foreground' />
              </div>
              <StatusPill tone={m.tone}>{m.match}</StatusPill>
            </div>
          ))}
          <div className='mt-4 flex justify-end gap-2'>
            <Button variant='outline' size='sm' className='rounded-md text-xs' onClick={onCancel}>
              Cancel
            </Button>
            <Button size='sm' className='rounded-md text-xs' onClick={onFinish}>
              Finish import →
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  )
}

function Step({ n, label }: { n: number; label: string }) {
  return (
    <div className='flex items-center gap-2'>
      <span className='grid size-6 place-items-center rounded-full bg-primary text-[11px] text-primary-foreground'>
        {n}
      </span>
      <span className='text-xs font-medium text-foreground'>{label}</span>
    </div>
  )
}

function QuantitiesGrid({
  mode,
  leaves,
  setLeaves,
}: {
  mode: 'active' | 'draft'
  leaves: BoqLeaf[]
  setLeaves: React.Dispatch<React.SetStateAction<BoqLeaf[]>>
}) {
  const [editing, setEditing] = useState<{ id: string; field: 'qty' | 'rate' | 'pct' } | null>(null)
  const totals = computeTotals(leaves)

  const setField = (id: string, field: 'qty' | 'rate' | 'pct', value: number) =>
    setLeaves((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, [field]: field === 'pct' ? Math.max(0, Math.min(100, value)) : Math.max(0, value) }
          : l
      )
    )

  const editable = (field: 'qty' | 'rate' | 'pct') =>
    mode === 'draft' ? field === 'qty' || field === 'rate' : field === 'pct'

  const numCell = (l: BoqLeaf, field: 'qty' | 'rate') => {
    const isEditing = editing?.id === l.id && editing.field === field
    if (editable(field) && isEditing)
      return (
        <input
          autoFocus
          type='number'
          defaultValue={l[field]}
          onBlur={(e) => {
            setField(l.id, field, Number(e.target.value))
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
        onClick={() => editable(field) && setEditing({ id: l.id, field })}
        className={cn(
          'flex h-full items-center justify-end px-2 font-mono text-xs',
          editable(field) ? 'cursor-pointer hover:bg-muted' : 'text-muted-foreground'
        )}
      >
        {field === 'rate' ? l.rate.toFixed(2) : l.qty.toLocaleString('en-GB')}
      </div>
    )
  }

  return (
    <div className='overflow-x-auto rounded-lg border border-border bg-card'>
      <div className='min-w-[920px]'>
        {/* header — wireframe L265-272 */}
        <div
          className='grid border-b border-border bg-muted/60 text-[10px] tracking-wide text-muted-foreground uppercase'
          style={{ gridTemplateColumns: GRID }}
        >
          <div className='p-2.5'>Code</div>
          <div className='p-2.5'>Description</div>
          <div className='p-2.5 text-center'>Unit</div>
          <div className='p-2.5 text-right'>Qty{mode === 'active' && ' 🔒'}</div>
          <div className='p-2.5 text-right'>Rate{mode === 'active' && ' 🔒'}</div>
          <div className='p-2.5 text-right'>Amount</div>
          <div className='p-2.5'>% Complete{mode === 'draft' && ' 🔒'}</div>
          <div className='p-2.5'>Status</div>
        </div>

        {totals.sections.map((sec) => (
          <div key={sec.section.id}>
            {/* section header — wireframe L276-285 */}
            <div className='flex items-center justify-between bg-muted/40 px-2.5 py-2'>
              <div className='flex items-center gap-2 text-xs font-semibold text-foreground'>
                <span className='grid size-5 place-items-center rounded bg-muted text-[10px] text-muted-foreground'>
                  {sec.section.num}
                </span>
                <span>{sec.section.name}</span>
              </div>
              <div className='flex items-center gap-3'>
                <span className='text-[11px] text-muted-foreground'>
                  {sec.leaves.length} items
                </span>
                <Progress value={sec.pct} className='h-1.5 w-20 bg-muted' />
                <span className='w-8 text-right font-mono text-[11px] font-semibold text-foreground'>
                  {sec.pct}%
                </span>
              </div>
            </div>

            {/* leaf rows — wireframe L288-325 */}
            {sec.leaves.map((l) => {
              const st = leafStatus(l.pct)
              return (
                <div
                  key={l.id}
                  className='grid items-stretch border-b border-border/60 text-xs'
                  style={{ gridTemplateColumns: GRID }}
                >
                  <div className='p-2.5 font-mono text-[11px] text-muted-foreground'>{l.code}</div>
                  <div className='p-2.5 text-foreground'>{l.desc}</div>
                  <div className='p-2.5 text-center text-muted-foreground'>{l.unit}</div>
                  <div className='border-l border-border/50'>{numCell(l, 'qty')}</div>
                  <div className='border-l border-border/50'>{numCell(l, 'rate')}</div>
                  <div className='flex items-center justify-end p-2.5 font-mono text-foreground'>
                    {gbp(l.qty * l.rate)}
                  </div>
                  <div className='border-l border-border/50'>
                    <PctCell
                      leaf={l}
                      editable={editable('pct')}
                      editing={editing?.id === l.id && editing.field === 'pct'}
                      onStart={() => setEditing({ id: l.id, field: 'pct' })}
                      onCommit={(v) => {
                        setField(l.id, 'pct', v)
                        setEditing(null)
                      }}
                      onCancel={() => setEditing(null)}
                    />
                  </div>
                  <div className='flex items-center p-2.5'>
                    <StatusPill tone={st.tone}>{st.label}</StatusPill>
                  </div>
                </div>
              )
            })}

            {/* subtotal — wireframe L328-335 */}
            <div
              className='grid bg-muted/30 text-[11px]'
              style={{ gridTemplateColumns: GRID }}
            >
              <div className='col-span-5 p-2.5 text-right text-muted-foreground italic'>
                Subtotal — {sec.section.name}
              </div>
              <div className='p-2.5 text-right font-mono font-semibold text-foreground'>
                {gbp(sec.amount)}
              </div>
              <div className='flex items-center gap-2 p-2.5'>
                <Progress value={sec.pct} className='h-1.5 flex-1 bg-muted' />
                <span className='w-8 text-right font-mono text-muted-foreground'>{sec.pct}%</span>
              </div>
              <div />
            </div>
          </div>
        ))}

        {/* contract total — wireframe L338-343 */}
        <div className='grid border-t border-border bg-muted/60 text-xs' style={{ gridTemplateColumns: GRID }}>
          <div className='col-span-5 p-3 font-semibold text-foreground'>Contract total</div>
          <div className='p-3 text-right font-mono font-semibold text-foreground'>{gbp(totals.total)}</div>
          <div className='flex items-center gap-2 p-3'>
            <Progress value={totals.pct} className='h-2 flex-1 bg-muted' />
            <span className='font-mono text-[11px] font-semibold text-foreground'>{totals.pct}%</span>
          </div>
          <div />
        </div>
      </div>
    </div>
  )
}

function PctCell({
  leaf,
  editable,
  editing,
  onStart,
  onCommit,
  onCancel,
}: {
  leaf: BoqLeaf
  editable: boolean
  editing: boolean
  onStart: () => void
  onCommit: (v: number) => void
  onCancel: () => void
}) {
  if (editable && editing)
    return (
      <div className='flex h-full items-center gap-2 px-2'>
        <input
          type='range'
          min={0}
          max={100}
          defaultValue={leaf.pct}
          onChange={(e) => onCommit(Number(e.target.value))}
          className='flex-1'
        />
        <input
          autoFocus
          type='number'
          defaultValue={leaf.pct}
          onBlur={(e) => onCommit(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') onCancel()
          }}
          className='w-11 rounded-sm border-2 border-primary px-1 text-right font-mono text-[11px] outline-none'
        />
      </div>
    )
  return (
    <div
      onClick={() => editable && onStart()}
      className={cn(
        'flex h-full items-center gap-2 px-2',
        editable ? 'cursor-pointer hover:bg-muted' : ''
      )}
    >
      <Progress value={leaf.pct} className={cn('h-2 flex-1', editable ? 'bg-muted' : 'bg-muted/50 opacity-60')} />
      <span className='w-8 text-right font-mono text-[11px] text-muted-foreground'>{leaf.pct}%</span>
    </div>
  )
}

function RevisionHistory({ revisions }: { revisions: Revision[] }) {
  return (
    <Panel
      title='Revision history'
      description='Each change to quantities or rates is saved as a new revision. The active revision is the baseline for progress & valuation; earlier revisions are kept and marked superseded.'
    >
      <div className='divide-y divide-border'>
        {revisions.map((rv) => (
          <div
            key={rv.rev}
            className='grid items-center gap-3 py-3 text-xs'
            style={{ gridTemplateColumns: '80px 110px 1fr 140px 60px' }}
          >
            <span className='w-fit rounded-md bg-muted px-2 py-1 text-[11px] font-semibold text-foreground'>
              Rev {rv.rev}
            </span>
            <StatusPill tone={rv.tone}>{rv.status}</StatusPill>
            <span className='text-foreground'>{rv.note}</span>
            <span className='text-muted-foreground'>{rv.date} · {rv.by}</span>
            <button className='text-right text-[11px] text-muted-foreground hover:text-foreground'>
              View →
            </button>
          </div>
        ))}
      </div>
    </Panel>
  )
}

// ---- FIELD UPDATE (wireframe L364-382) ----
function FieldUpdate({
  projectName,
  leaves,
  setLeaves,
}: {
  projectName: string
  leaves: BoqLeaf[]
  setLeaves: React.Dispatch<React.SetStateAction<BoqLeaf[]>>
}) {
  const bump = (id: string, delta: number) =>
    setLeaves((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, pct: Math.max(0, Math.min(100, l.pct + delta)) } : l
      )
    )
  const set = (id: string, v: number) =>
    setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, pct: v } : l)))

  const fieldItems = leaves.filter((l) => l.pct < 100).slice(0, 5)

  return (
    <div className='flex flex-wrap gap-8'>
      {/* phone mock */}
      <div className='w-[330px] overflow-hidden rounded-[34px] border-[10px] border-muted bg-card shadow-lg'>
        <div className='flex h-7 items-center justify-center bg-muted'>
          <div className='h-1.5 w-20 rounded bg-border' />
        </div>
        <div className='border-b border-border p-4'>
          <div className='text-[10px] tracking-[0.16em] text-muted-foreground uppercase'>
            Field update · {projectName}
          </div>
          <div className='mt-0.5 text-base font-semibold text-foreground'>Today's progress</div>
        </div>
        <div className='max-h-[430px] overflow-auto p-3.5'>
          {fieldItems.map((f) => (
            <div key={f.id} className='mt-2.5 rounded-lg border border-border p-3'>
              <div className='flex items-baseline justify-between'>
                <div className='text-[13px] font-semibold text-foreground'>{f.desc}</div>
                <div className='font-mono text-[13px] font-semibold text-muted-foreground'>{f.pct}%</div>
              </div>
              <div className='mb-2.5 mt-0.5 text-[11px] text-muted-foreground'>
                {f.code} · {f.qty.toLocaleString('en-GB')} {f.unit}
              </div>
              <input
                type='range'
                min={0}
                max={100}
                value={f.pct}
                onChange={(e) => set(f.id, Number(e.target.value))}
                className='w-full'
              />
              <div className='mt-2.5 flex gap-2'>
                <button onClick={() => bump(f.id, -5)} className='flex-1 rounded-md border border-border py-2 text-[13px] text-muted-foreground hover:bg-muted'>
                  −5%
                </button>
                <button onClick={() => bump(f.id, 5)} className='flex-1 rounded-md border border-border py-2 text-[13px] text-muted-foreground hover:bg-muted'>
                  +5%
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className='border-t border-border p-3.5'>
          <Button className='w-full rounded-lg py-6 text-sm font-semibold'>Submit update</Button>
        </div>
      </div>

      {/* explainer */}
      <div className='max-w-md flex-1 pt-2'>
        <div className='mb-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase'>
          On-site quick update
        </div>
        <div className='mb-4 text-lg font-semibold text-foreground'>
          Update progress from the field — no spreadsheet needed
        </div>
        {[
          ['1', 'Open today on site', 'Only items that are not yet complete show up, sorted by what crews are working on.'],
          ['2', 'Nudge the percentage', 'Drag the slider or tap ±5% — changes apply to the active revision instantly.'],
          ['3', 'Submit once', 'One submit posts every change; the office sees updated valuation in real time.'],
        ].map(([num, title, body]) => (
          <div key={num} className='mb-4 flex gap-3'>
            <div className='grid size-6 flex-none place-items-center rounded-md border border-border text-xs text-muted-foreground'>
              {num}
            </div>
            <div>
              <div className='text-[13px] font-semibold text-foreground'>{title}</div>
              <div className='mt-0.5 text-xs leading-relaxed text-muted-foreground'>{body}</div>
            </div>
          </div>
        ))}
        <div className='rounded-lg border border-dashed border-border bg-muted/40 p-3.5 text-xs leading-relaxed text-muted-foreground'>
          Field updates change <strong className='text-foreground'>progress only</strong> against the active revision.
          Quantities & rates stay locked — those go through a Revise draft.
        </div>
      </div>
    </div>
  )
}

function ExportDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' className='rounded-md text-xs'>
          <Download className='size-3.5' /> Export to Excel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Bill of Quantities</DialogTitle>
          <DialogDescription>
            Frontend mockup — no file is generated.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-3 py-2'>
          <Select defaultValue='xlsx'>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='xlsx'>Excel (.xlsx)</SelectItem>
              <SelectItem value='csv'>CSV (.csv)</SelectItem>
              <SelectItem value='pdf'>PDF priced summary</SelectItem>
            </SelectContent>
          </Select>
          <Button>Download export</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---- PROGRESS & INTEGRATIONS (wireframe L388-412) ----
function ProgressTab() {
  return (
    <div>
      <div className='mb-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]'>
        <Panel title='S-curve · planned vs actual'>
          <SCurve />
        </Panel>
        <div className='grid gap-4'>
          {progressKpis.map((k) => (
            <MetricCard key={k.label} label={k.label} value={k.value} hint={k.sub} />
          ))}
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
          <div className='divide-y divide-border'>
            {systems.map((g) => (
              <div key={g.name} className='flex items-center gap-3 py-2.5'>
                <div className='grid size-8 flex-none place-items-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground'>
                  {g.initials}
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='text-xs font-medium text-foreground'>{g.name}</div>
                  <div className='text-[11px] text-muted-foreground'>{g.type} · synced {g.sync}</div>
                </div>
                <StatusPill tone={g.status === 'Connected' ? 'good' : 'risk'}>{g.status}</StatusPill>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function SCurve() {
  return (
    <div>
      <div className='mb-2 flex justify-end gap-4 text-[11px] text-muted-foreground'>
        <span className='flex items-center gap-1.5'>
          <span className='inline-block w-3.5 border-t-2 border-muted-foreground' /> Planned
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='inline-block w-3.5 border-t-2 border-dashed border-primary' /> Actual
        </span>
      </div>
      <svg viewBox='0 0 460 220' className='block h-auto w-full'>
        <line x1='40' y1='10' x2='40' y2='186' stroke='var(--border)' />
        <line x1='40' y1='186' x2='450' y2='186' stroke='var(--border)' />
        <line x1='40' y1='142' x2='450' y2='142' stroke='var(--border)' opacity='0.5' />
        <line x1='40' y1='98' x2='450' y2='98' stroke='var(--border)' opacity='0.5' />
        <line x1='40' y1='54' x2='450' y2='54' stroke='var(--border)' opacity='0.5' />
        {[['0', 189], ['25', 146], ['50', 102], ['75', 58], ['100', 16]].map(
          ([t, y]) => (
            <text key={t} x='30' y={y as number} textAnchor='end' fontSize='9' fill='var(--muted-foreground)'>
              {t}
            </text>
          )
        )}
        <path d='M40,184 C140,178 180,150 230,108 C280,66 330,30 450,16' fill='none' stroke='var(--muted-foreground)' strokeWidth='2' />
        <path d='M40,184 C130,180 170,162 220,132 C250,114 270,108 300,104' fill='none' stroke='var(--primary)' strokeWidth='2' strokeDasharray='5 4' />
        <circle cx='300' cy='104' r='3.5' fill='var(--primary)' />
        <line x1='300' y1='14' x2='300' y2='186' stroke='var(--border)' strokeDasharray='2 3' />
        <text x='300' y='202' textAnchor='middle' fontSize='9' fill='var(--muted-foreground)'>Today</text>
      </svg>
    </div>
  )
}

// ---- SCHEDULE (wireframe L414-421) ----
function ScheduleTab() {
  return (
    <Panel title='Programme · indicative Gantt'>
      <div className='flex pl-40 text-[10px] tracking-wide text-muted-foreground uppercase'>
        {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
          <div key={q} className='flex-1'>{q}</div>
        ))}
      </div>
      <div className='mt-2 space-y-2'>
        {gantt.map((g) => (
          <div key={g.name} className='flex items-center'>
            <div className='w-40 flex-none text-xs text-foreground'>{g.name}</div>
            <div className='relative h-5 flex-1 rounded bg-muted'>
              <div
                className='absolute inset-y-0 rounded bg-primary/70'
                style={{ left: `${(g.start / 4) * 100}%`, width: `${(g.span / 4) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

// ---- DOCUMENTS (wireframe L423-430) ----
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
      {documents.map((d) => (
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
          <div className='font-mono text-[11px] text-muted-foreground'>{d.size}</div>
          <div className='text-[11px] text-muted-foreground'>{d.updated}</div>
        </div>
      ))}
    </Panel>
  )
}

// ---- TEAM (wireframe L432-438) ----
function TeamTab() {
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
        {projectTeam.map((u) => (
          <div key={u.email} className='flex items-center gap-3 py-2.5'>
            <span className='grid size-8 flex-none place-items-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground'>
              {u.initials}
            </span>
            <div className='flex-1'>
              <div className='text-xs font-medium text-foreground'>{u.name}</div>
              <div className='text-[11px] text-muted-foreground'>{u.email}</div>
            </div>
            <div className='rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground'>
              {u.role}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
