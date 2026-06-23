import { useDeferredValue, useState } from 'react'
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
  EmptyPage,
  MetricCard,
  PageHeader,
  Panel,
  StatusPill,
} from './components'
import {
  activity,
  attentionItems,
  invoices,
  milestones,
  portfolioMetrics,
  projects,
  spendSeries,
  subscriptions,
  systems,
  team,
  tenants,
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
        </Panel>
        <Panel
          title='Needs attention'
          description='Items blocking clean project delivery'
        >
          <div className='space-y-2'>
            {attentionItems.map((item) => (
              <AttentionCard key={item.title} {...item} />
            ))}
          </div>
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
        <Panel title='Connected systems' description='Mock integration status'>
          <div className='divide-y divide-border'>
            {systems.map((system) => (
              <SystemRow key={system.name} {...system} />
            ))}
          </div>
        </Panel>
      </div>
      <div className='mt-4 grid gap-4 xl:grid-cols-2'>
        <Panel title='Recent activity'>
          <div className='divide-y divide-border'>
            {activity.map((item) => (
              <ActivityRow key={`${item.actor}-${item.time}`} {...item} />
            ))}
          </div>
        </Panel>
        <Panel title='Upcoming milestones'>
          <div className='space-y-2'>
            {milestones.map((item) => (
              <MilestoneRow key={item.name} {...item} />
            ))}
          </div>
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
        description='A usable project register mockup with local search, status filtering, and delivery signals.'
        action={<NewProjectDialog />}
      />
      <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          label='Open projects'
          value='6'
          hint='4 active, 2 setup'
          tone='good'
        />
        <MetricCard
          label='Average progress'
          value='45%'
          hint='weighted by value'
        />
        <MetricCard
          label='At risk / delayed'
          value='2'
          hint='need review'
          tone='risk'
        />
        <MetricCard
          label='Budget pressure'
          value='£84k'
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
        <ProjectTable projects={filtered} />
      </Panel>
    </>
  )
}

export function TeamPage() {
  return (
    <>
      <PageHeader
        eyebrow='Tenant workspace'
        title='Team & organisation'
        description='People, roles, access, and workload visibility for the construction tenant.'
        action={<InviteDialog />}
      />
      <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          label='Members'
          value='34'
          hint='active users'
          tone='good'
        />
        <MetricCard label='Site teams' value='7' hint='project groups' />
        <MetricCard
          label='Pending invites'
          value='3'
          hint='awaiting signup'
          tone='risk'
        />
        <MetricCard label='Admins' value='4' hint='workspace owners' />
      </div>
      <Panel
        title='Core delivery team'
        description='Mock permissions and utilization'
        className='mt-4'
      >
        <div className='divide-y divide-border'>
          {team.map((member) => (
            <TeamRow key={member.email} {...member} />
          ))}
        </div>
      </Panel>
    </>
  )
}

export function TenantsPage() {
  const [query, setQuery] = useState('')
  const filtered = tenants.filter((tenant) =>
    `${tenant.organisation} ${tenant.slug} ${tenant.plan}`
      .toLowerCase()
      .includes(query.toLowerCase())
  )
  return (
    <>
      <PageHeader
        eyebrow='Platform admin'
        title='Tenants'
        description='Operator view for customer accounts, usage health, plans, and billing state.'
        action={<AddTenantDialog />}
      />
      <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          label='Tenants'
          value='128'
          hint='9 this month'
          tone='good'
        />
        <MetricCard label='Active users' value='3,412' hint='last 30 days' />
        <MetricCard label='Projects' value='1,047' hint='platform-wide' />
        <MetricCard
          label='Uptime'
          value='99.98%'
          hint='30-day avg'
          tone='good'
        />
      </div>
      <Panel
        title='All tenants'
        description='Searchable mock tenant table'
        className='mt-4'
        action={
          <Button variant='outline' size='sm'>
            Filter <ChevronDown className='size-3' />
          </Button>
        }
      >
        <div className='relative mb-4 max-w-md'>
          <Search className='absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className='rounded-sm border-border bg-background ps-9'
            placeholder='Search tenants...'
          />
        </div>
        <TenantTable tenants={filtered} />
      </Panel>
    </>
  )
}

