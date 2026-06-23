import { useDeferredValue, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowUpRight,
  ChevronDown,
  CircleAlert,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  EmptyState,
  EmptyPage,
  MetricCard,
  PageHeader,
  Panel,
  StatusPill,
} from './components'
import {
  activity,
  attentionItems,
  milestones,
  portfolioMetrics,
  projects,
  spendSeries,
  systems,
  team,
} from './data'

const spendConfig = {
  planned: { label: 'Planned', color: 'var(--muted-foreground)' },
  actual: { label: 'Actual', color: 'var(--primary)' },
} satisfies ChartConfig

export function TenantDashboard() {
  return (
    <>
      <PageHeader
        eyebrow='Construction manager'
        title='Portfolio command centre'
        description='Track delivery, budget drift, BoQ verification, and live integration health across the tenant workspace.'
        action={<NewProjectDialog />}
      />
      <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
        {portfolioMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>
      <div className='mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.9fr]'>
        <Panel
          title='Spend curve'
          description='Planned vs actual portfolio spend, £k'
        >
          {spendSeries.length ? (
            <ChartContainer config={spendConfig} className='h-64 w-full'>
              <AreaChart
                data={spendSeries}
                margin={{ left: 0, right: 8, top: 8 }}
              >
                <defs>
                  <linearGradient id='actual' x1='0' y1='0' x2='0' y2='1'>
                    <stop
                      offset='5%'
                      stopColor='var(--primary)'
                      stopOpacity={0.22}
                    />
                    <stop
                      offset='95%'
                      stopColor='var(--primary)'
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke='var(--border)' />
                <XAxis
                  dataKey='month'
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey='planned'
                  type='monotone'
                  stroke='var(--muted-foreground)'
                  fill='transparent'
                  strokeDasharray='4 4'
                />
                <Area
                  dataKey='actual'
                  type='monotone'
                  stroke='var(--primary)'
                  fill='url(#actual)'
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <EmptyState message='No spend data available.' />
          )}
        </Panel>
        <Panel
          title='Needs attention'
          description='Items blocking clean project delivery'
        >
          {attentionItems.length ? (
            <div className='space-y-2'>
              {attentionItems.map((item) => (
                <AttentionCard key={item.title} {...item} />
              ))}
            </div>
          ) : (
            <EmptyState message='No attention items.' />
          )}
        </Panel>
      </div>
      <div className='mt-4 grid gap-4 xl:grid-cols-[1.45fr_0.95fr]'>
        <Panel
          title='Active projects'
          description='Live delivery status from BoQ and programme updates'
          action={
            <Button variant='ghost' size='sm'>
              View all <ArrowUpRight className='size-3' />
            </Button>
          }
        >
          <ProjectTable compact />
        </Panel>
        <Panel title='Connected systems' description='Integration status'>
          {systems.length ? (
            <div className='divide-y divide-border'>
              {systems.map((system) => (
                <SystemRow key={system.name} {...system} />
              ))}
            </div>
          ) : (
            <EmptyState message='No connected systems.' />
          )}
        </Panel>
      </div>
      <div className='mt-4 grid gap-4 xl:grid-cols-2'>
        <Panel title='Recent activity'>
          {activity.length ? (
            <div className='divide-y divide-border'>
              {activity.map((item) => (
                <ActivityRow key={`${item.actor}-${item.time}`} {...item} />
              ))}
            </div>
          ) : (
            <EmptyState message='No recent activity.' />
          )}
        </Panel>
        <Panel title='Upcoming milestones'>
          {milestones.length ? (
            <div className='space-y-2'>
              {milestones.map((item) => (
                <MilestoneRow key={item.name} {...item} />
              ))}
            </div>
          ) : (
            <EmptyState message='No upcoming milestones.' />
          )}
        </Panel>
      </div>
    </>
  )
}

export function ProjectsPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const deferredQuery = useDeferredValue(query)
  const filtered = projects.filter((project) => {
    const matchesQuery = `${project.name} ${project.code} ${project.owner}`
      .toLowerCase()
      .includes(deferredQuery.toLowerCase())
    const matchesStatus = status === 'all' || project.status === status
    return matchesQuery && matchesStatus
  })

  return (
    <>
      <PageHeader
        eyebrow='Tenant workspace'
        title='Projects'
        description='Project register with search, status filtering, and delivery signals.'
        action={<NewProjectDialog />}
      />
      <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          label='Open projects'
          value={String(projects.length)}
          hint='current total'
          tone='good'
        />
        <MetricCard
          label='Average progress'
          value='0%'
          hint='no project data'
        />
        <MetricCard
          label='At risk / delayed'
          value='0'
          hint='need review'
          tone='risk'
        />
        <MetricCard
          label='Budget pressure'
          value='£0'
          hint='forecast variance'
          tone='risk'
        />
      </div>
      <Panel
        title='Project register'
        description='Filter and inspect project status'
        className='mt-4'
        action={
          <Button variant='outline' size='sm'>
            <SlidersHorizontal className='size-3.5' /> Columns
          </Button>
        }
      >
        <div className='mb-4 flex flex-col gap-2 sm:flex-row'>
          <div className='relative flex-1'>
            <Search className='absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className='rounded-sm border-border bg-background ps-9'
              placeholder='Search by project, code, manager...'
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className='w-full rounded-md border-border bg-background sm:w-44'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              <SelectItem value='On track'>On track</SelectItem>
              <SelectItem value='At risk'>At risk</SelectItem>
              <SelectItem value='Delayed'>Delayed</SelectItem>
              <SelectItem value='Setup'>Setup</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {filtered.length ? (
            filtered.map((project) => (
              <ProjectCard key={project.code} project={project} />
            ))
          ) : (
            <EmptyState message='No projects available.' />
          )}
          <NewProjectDialog
            trigger={
              <button className='flex min-h-52 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground transition hover:bg-muted/40'>
                + New project
              </button>
            }
          />
        </div>
      </Panel>
    </>
  )
}

