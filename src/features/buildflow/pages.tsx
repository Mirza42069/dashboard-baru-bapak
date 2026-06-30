import { type FormEvent, useDeferredValue, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowUpRight,
  ChevronDown,
  CircleAlert,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import {
  createClient,
  createMember,
  createProject,
  getMe,
  listClients,
  listMembers,
  listProjects,
  type Client,
  type Project as ApiProject,
  type TenantMember,
} from '@/lib/auth-api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  EmptyState,
  EmptyPage,
  MetricCard,
  PageHeader,
  Panel,
  StatusPill,
} from './components'
import { activity, attentionItems, milestones, portfolioMetrics } from './data'

export function TenantDashboard() {
  const { auth } = useAuthStore()
  const [rows, setRows] = useState<ApiProject[]>([])
  const token = auth.accessToken

  useEffect(() => {
    if (!token) return
    async function loadProjects() {
      try {
        const res = await listProjects(token)
        setRows(res.data)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to load projects.'
        )
      }
    }

    void loadProjects()
  }, [token])

  const activeProjects = rows.filter((project) => project.status === 'active')
  const pausedProjects = rows.filter((project) => project.status === 'on_hold')
  const setupProjects = rows.filter((project) => project.status === 'planning')
  const incompleteProjects = rows.filter(
    (project) =>
      !project.managers.length ||
      !project.contract_start ||
      !project.contract_finish ||
      !project.schedule_start
  )
  const actionProjects = [...incompleteProjects, ...pausedProjects]
    .filter(
      (project, index, arr) =>
        arr.findIndex((item) => item.id === project.id) === index
    )
    .slice(0, 5)

  return (
    <>
      <PageHeader title='Portfolio command centre' />
      <Panel
        title='Project command panel'
        description='Prioritised setup and follow-up actions. Use Projects for the full register.'
        className='mt-2 border-primary/20 bg-card/95 p-5 shadow-md'
        action={
          <Button variant='ghost' size='sm' asChild>
            <Link to='/projects'>
              Details <ArrowUpRight className='size-3' />
            </Link>
          </Button>
        }
      >
        <div className='mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
          <ProjectSummaryTile
            label='Total projects'
            value={String(rows.length)}
          />
          <ProjectSummaryTile
            label='Active now'
            value={String(activeProjects.length)}
            tone='good'
          />
          <ProjectSummaryTile
            label='Planning setup'
            value={String(setupProjects.length)}
            tone='risk'
          />
          <ProjectSummaryTile
            label='Needs action'
            value={String(actionProjects.length)}
            tone='risk'
          />
        </div>
      </Panel>
      <div className='mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
        {portfolioMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>
      <div className='mt-6 grid gap-4 xl:grid-cols-[1.35fr_0.9fr]'>
        <Panel title='Needs attention'>
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
      <div className='mt-6 grid gap-4 xl:grid-cols-2'>
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

function ProjectSummaryTile({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string
  value: string
  hint?: string
  tone?: 'good' | 'risk' | 'neutral'
}) {
  return (
    <div className='rounded-md border border-border bg-background/70 p-3'>
      <div className='flex items-center justify-between gap-3 text-xs text-muted-foreground'>
        <span>{label}</span>
        <span
          className={`size-2 rounded-full ${
            tone === 'good'
              ? 'bg-emerald-500'
              : tone === 'risk'
                ? 'bg-amber-500'
                : 'bg-muted-foreground/35'
          }`}
        />
      </div>
      <div className='mt-2 text-xl font-semibold tracking-tight text-foreground'>
        {value}
      </div>
      {hint && (
        <div className='mt-1 text-[11px] text-muted-foreground'>{hint}</div>
      )}
    </div>
  )
}

export function ProjectsPage() {
  const { auth } = useAuthStore()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [rows, setRows] = useState<ApiProject[]>([])
  const [loading, setLoading] = useState(true)
  const deferredQuery = useDeferredValue(query)
  const token = auth.accessToken
  const filtered = rows.filter((project) => {
    const managers = project.managers
      .map((m) => m.full_name || m.email)
      .join(' ')
    const matchesQuery =
      `${project.name} ${project.code ?? ''} ${project.client.name} ${managers}`
        .toLowerCase()
        .includes(deferredQuery.toLowerCase())
    const matchesStatus = status === 'all' || project.status === status
    return matchesQuery && matchesStatus
  })

  async function refreshProjects() {
    if (!token) return
    setLoading(true)
    try {
      const res = await listProjects(token)
      setRows(res.data)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to load projects.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    async function loadProjects() {
      try {
        const res = await listProjects(token)
        setRows(res.data)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to load projects.'
        )
      } finally {
        setLoading(false)
      }
    }

    void loadProjects()
  }, [token])

  return (
    <>
      <PageHeader
        title='Projects'
        action={<NewProjectDialog onCreated={refreshProjects} />}
      />
      <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          label='Open projects'
          value={String(rows.length)}
          tone='good'
        />
        <MetricCard label='Average progress' value='0%' />
        <MetricCard label='At risk / delayed' value='0' tone='risk' />
        <MetricCard label='Budget pressure' value='Rp 0' tone='risk' />
      </div>
      <Panel
        title='Project register'
        className='mt-6'
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
              <SelectItem value='planning'>Planning</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='on_hold'>On hold</SelectItem>
              <SelectItem value='completed'>Completed</SelectItem>
              <SelectItem value='cancelled'>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {loading ? (
            <EmptyState message='Loading projects...' />
          ) : filtered.length ? (
            filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          ) : (
            <EmptyState message='No projects available.' />
          )}
          <NewProjectDialog
            onCreated={refreshProjects}
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

function ProjectCard({ project }: { project: ApiProject }) {
  const managers = project.managers
    .map((m) => m.full_name || m.email)
    .join(', ')
  return (
    <Link
      to='/projects/$id'
      params={{ id: project.id }}
      className='block rounded-md border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='font-medium text-foreground'>{project.name}</div>
        <StatusPill tone={statusTone(project.status)}>
          {project.status}
        </StatusPill>
      </div>
      <div className='my-1 font-mono text-[11px] text-muted-foreground'>
        {project.code || 'No code'} · {project.client.name}
      </div>
      <div className='text-[11px] text-muted-foreground'>
        {managers || 'No manager assigned'}
      </div>
      <div className='mt-3 flex items-center gap-3'>
        <Progress value={0} className='h-2 flex-1 bg-muted' />
        <span className='font-mono text-[11px] text-muted-foreground'>0%</span>
      </div>
    </Link>
  )
}

const MEMBER_GRID = '1.4fr 1.6fr 1.3fr 90px 90px'
const emptyMemberForm = { full_name: '', email: '', password: '' }

const memberInitials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

const roleLabel = (role: string) => {
  if (role === 'admin') return 'Admin'
  if (role === 'project_manager') return 'Manager'
  if (role === 'field_engineer') return 'Field Engineer'
  if (role === 'viewer') return 'Viewer'
  return role
}

const primaryRole = (member: TenantMember) =>
  member.assignments[0]?.role
    ? roleLabel(member.assignments[0].role)
    : 'No role'

export function TeamPage() {
  const { auth } = useAuthStore()
  const [members, setMembers] = useState<TenantMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyMemberForm)
  const token = auth.accessToken
  const canManageMembers =
    auth.user?.permissions?.tenant.includes('member.manage') ?? false

  async function refreshMembers() {
    if (!token) return
    setLoading(true)
    try {
      const res = await listMembers(token)
      setMembers(res.data)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to load members.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    async function hydrateUser() {
      if (auth.user) return
      try {
        const me = await getMe(token)
        auth.setUser({
          id: me.user.id,
          email: me.user.email,
          full_name: me.user.full_name,
          tenant: me.tenant,
          permissions: me.permissions,
        })
      } catch {
        // Route auth owns redirects; this page only needs permissions for UI gating.
      }
    }

    void hydrateUser()
  }, [auth, token])

  useEffect(() => {
    if (!token) return
    async function loadMembers() {
      try {
        const res = await listMembers(token)
        setMembers(res.data)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to load members.'
        )
      } finally {
        setLoading(false)
      }
    }

    void loadMembers()
  }, [token])

  async function submitMember(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    setSaving(true)
    try {
      await createMember(token, form)
      toast.success('Manager account created.')
      setForm(emptyMemberForm)
      setOpen(false)
      await refreshMembers()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to create member.'
      )
    } finally {
      setSaving(false)
    }
  }

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
            {canManageMembers && (
              <CreateMemberDialog
                open={open}
                onOpenChange={setOpen}
                form={form}
                setForm={setForm}
                onSubmit={submitMember}
                saving={saving}
              />
            )}
          </div>
        }
      >
        <div className='overflow-x-auto'>
          {loading ? (
            <EmptyState message='Loading members...' />
          ) : members.length ? (
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
                      {memberInitials(m.full_name || m.email)}
                    </span>
                    <span className='font-medium text-foreground'>
                      {m.full_name || m.email}
                    </span>
                  </div>
                  <div className='text-[11px] text-muted-foreground'>
                    {m.email}
                  </div>
                  <div className='flex max-w-44 items-center justify-between rounded-md border border-border px-2.5 py-1.5 text-foreground'>
                    <span>{primaryRole(m)}</span>
                    <ChevronDown className='size-3 text-muted-foreground' />
                  </div>
                  <div className='font-mono text-muted-foreground'>0</div>
                  <div>
                    <StatusPill tone={m.status === 'active' ? 'good' : 'muted'}>
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

const emptyProjectForm = {
  client_id: '',
  name: '',
  code: '',
  description: '',
  location: '',
  contract_no: '',
  contract_start: '',
  contract_finish: '',
  period_type: 'weekly' as ApiProject['period_type'],
  schedule_start: '',
  manager_user_ids: [] as string[],
}

const emptyClientForm = { name: '', code: '' }

function hasManagerRole(member: TenantMember) {
  return (
    member.status === 'active' &&
    member.assignments.some(
      (assignment) => assignment.role === 'project_manager'
    )
  )
}

function NewProjectDialog({
  trigger,
  onCreated,
}: {
  trigger?: React.ReactNode
  onCreated?: () => Promise<void> | void
}) {
  const { auth } = useAuthStore()
  const token = auth.accessToken
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyProjectForm)
  const [clientForm, setClientForm] = useState(emptyClientForm)
  const [clients, setClients] = useState<Client[]>([])
  const [members, setMembers] = useState<TenantMember[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [creatingClient, setCreatingClient] = useState(false)
  const managers = members.filter(hasManagerRole)

  useEffect(() => {
    if (!open || !token) return
    async function loadOptions() {
      setLoadingOptions(true)
      try {
        const [clientRes, memberRes] = await Promise.all([
          listClients(token),
          listMembers(token),
        ])
        setClients(clientRes.data)
        setMembers(memberRes.data)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to load project options.'
        )
      } finally {
        setLoadingOptions(false)
      }
    }

    void loadOptions()
  }, [open, token])

  const toggleManager = (memberId: string) => {
    setForm((current) => ({
      ...current,
      manager_user_ids: current.manager_user_ids.includes(memberId)
        ? current.manager_user_ids.filter((id) => id !== memberId)
        : [...current.manager_user_ids, memberId],
    }))
  }

  async function submitClient(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    setCreatingClient(true)
    try {
      const res = await createClient(token, {
        name: clientForm.name,
        code: clientForm.code || null,
      })
      setClients((current) => [res.client, ...current])
      setForm((current) => ({ ...current, client_id: res.client.id }))
      setClientForm(emptyClientForm)
      toast.success('Client created and selected.')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to create client.'
      )
    } finally {
      setCreatingClient(false)
    }
  }

  async function submitProject(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    if (!form.manager_user_ids.length) {
      toast.error('Select at least one project manager.')
      return
    }
    setSaving(true)
    try {
      await createProject(token, {
        client_id: form.client_id,
        name: form.name,
        code: form.code,
        description: form.description || null,
        location: form.location || null,
        contract_no: form.contract_no || null,
        contract_start: form.contract_start || null,
        contract_finish: form.contract_finish || null,
        period_type: form.period_type,
        schedule_start: form.schedule_start,
        manager_user_ids: form.manager_user_ids,
      })
      toast.success('Project created.')
      setForm(emptyProjectForm)
      setOpen(false)
      await onCreated?.()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to create project.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className='rounded-md text-xs'>
            <Plus className='size-3.5' /> New project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>
            Register contract details, schedule setup, client, and assigned
            project managers.
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[75vh] overflow-y-auto pr-1'>
          <div className='mb-4 rounded-md border border-border bg-muted/30 p-3'>
            <div className='mb-2 text-sm font-medium text-foreground'>
              Client
            </div>
            <div className='grid gap-3 md:grid-cols-[1fr_1fr_auto]'>
              <div className='grid gap-2'>
                <Label htmlFor='project-client'>Existing client</Label>
                <Select
                  value={form.client_id}
                  onValueChange={(client_id) => setForm({ ...form, client_id })}
                  disabled={loadingOptions || !clients.length}
                >
                  <SelectTrigger id='project-client'>
                    <SelectValue
                      placeholder={
                        clients.length ? 'Select client' : 'No clients yet'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                        {client.code ? ` (${client.code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <form className='contents' onSubmit={submitClient}>
                <div className='grid gap-2'>
                  <Label htmlFor='new-client-name'>New client</Label>
                  <Input
                    id='new-client-name'
                    placeholder='Client name'
                    value={clientForm.name}
                    onChange={(e) =>
                      setClientForm({ ...clientForm, name: e.target.value })
                    }
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='new-client-code'>Code</Label>
                  <div className='flex gap-2'>
                    <Input
                      id='new-client-code'
                      placeholder='Optional'
                      value={clientForm.code}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, code: e.target.value })
                      }
                    />
                    <Button
                      type='submit'
                      disabled={!clientForm.name || creatingClient}
                    >
                      {creatingClient ? 'Adding...' : 'Add'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <form className='grid gap-4' onSubmit={submitProject}>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='grid gap-2'>
                <Label htmlFor='project-name'>Project name</Label>
                <Input
                  id='project-name'
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='project-code'>Project code</Label>
                <Input
                  id='project-code'
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='project-description'>Description</Label>
              <Textarea
                id='project-description'
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder='Scope summary, package notes, or delivery objective'
              />
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='grid gap-2'>
                <Label htmlFor='project-location'>Location</Label>
                <Input
                  id='project-location'
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='contract-no'>Contract number</Label>
                <Input
                  id='contract-no'
                  value={form.contract_no}
                  onChange={(e) =>
                    setForm({ ...form, contract_no: e.target.value })
                  }
                />
              </div>
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='grid gap-2'>
                <Label htmlFor='contract-start'>Contract start</Label>
                <Input
                  id='contract-start'
                  type='date'
                  value={form.contract_start}
                  onChange={(e) =>
                    setForm({ ...form, contract_start: e.target.value })
                  }
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='contract-finish'>Contract finish</Label>
                <Input
                  id='contract-finish'
                  type='date'
                  value={form.contract_finish}
                  onChange={(e) =>
                    setForm({ ...form, contract_finish: e.target.value })
                  }
                />
              </div>
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='grid gap-2'>
                <Label htmlFor='period-type'>Reporting period</Label>
                <Select
                  value={form.period_type}
                  onValueChange={(period_type: ApiProject['period_type']) =>
                    setForm({ ...form, period_type })
                  }
                >
                  <SelectTrigger id='period-type'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='weekly'>Weekly</SelectItem>
                    <SelectItem value='biweekly'>Biweekly</SelectItem>
                    <SelectItem value='monthly'>Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='schedule-start'>Schedule start</Label>
                <Input
                  id='schedule-start'
                  type='date'
                  value={form.schedule_start}
                  onChange={(e) =>
                    setForm({ ...form, schedule_start: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className='grid gap-2'>
              <Label>Project managers</Label>
              <div className='grid gap-2 rounded-md border border-border p-3'>
                {loadingOptions ? (
                  <div className='text-xs text-muted-foreground'>
                    Loading managers...
                  </div>
                ) : managers.length ? (
                  managers.map((member) => {
                    const selected = form.manager_user_ids.includes(member.id)
                    return (
                      <button
                        key={member.id}
                        type='button'
                        onClick={() => toggleManager(member.id)}
                        className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition ${
                          selected
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <span>
                          <span className='font-medium'>
                            {member.full_name || member.email}
                          </span>
                          <span className='block text-muted-foreground'>
                            {member.email}
                          </span>
                        </span>
                        <span>{selected ? 'Assigned' : 'Assign'}</span>
                      </button>
                    )
                  })
                ) : (
                  <div className='text-xs text-muted-foreground'>
                    No active Manager members available. Create a Manager
                    account from Team first.
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={
                  saving ||
                  !form.client_id ||
                  !form.name ||
                  !form.code ||
                  !form.schedule_start ||
                  !form.manager_user_ids.length
                }
              >
                {saving ? 'Creating...' : 'Create project'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CreateMemberDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSubmit,
  saving,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: typeof emptyMemberForm
  setForm: (form: typeof emptyMemberForm) => void
  onSubmit: (event: FormEvent) => void
  saving: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className='rounded-md text-xs'>
          <Plus className='size-3.5' /> Create member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create member</DialogTitle>
          <DialogDescription>
            Create a Manager account with an email and password.
          </DialogDescription>
        </DialogHeader>
        <form className='grid gap-4' onSubmit={onSubmit}>
          <div className='grid gap-2'>
            <Label htmlFor='member-name'>Full name</Label>
            <Input
              id='member-name'
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='member-email'>Email</Label>
            <Input
              id='member-email'
              type='email'
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='member-password'>Password</Label>
            <Input
              id='member-password'
              type='password'
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div className='rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground'>
            Role: Manager
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button disabled={saving}>
              {saving ? 'Creating...' : 'Create member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
  return status === 'On track' || status === 'active' || status === 'completed'
    ? 'good'
    : status === 'At risk' || status === 'planning' || status === 'on_hold'
      ? 'risk'
      : status === 'Delayed' || status === 'cancelled'
        ? 'danger'
        : ('muted' as const)
}
