import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Building2, Edit, LogOut, Plus, ShieldPlus, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import {
  cancelPlatformTenant,
  createPlatformTenant,
  createPlatformTenantAdmin,
  listPlatformTenantMembers,
  listPlatformTenants,
  platformLogout,
  type PlatformTenant,
  type PlatformTenantMember,
  updatePlatformTenant,
} from '@/lib/auth-api'
import { useAuthStore } from '@/stores/auth-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const emptyTenantForm = { name: '', slug: '', status: 'active' as PlatformTenant['status'] }
const emptyAdminForm = { email: '', password: '', full_name: '' }

function normalizeTenantSlug(slug: string) {
  return slug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
}

export function PlatformConsole() {
  const navigate = useNavigate()
  const { platform } = useAuthStore()
  const admin = platform.admin
  const token = platform.accessToken
  const [tenants, setTenants] = useState<PlatformTenant[]>([])
  const [members, setMembers] = useState<PlatformTenantMember[]>([])
  const [selectedTenant, setSelectedTenant] = useState<PlatformTenant | null>(null)
  const [tenantForm, setTenantForm] = useState(emptyTenantForm)
  const [adminForm, setAdminForm] = useState(emptyAdminForm)
  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)

  async function refreshTenants() {
    if (!token) return
    setLoading(true)
    try {
      const res = await listPlatformTenants(token)
      setTenants(res.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load tenants.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshTenants()
  }, [token])

  const signOut = () => {
    if (token) void platformLogout(token)
    platform.reset()
    navigate({ to: '/platform/sign-in', replace: true })
  }

  const openCreate = () => {
    setTenantForm(emptyTenantForm)
    setCreateOpen(true)
  }

  const openEdit = (tenant: PlatformTenant) => {
    setSelectedTenant(tenant)
    setTenantForm({ name: tenant.name, slug: tenant.slug, status: tenant.status })
    setEditOpen(true)
  }

  const openAdmin = (tenant: PlatformTenant) => {
    setSelectedTenant(tenant)
    setAdminForm(emptyAdminForm)
    setAdminOpen(true)
  }

  const openMembers = async (tenant: PlatformTenant) => {
    if (!token) return
    setSelectedTenant(tenant)
    setMembers([])
    setMembersOpen(true)
    setMembersLoading(true)
    try {
      const res = await listPlatformTenantMembers(token, tenant.id)
      setMembers(res.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load members.')
    } finally {
      setMembersLoading(false)
    }
  }

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    setSaving(true)
    try {
      await createPlatformTenant(token, {
        name: tenantForm.name,
        slug: normalizeTenantSlug(tenantForm.slug),
      })
      toast.success('Tenant organization created.')
      setCreateOpen(false)
      await refreshTenants()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create tenant.')
    } finally {
      setSaving(false)
    }
  }

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token || !selectedTenant) return
    setSaving(true)
    try {
      await updatePlatformTenant(token, selectedTenant.id, {
        ...tenantForm,
        slug: normalizeTenantSlug(tenantForm.slug),
      })
      toast.success('Tenant organization updated.')
      setEditOpen(false)
      await refreshTenants()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update tenant.')
    } finally {
      setSaving(false)
    }
  }

  const submitAdmin = async (event: FormEvent) => {
    event.preventDefault()
    if (!token || !selectedTenant) return
    setSaving(true)
    try {
      await createPlatformTenantAdmin(token, selectedTenant.id, adminForm)
      toast.success('Tenant admin created.')
      setAdminOpen(false)
      await refreshTenants()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create tenant admin.')
    } finally {
      setSaving(false)
    }
  }

  const cancelTenant = async (tenant: PlatformTenant) => {
    if (!token) return
    setSaving(true)
    try {
      await cancelPlatformTenant(token, tenant.id)
      toast.success(`${tenant.name} marked as cancelled.`)
      await refreshTenants()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel tenant.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className='min-h-svh bg-muted/30'>
      <header className='border-b bg-background'>
        <div className='mx-auto flex max-w-7xl items-center justify-between px-6 py-4'>
          <div>
            <p className='text-sm font-medium text-muted-foreground'>Operator console</p>
            <h1 className='text-xl font-semibold tracking-tight'>Platform administration</h1>
          </div>
          <div className='flex items-center gap-3'>
            <div className='hidden text-end text-sm sm:block'>
              <p className='font-medium'>{admin?.full_name || 'Platform admin'}</p>
              <p className='text-xs text-muted-foreground'>{admin?.email}</p>
            </div>
            <Button variant='outline' onClick={signOut}>
              <LogOut />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <section className='mx-auto grid max-w-7xl gap-6 px-6 py-8'>
        <div className='grid gap-4 md:grid-cols-3'>
          <SummaryCard icon={Building2} label='Tenant organizations' value={tenants.length} />
          <SummaryCard icon={ShieldPlus} label='Owned organizations' value={tenants.filter((t) => t.owner_user_id).length} />
          <SummaryCard icon={Users} label='Active organizations' value={tenants.filter((t) => t.status === 'active').length} />
        </div>

        <Card>
          <CardHeader className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <CardTitle>Tenant organizations</CardTitle>
              <CardDescription>Create, update, cancel, and inspect tenant organizations.</CardDescription>
            </div>
            <Button onClick={openCreate}>
              <Plus />
              New tenant
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner admin</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className='text-end'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5}>Loading tenants...</TableCell></TableRow>
                ) : tenants.length ? (
                  tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className='font-medium'>{tenant.name}</div>
                        <div className='text-xs text-muted-foreground'>{tenant.slug}</div>
                      </TableCell>
                      <TableCell><StatusBadge status={tenant.status} /></TableCell>
                      <TableCell className='text-sm text-muted-foreground'>
                        {tenant.owner_user_id ? 'Assigned' : 'Not assigned'}
                      </TableCell>
                      <TableCell>{new Date(tenant.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className='flex justify-end gap-2'>
                          <Button variant='outline' size='sm' onClick={() => openMembers(tenant)}>
                            <Users /> Members
                          </Button>
                          <Button variant='outline' size='sm' onClick={() => openAdmin(tenant)}>
                            <ShieldPlus /> Admin
                          </Button>
                          <Button variant='outline' size='sm' onClick={() => openEdit(tenant)}>
                            <Edit /> Edit
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            disabled={tenant.status === 'cancelled' || saving}
                            onClick={() => cancelTenant(tenant)}
                          >
                            <Trash2 /> Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5}>No tenant organizations yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <TenantDialog
        title='Create tenant organization'
        description='Provision a new firm in the platform.'
        open={createOpen}
        onOpenChange={setCreateOpen}
        form={tenantForm}
        setForm={setTenantForm}
        onSubmit={submitCreate}
        saving={saving}
        mode='create'
      />
      <TenantDialog
        title='Edit tenant organization'
        description='Update organization metadata or lifecycle status.'
        open={editOpen}
        onOpenChange={setEditOpen}
        form={tenantForm}
        setForm={setTenantForm}
        onSubmit={submitEdit}
        saving={saving}
        mode='edit'
      />
      <AdminDialog
        open={adminOpen}
        onOpenChange={setAdminOpen}
        tenant={selectedTenant}
        form={adminForm}
        setForm={setAdminForm}
        onSubmit={submitAdmin}
        saving={saving}
      />
      <MembersDialog
        open={membersOpen}
        onOpenChange={setMembersOpen}
        tenant={selectedTenant}
        members={members}
        loading={membersLoading}
      />
    </main>
  )
}