function ProjectCard({ project }: { project: (typeof projects)[number] }) {
  return (
    <Link
      to='/projects/$code'
      params={{ code: project.code }}
      className='block rounded-md border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='font-medium text-foreground'>{project.name}</div>
        <StatusPill tone={statusTone(project.status)}>
          {project.status}
        </StatusPill>
      </div>
      <div className='my-1 font-mono text-[11px] text-muted-foreground'>
        {project.code} · {project.owner}
      </div>
      <div className='mt-3 flex items-center gap-3'>
        <Progress value={project.progress} className='h-2 flex-1 bg-muted' />
        <span className='font-mono text-[11px] text-muted-foreground'>
          {project.progress}%
        </span>
      </div>
    </Link>
  )
}

const MEMBER_GRID = '1.4fr 1.6fr 1.3fr 90px 90px'

const memberInitials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export function TeamPage() {
  const members = [
    ...team.map((m) => ({
      name: m.name,
      email: m.email,
      role: m.role,
      projects: m.projects,
      status: 'Active' as const,
    })),
  ]

  return (
    <>
      <PageHeader
        eyebrow='Tenant admin'
        title='Team & organisation'
        description='People, roles, access, and workload visibility for the construction tenant.'
      />
      <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          label='Members'
          value={String(members.length)}
          hint='active users'
        />
        <MetricCard label='Site teams' value='0' hint='project groups' />
        <MetricCard label='Pending invites' value='0' hint='awaiting signup' />
        <MetricCard label='Admins' value='0' hint='workspace owners' />
      </div>

      <Panel
        title='Members'
        className='mt-4'
        action={
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' className='rounded-md text-xs'>
              Export
            </Button>
            <InviteDialog />
          </div>
        }
      >
        <div className='overflow-x-auto'>
          {members.length ? (
            <div className='min-w-[680px]'>
              <div
                className='grid gap-2.5 border-b border-border pb-2 text-[10px] tracking-wide text-muted-foreground uppercase'
                style={{ gridTemplateColumns: MEMBER_GRID }}
              >
                <div>Name</div>
                <div>Email</div>
                <div>Role</div>
                <div>Projects</div>
                <div>Status</div>
              </div>
              {members.map((m) => (
                <div
                  key={m.email}
                  className='grid items-center gap-2.5 border-b border-border py-2.5 text-xs'
                  style={{ gridTemplateColumns: MEMBER_GRID }}
                >
                  <div className='flex items-center gap-2.5'>
                    <span className='grid size-7 flex-none place-items-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground'>
                      {memberInitials(m.name)}
                    </span>
                    <span className='font-medium text-foreground'>
                      {m.name}
                    </span>
                  </div>
                  <div className='text-[11px] text-muted-foreground'>
                    {m.email}
                  </div>
                  <div className='flex max-w-44 items-center justify-between rounded-md border border-border px-2.5 py-1.5 text-foreground'>
                    <span>{m.role}</span>
                    <ChevronDown className='size-3 text-muted-foreground' />
                  </div>
                  <div className='font-mono text-muted-foreground'>
                    {m.projects}
                  </div>
                  <div>
                    <StatusPill tone={m.status === 'Active' ? 'good' : 'muted'}>
                      {m.status}
                    </StatusPill>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message='No members available.' />
          )}
        </div>
      </Panel>

      <div className='mt-4 grid gap-4 xl:grid-cols-2'>
        <Panel title='Roles & permissions'>
          <EmptyState message='No roles available.' />
        </Panel>

        <Panel title='Organisation settings'>
          <EmptyState message='No organisation settings available.' />
        </Panel>
      </div>
    </>
  )
}

export function HelpCenterPage() {
  return (
    <EmptyPage
      title='Help & support'
      description='Support articles, onboarding checklists, tickets, and release notes will sit here.'
    />
  )
}

function NewProjectDialog({ trigger }: { trigger?: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className='rounded-md text-xs'>
            <Plus className='size-3.5' /> New project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>
            Enter project details to start setup.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-3 py-2'>
          <Input placeholder='Project name' />
          <Input placeholder='Project code' />
          <Input placeholder='Project manager' />
          <Button>Preview project setup</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InviteDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className='rounded-md text-xs'>
          <Plus className='size-3.5' /> Invite member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>Invite a team member.</DialogDescription>
        </DialogHeader>
        <div className='grid gap-3 py-2'>
          <Input placeholder='name@company.com' />
          <Select defaultValue='viewer'>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='admin'>Admin</SelectItem>
              <SelectItem value='manager'>Manager</SelectItem>
              <SelectItem value='viewer'>Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button>Send invite</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ProjectTable({
  compact = false,
  projects: rows = projects,
}: {
  compact?: boolean
  projects?: typeof projects
}) {
  if (!rows.length) return <EmptyState message='No projects available.' />

  return (
    <div className='overflow-x-auto'>
      <table className='w-full min-w-[760px] text-left text-xs'>
        <thead className='border-b border-border text-[10px] tracking-[0.14em] text-muted-foreground uppercase'>
          <tr>
            <th className='py-2 font-medium'>Project</th>
            <th className='py-2 font-medium'>Manager</th>
            <th className='py-2 font-medium'>Progress</th>
            {!compact && <th className='py-2 font-medium'>Budget</th>}
            <th className='py-2 font-medium'>Due</th>
            <th className='py-2 font-medium'>Status</th>
            <th className='py-2 font-medium'></th>
          </tr>
        </thead>
        <tbody className='divide-y divide-border'>
          {rows.map((project) => (
            <tr key={project.code} className='group hover:bg-muted/40'>
              <td className='py-3'>
                <Link
                  to='/projects/$code'
                  params={{ code: project.code }}
                  className='font-medium text-foreground hover:underline'
                >
                  {project.name}
                </Link>
                <div className='font-mono text-[11px] text-muted-foreground'>
                  {project.code} · {project.stage}
                </div>
              </td>
              <td className='py-3 text-muted-foreground'>{project.owner}</td>
              <td className='py-3'>
                <div className='flex items-center gap-3'>
                  <Progress
                    value={project.progress}
                    className='h-2 w-32 bg-muted'
                  />
                  <span className='w-9 text-[11px]'>{project.progress}%</span>
                </div>
              </td>
              {!compact && (
                <td className='py-3'>
                  <div>{project.value}</div>
                  <div className='text-[11px] text-muted-foreground'>
                    {project.budgetUsed}% used
                  </div>
                </td>
              )}
              <td className='py-3 text-muted-foreground'>{project.due}</td>
              <td className='py-3'>
                <StatusPill tone={statusTone(project.status)}>
                  {project.status}
                </StatusPill>
              </td>
              <td className='py-3 text-right'>
                <Button variant='ghost' size='icon' className='size-8'>
                  <MoreHorizontal className='size-4' />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AttentionCard({
  title,
  detail,
  severity,
}: {
  title: string
  detail: string
  severity: 'Low' | 'Medium' | 'High'
}) {
  return (
    <div className='flex gap-3 rounded-md border border-border bg-accent/40 p-3'>
      <CircleAlert className='mt-0.5 size-4 text-amber-600' />
      <div className='min-w-0 flex-1'>
        <div className='font-medium text-foreground'>{title}</div>
        <div className='text-xs text-muted-foreground'>{detail}</div>
      </div>
      <StatusPill tone={severity === 'High' ? 'danger' : 'risk'}>
        {severity}
      </StatusPill>
    </div>
  )
}
function SystemRow({
  initials,
  name,
  type,
  status,
  sync,
}: {
  initials: string
  name: string
  type: string
  status: string
  sync: string
}) {
  return (
    <div className='flex items-center gap-3 py-3'>
      <div className='grid size-9 place-items-center rounded-sm bg-muted text-[11px] font-medium text-muted-foreground'>
        {initials}
      </div>
      <div className='min-w-0 flex-1'>
        <div className='font-medium text-foreground'>{name}</div>
        <div className='text-xs text-muted-foreground'>
          {type} · {sync}
        </div>
      </div>
      <StatusPill
        tone={
          status === 'Connected'
            ? 'good'
            : status === 'Syncing'
              ? 'risk'
              : 'muted'
        }
      >
        {status}
      </StatusPill>
    </div>
  )
}
function ActivityRow({
  actor,
  action,
  target,
  time,
}: {
  actor: string
  action: string
  target: string
  time: string
}) {
  return (
    <div className='flex gap-3 py-3'>
      <span className='mt-2 size-2 rounded-full bg-primary/35' />
      <div className='min-w-0 flex-1'>
        <div>
          <span className='font-semibold text-foreground'>{actor}</span>{' '}
          {action}
        </div>
        <div className='text-xs text-muted-foreground'>{target}</div>
      </div>
      <div className='text-xs text-muted-foreground'>{time}</div>
    </div>
  )
}
function MilestoneRow({
  name,
  date,
  project,
  status,
}: {
  name: string
  date: string
  project: string
  status: string
}) {
  return (
    <div className='flex items-center gap-3 rounded-md border border-border bg-muted/40 p-3'>
      <div className='grid size-11 place-items-center rounded-sm bg-card text-xs font-medium shadow-xs'>
        {date}
      </div>
      <div className='min-w-0 flex-1'>
        <div className='font-medium text-foreground'>{name}</div>
        <div className='text-xs text-muted-foreground'>{project}</div>
      </div>
      <StatusPill tone={status === 'Ready' ? 'good' : 'risk'}>
        {status}
      </StatusPill>
    </div>
  )
}
function statusTone(status: string) {
  return status === 'On track'
    ? 'good'
    : status === 'At risk'
      ? 'risk'
      : status === 'Delayed'
        ? 'danger'
        : ('muted' as const)
}
