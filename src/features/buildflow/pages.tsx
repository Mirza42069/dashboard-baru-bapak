import { ChevronDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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
  projects,
  subscriptions,
  systems,
  team,
  tenants,
} from './data'

export function TenantDashboard() {
  return (
    <>
      <PageHeader
        eyebrow='Construction manager'
        title='Portfolio overview'
        action={
          <div className='flex gap-2'>
            <Button
              variant='outline'
              className='h-8 rounded-[5px] bg-white text-xs font-normal'
            >
              Last 30 days
              <ChevronDown className='size-3' />
            </Button>
            <Button className='h-8 rounded-[5px] bg-[#686868] px-4 text-xs hover:bg-[#555]'>
              + New project
            </Button>
          </div>
        }
      />
      <div className='grid gap-3 md:grid-cols-4'>
        <MetricCard
          label='Overall progress'
          value='29%'
          hint='value-weighted'
        />
        <MetricCard label='Contract value' value='£405k' hint='BoQ total' />
        <MetricCard label='Items verified' value='1 / 9' hint='line items' />
        <MetricCard label='Schedule variance' value='−4 d' hint='vs baseline' />
      </div>

      <div className='mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]'>
        <Panel
          title='Active projects'
          action={
            <button className='text-xs text-slate-500'>View all →</button>
          }
        >
          <ProjectTable compact />
        </Panel>
        <Panel title='Connected systems'>
          <div className='divide-y divide-[#ececec]'>
            {systems.map((system) => (
              <div key={system.name} className='flex items-center gap-3 py-2.5'>
                <div className='flex size-8 items-center justify-center rounded-[5px] bg-[#ececec] text-[11px] text-slate-500'>
                  {system.initials}
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='font-medium'>{system.name}</div>
                  <div className='text-xs text-slate-400'>{system.type}</div>
                </div>
                <StatusPill muted={system.status === 'Not connected'}>
                  {system.status}
                </StatusPill>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className='mt-4 grid gap-4 xl:grid-cols-2'>
        <Panel title='Recent activity'>
          <div className='divide-y divide-[#ececec]'>
            {activity.map((item) => (
              <div
                key={`${item.actor}-${item.time}`}
                className='flex gap-3 py-2.5'
              >
                <span className='mt-1.5 size-1.5 rounded-full bg-slate-300' />
                <div>
                  <div>
                    <span className='font-semibold'>{item.actor}</span>{' '}
                    {item.action}
                  </div>
                  <div className='text-xs text-slate-400'>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title='Needs attention'>
          <div className='space-y-2'>
            {attentionItems.map((item) => (
              <div
                key={item.title}
                className='flex gap-3 rounded-[6px] border border-[#dedede] bg-[#fafafa] p-3'
              >
                <span className='mt-0.5 size-5 rounded border border-dashed border-slate-300' />
                <div>
                  <div className='font-medium'>{item.title}</div>
                  <div className='text-xs text-slate-400'>{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  )
}

export function ProjectsPage() {
  return (
    <>
      <PageHeader
        eyebrow='Tenant workspace'
        title='Projects'
        action={
          <Button className='h-8 rounded-[5px] bg-[#686868] text-xs hover:bg-[#555]'>
            <Plus className='size-3' /> New project
          </Button>
        }
      />
      <div className='grid gap-3 md:grid-cols-4'>
        <MetricCard label='Open projects' value='4' hint='across workspace' />
        <MetricCard
          label='Average progress'
          value='37%'
          hint='all active jobs'
        />
        <MetricCard label='At risk' value='1' hint='requires review' />
        <MetricCard label='Draft BoQs' value='2' hint='awaiting upload' />
      </div>
      <Panel title='Project register' className='mt-4'>
        <ProjectTable />
      </Panel>
    </>
  )
}

export function TeamPage() {
  return (
    <>
      <PageHeader eyebrow='Tenant workspace' title='Team & organisation' />
      <div className='grid gap-3 md:grid-cols-4'>
        <MetricCard label='Members' value='34' hint='active users' />
        <MetricCard label='Site teams' value='7' hint='project groups' />
        <MetricCard label='Pending invites' value='3' hint='awaiting signup' />
        <MetricCard label='Admins' value='4' hint='workspace owners' />
      </div>
      <Panel title='Core delivery team' className='mt-4'>
        <div className='divide-y divide-[#ececec]'>
          {team.map((member) => (
            <div
              key={member.email}
              className='grid gap-2 py-3 md:grid-cols-[1fr_1fr_120px] md:items-center'
            >
              <div>
                <div className='font-medium'>{member.name}</div>
                <div className='text-xs text-slate-400'>{member.email}</div>
              </div>
              <div className='text-slate-600'>{member.role}</div>
              <div className='text-xs text-slate-400'>
                {member.projects} projects
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}

export function TenantsPage() {
  return (
    <>
      <PageHeader eyebrow='Platform admin' title='Tenants' />
      <div className='grid gap-3 md:grid-cols-4'>
        <MetricCard label='Tenants' value='128' hint='9 this month' />
        <MetricCard label='Active users' value='3,412' hint='last 30 days' />
        <MetricCard label='Projects' value='1,047' hint='platform-wide' />
        <MetricCard label='Uptime' value='99.98%' hint='30-day avg' />
      </div>
      <Panel
        title='All tenants'
        className='mt-4'
        action={
          <div className='flex gap-2'>
            <Button
              variant='outline'
              className='h-8 rounded-[5px] bg-white text-xs font-normal'
            >
              Filter <ChevronDown className='size-3' />
            </Button>
            <Button className='h-8 rounded-[5px] bg-[#686868] text-xs hover:bg-[#555]'>
              + Add tenant
            </Button>
          </div>
        }
      >
        <TenantTable />
      </Panel>
    </>
  )
}

export function SubscriptionsPage() {
  return (
    <>
      <PageHeader eyebrow='Platform admin' title='Subscriptions' />
      <div className='grid gap-3 md:grid-cols-3'>
        <MetricCard
          label='Monthly recurring'
          value='£62.3k'
          hint='current run rate'
        />
        <MetricCard
          label='Expansion revenue'
          value='£8.7k'
          hint='this quarter'
        />
        <MetricCard label='Trial conversions' value='41%' hint='last 90 days' />
      </div>
      <Panel title='Plan mix' className='mt-4'>
        <div className='divide-y divide-[#ececec]'>
          {subscriptions.map((plan) => (
            <div
              key={plan.plan}
              className='grid gap-2 py-3 md:grid-cols-[1fr_140px_140px_140px] md:items-center'
            >
              <div className='font-medium'>{plan.plan}</div>
              <div>{plan.tenants} tenants</div>
              <div>{plan.mrr} MRR</div>
              <StatusPill>{plan.churnRisk} risk</StatusPill>
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}

export function HelpCenterPage() {
  return (
    <EmptyPage
      title='Help & support'
      description='Support articles, onboarding checklists, and release notes will sit here.'
    />
  )
}

function ProjectTable({ compact = false }: { compact?: boolean }) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full min-w-[620px] text-left text-xs'>
        <thead className='border-b border-[#e5e5e5] text-[10px] tracking-[0.14em] text-slate-400 uppercase'>
          <tr>
            <th className='py-2 font-normal'>Project</th>
            <th className='py-2 font-normal'>Code</th>
            <th className='py-2 font-normal'>Progress</th>
            {!compact && <th className='py-2 font-normal'>Value</th>}
            <th className='py-2 font-normal'>Status</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-[#ececec]'>
          {projects.map((project) => (
            <tr key={project.code}>
              <td className='py-3'>
                <div className='font-medium'>{project.name}</div>
                <div className='text-slate-400'>
                  {compact
                    ? project.owner
                    : `${project.owner} · ${project.stage}`}
                </div>
              </td>
              <td className='py-3 font-mono text-[11px] text-slate-500'>
                {project.code}
              </td>
              <td className='py-3'>
                <div className='flex items-center gap-3'>
                  <Progress
                    value={project.progress}
                    className='h-1.5 w-32 bg-[#e8e8e8]'
                  />
                  <span className='w-8 text-[11px]'>{project.progress}%</span>
                </div>
              </td>
              {!compact && <td className='py-3'>{project.value}</td>}
              <td className='py-3'>
                <StatusPill>{project.status}</StatusPill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TenantTable() {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full min-w-[820px] text-left text-xs'>
        <thead className='border-b border-[#e5e5e5] text-[10px] tracking-[0.14em] text-slate-400 uppercase'>
          <tr>
            <th className='py-2 font-normal'>Organisation</th>
            <th className='py-2 font-normal'>Plan</th>
            <th className='py-2 font-normal'>Users</th>
            <th className='py-2 font-normal'>Projects</th>
            <th className='py-2 font-normal'>Status</th>
            <th className='py-2 font-normal'>Last active</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-[#ececec]'>
          {tenants.map((tenant) => (
            <tr key={tenant.slug}>
              <td className='py-3'>
                <div className='flex items-center gap-3'>
                  <div className='flex size-8 items-center justify-center rounded-[5px] bg-[#e6e6e6] text-[11px] text-slate-500'>
                    {tenant.initials}
                  </div>
                  <div>
                    <div className='font-medium'>{tenant.organisation}</div>
                    <div className='font-mono text-[11px] text-slate-400'>
                      {tenant.slug}
                    </div>
                  </div>
                </div>
              </td>
              <td className='py-3'>
                <StatusPill muted={tenant.plan === 'Starter'}>
                  {tenant.plan}
                </StatusPill>
              </td>
              <td className='py-3'>{tenant.users}</td>
              <td className='py-3'>{tenant.projects}</td>
              <td className='py-3'>
                <StatusPill muted={tenant.status === 'Suspended'}>
                  {tenant.status}
                </StatusPill>
              </td>
              <td className='py-3 text-slate-500'>{tenant.lastActive}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