export function SubscriptionsPage() {
  return (
    <>
      <PageHeader
        eyebrow='Platform admin'
        title='Subscriptions'
        description='Revenue, renewal, invoice, and plan-mix mockup for the admin side.'
      />
      <div className='grid gap-3 md:grid-cols-3'>
        <MetricCard
          label='Monthly recurring'
          value='£62.3k'
          hint='current run rate'
          tone='good'
        />
        <MetricCard
          label='Expansion revenue'
          value='£8.7k'
          hint='this quarter'
          tone='good'
        />
        <MetricCard label='Trial conversions' value='41%' hint='last 90 days' />
      </div>
      <div className='mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]'>
        <Panel title='Plan mix' description='Mock subscription tiers'>
          <div className='space-y-3'>
            {subscriptions.map((plan) => (
              <PlanRow key={plan.plan} {...plan} />
            ))}
          </div>
        </Panel>
        <Panel title='Invoices requiring attention'>
          <div className='divide-y divide-border'>
            {invoices.map((invoice) => (
              <InvoiceRow key={invoice.tenant} {...invoice} />
            ))}
          </div>
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

function NewProjectDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className='rounded-md text-xs'>
          <Plus className='size-3.5' /> New project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create project mockup</DialogTitle>
          <DialogDescription>
            This is frontend-only. The form demonstrates the intended workflow
            without saving data.
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
          <DialogDescription>
            Mock invite flow for team management.
          </DialogDescription>
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
          <Button>Send mock invite</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddTenantDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className='rounded-md text-xs'>
          <Plus className='size-3.5' /> Add tenant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add tenant</DialogTitle>
          <DialogDescription>
            Mock tenant provisioning flow for the platform admin.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-3 py-2'>
          <Input placeholder='Organisation name' />
          <Input placeholder='Workspace slug' />
          <Select defaultValue='business'>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='starter'>Starter</SelectItem>
              <SelectItem value='business'>Business</SelectItem>
              <SelectItem value='enterprise'>Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Button>Create tenant preview</Button>
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
                <div className='font-medium text-foreground'>
                  {project.name}
                </div>
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

function TenantTable({ tenants: rows }: { tenants: typeof tenants }) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full min-w-[900px] text-left text-xs'>
        <thead className='border-b border-border text-[10px] tracking-[0.14em] text-muted-foreground uppercase'>
          <tr>
            <th className='py-2 font-medium'>Organisation</th>
            <th className='py-2 font-medium'>Plan</th>
            <th className='py-2 font-medium'>Users</th>
            <th className='py-2 font-medium'>Projects</th>
            <th className='py-2 font-medium'>Health</th>
            <th className='py-2 font-medium'>MRR</th>
            <th className='py-2 font-medium'>Status</th>
            <th className='py-2 font-medium'>Last active</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-border'>
          {rows.map((tenant) => (
            <tr key={tenant.slug} className='hover:bg-muted/40'>
              <td className='py-3'>
                <div className='flex items-center gap-3'>
                  <div className='grid size-9 place-items-center rounded-sm bg-muted text-[11px] font-medium text-muted-foreground'>
                    {tenant.initials}
                  </div>
                  <div>
                    <div className='font-medium text-foreground'>
                      {tenant.organisation}
                    </div>
                    <div className='font-mono text-[11px] text-muted-foreground'>
                      {tenant.slug}
                    </div>
                  </div>
                </div>
              </td>
              <td className='py-3'>
                <StatusPill
                  tone={tenant.plan === 'Enterprise' ? 'good' : 'neutral'}
                >
                  {tenant.plan}
                </StatusPill>
              </td>
              <td className='py-3'>{tenant.users}</td>
              <td className='py-3'>{tenant.projects}</td>
              <td className='py-3'>
                <div className='flex items-center gap-2'>
                  <Progress
                    value={tenant.health}
                    className='h-2 w-24 bg-muted'
                  />
                  {tenant.health}%
                </div>
              </td>
              <td className='py-3'>{tenant.mrr}</td>
              <td className='py-3'>
                <StatusPill tone={tenantTone(tenant.status)}>
                  {tenant.status}
                </StatusPill>
              </td>
              <td className='py-3 text-muted-foreground'>
                {tenant.lastActive}
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
function TeamRow({
  name,
  role,
  email,
  projects,
  utilization,
  access,
}: {
  name: string
  role: string
  email: string
  projects: number
  utilization: number
  access: string
}) {
  return (
    <div className='grid gap-3 py-3 md:grid-cols-[1fr_180px_180px_110px] md:items-center'>
      <div>
        <div className='font-medium text-foreground'>{name}</div>
        <div className='text-xs text-muted-foreground'>{email}</div>
      </div>
      <div className='text-muted-foreground'>{role}</div>
      <div className='flex items-center gap-2'>
        <Progress value={utilization} className='h-2 w-24 bg-muted' />
        {utilization}%
      </div>
      <StatusPill>
        {access} · {projects}
      </StatusPill>
    </div>
  )
}
function PlanRow({
  plan,
  tenants,
  mrr,
  churnRisk,
  conversion,
}: {
  plan: string
  tenants: number
  mrr: string
  churnRisk: string
  conversion: number
}) {
  return (
    <div className='rounded-md border border-border bg-muted/40 p-3'>
      <div className='mb-3 flex items-center justify-between'>
        <div className='font-medium text-foreground'>{plan}</div>
        <StatusPill tone={churnRisk === 'Low' ? 'good' : 'risk'}>
          {churnRisk} risk
        </StatusPill>
      </div>
      <div className='grid grid-cols-3 gap-3 text-xs'>
        <div>
          <div className='text-muted-foreground'>Tenants</div>
          <div className='font-semibold'>{tenants}</div>
        </div>
        <div>
          <div className='text-muted-foreground'>MRR</div>
          <div className='font-semibold'>{mrr}</div>
        </div>
        <div>
          <div className='text-muted-foreground'>Conversion</div>
          <div className='font-semibold'>{conversion}%</div>
        </div>
      </div>
    </div>
  )
}
function InvoiceRow({
  tenant,
  amount,
  status,
  due,
}: {
  tenant: string
  amount: string
  status: string
  due: string
}) {
  return (
    <div className='flex items-center gap-3 py-3'>
      <div className='min-w-0 flex-1'>
        <div className='font-medium text-foreground'>{tenant}</div>
        <div className='text-xs text-muted-foreground'>Due {due}</div>
      </div>
      <div className='font-medium'>{amount}</div>
      <StatusPill
        tone={
          status === 'Paid' ? 'good' : status === 'Overdue' ? 'danger' : 'risk'
        }
      >
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
function tenantTone(status: string) {
  return status === 'Active'
    ? 'good'
    : status === 'At risk'
      ? 'risk'
      : status === 'Suspended'
        ? 'danger'
        : ('neutral' as const)
}