function SummaryCard({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <Icon className='size-5 text-primary' />
        <CardTitle className='text-2xl'>{value}</CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
    </Card>
  )
}

function StatusBadge({ status }: { status: PlatformTenant['status'] }) {
  const variant = status === 'cancelled' ? 'destructive' : status === 'suspended' ? 'secondary' : 'default'
  return <Badge variant={variant}>{status}</Badge>
}

type TenantForm = typeof emptyTenantForm

function TenantDialog({ title, description, open, onOpenChange, form, setForm, onSubmit, saving, mode }: {
  title: string
  description: string
  open: boolean
  onOpenChange: (open: boolean) => void
  form: TenantForm
  setForm: (form: TenantForm) => void
  onSubmit: (event: FormEvent) => void
  saving: boolean
  mode: 'create' | 'edit'
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form className='grid gap-4' onSubmit={onSubmit}>
          <div className='grid gap-2'>
            <Label htmlFor={`${mode}-tenant-name`}>Name</Label>
            <Input id={`${mode}-tenant-name`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor={`${mode}-tenant-slug`}>Slug</Label>
            <Input
              id={`${mode}-tenant-slug`}
              value={form.slug}
              pattern='[a-z0-9-]+'
              onChange={(e) => setForm({ ...form, slug: normalizeTenantSlug(e.target.value) })}
              required
            />
            <p className='text-xs text-muted-foreground'>Lowercase letters, numbers, and hyphens only. Uppercase input is converted automatically.</p>
          </div>
          {mode === 'edit' && (
            <div className='grid gap-2'>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(status: PlatformTenant['status']) => setForm({ ...form, status })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='suspended'>Suspended</SelectItem>
                  <SelectItem value='cancelled'>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AdminDialog({ open, onOpenChange, tenant, form, setForm, onSubmit, saving }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: PlatformTenant | null
  form: typeof emptyAdminForm
  setForm: (form: typeof emptyAdminForm) => void
  onSubmit: (event: FormEvent) => void
  saving: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create tenant admin</DialogTitle>
          <DialogDescription>Apply an admin account to {tenant?.name || 'this organization'}.</DialogDescription>
        </DialogHeader>
        <form className='grid gap-4' onSubmit={onSubmit}>
          <div className='grid gap-2'>
            <Label htmlFor='admin-name'>Full name</Label>
            <Input id='admin-name' value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='admin-email'>Email</Label>
            <Input id='admin-email' type='email' value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='admin-password'>Password</Label>
            <Input id='admin-password' type='password' minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={saving}>{saving ? 'Creating...' : 'Create admin'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MembersDialog({ open, onOpenChange, tenant, members, loading }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: PlatformTenant | null
  members: PlatformTenantMember[]
  loading: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{tenant?.name || 'Tenant'} members</DialogTitle>
          <DialogDescription>Users and role assignments inside this tenant organization.</DialogDescription>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Roles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3}>Loading members...</TableCell></TableRow>
            ) : members.length ? (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className='font-medium'>{member.full_name}</div>
                    <div className='text-xs text-muted-foreground'>{member.email}</div>
                  </TableCell>
                  <TableCell>{member.status}</TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {member.assignments.length
                        ? member.assignments.map((assignment) => <Badge key={assignment.id} variant='outline'>{assignment.role}</Badge>)
                        : <span className='text-xs text-muted-foreground'>No roles</span>}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={3}>No members found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  )
}
