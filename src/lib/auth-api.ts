// Minimal fetch wrapper for the auth endpoints. Proxied to the backend in dev
// (see vite.config.ts). credentials:'include' carries the httpOnly refresh cookie.
const BASE = '/api/v1'

async function errorMessage(res: Response) {
  try {
    const body = await res.json()
    return body?.error?.message ?? `Request failed (${res.status})`
  } catch {
    return `Request failed (${res.status})`
  }
}

export type LoginResult = { access_token: string; token_type: string; expires_in: number }

export type PlatformAdmin = {
  id: string
  email: string
  full_name: string
  role: string
  status: string
}

export type PlatformTenant = {
  id: string
  name: string
  slug: string
  status: 'active' | 'suspended' | 'cancelled'
  owner_user_id: string | null
  created_at: string
  updated_at?: string
}

export type PlatformTenantMember = {
  id: string
  email: string
  full_name: string
  status: string
  created_at: string
  assignments: {
    id: string
    role: string
    scope_type: string
    scope_id: string | null
  }[]
}

export type TenantMember = {
  id: string
  email: string
  full_name: string
  status: string
  assignments: {
    id: string
    role: string
    scope_type: string
    scope_id: string | null
  }[]
}

export type Client = {
  id: string
  name: string
  code: string | null
  contact: Record<string, unknown>
  created_at: string
}

export type Project = {
  id: string
  client_id: string
  client: { id: string; name: string }
  name: string
  code: string | null
  description: string | null
  location: string | null
  contract_no: string | null
  contract_value: string | number | null
  contract_start: string | null
  contract_finish: string | null
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  period_type: 'weekly' | 'biweekly' | 'monthly'
  schedule_start: string | null
  data_date: string | null
  created_at: string
  managers: Pick<TenantMember, 'id' | 'email' | 'full_name'>[]
}

export type Me = {
  user: { id: string; email: string; full_name: string; status: string }
  tenant: { id: string; name: string; slug: string }
  assignments: { id: string; role: string; scope_type: string; scope_id: string | null }[]
  permissions: { tenant: string[]; by_scope: Record<string, string[]> }
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function platformLogin(
  email: string,
  password: string
): Promise<LoginResult> {
  const res = await fetch(`${BASE}/platform/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function getMe(token: string): Promise<Me> {
  const res = await fetch(`${BASE}/auth/me`, {
    headers: { authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function getPlatformMe(
  token: string
): Promise<{ admin: PlatformAdmin }> {
  const res = await fetch(`${BASE}/platform/auth/me`, {
    headers: { authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

// Best-effort server-side session revoke; ignore network/HTTP failures.
export async function logout(token: string): Promise<void> {
  await fetch(`${BASE}/auth/logout`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    credentials: 'include',
  }).catch(() => {})
}

export async function platformLogout(token: string): Promise<void> {
  await fetch(`${BASE}/platform/auth/logout`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    credentials: 'include',
  }).catch(() => {})
}

function platformJsonHeaders(token: string) {
  return {
    'content-type': 'application/json',
    authorization: `Bearer ${token}`,
  }
}

function tenantJsonHeaders(token: string) {
  return {
    'content-type': 'application/json',
    authorization: `Bearer ${token}`,
  }
}

export async function listMembers(
  token: string
): Promise<{ data: TenantMember[] }> {
  const res = await fetch(`${BASE}/members`, {
    headers: { authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function createMember(
  token: string,
  body: { email: string; password: string; full_name: string }
): Promise<{ user: TenantMember & { role: 'project_manager' } }> {
  const res = await fetch(`${BASE}/members`, {
    method: 'POST',
    headers: tenantJsonHeaders(token),
    credentials: 'include',
    body: JSON.stringify({
      ...body,
      role_key: 'project_manager',
      scope_type: 'tenant',
      scope_id: null,
    }),
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function listClients(token: string): Promise<{ data: Client[] }> {
  const res = await fetch(`${BASE}/clients`, {
    headers: { authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function createClient(
  token: string,
  body: { name: string; code?: string | null }
): Promise<{ client: Client }> {
  const res = await fetch(`${BASE}/clients`, {
    method: 'POST',
    headers: tenantJsonHeaders(token),
    credentials: 'include',
    body: JSON.stringify({ ...body, contact: {} }),
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function listProjects(token: string): Promise<{ data: Project[] }> {
  const res = await fetch(`${BASE}/projects`, {
    headers: { authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function getProject(
  token: string,
  projectId: string
): Promise<{ project: Project }> {
  const res = await fetch(`${BASE}/projects/${projectId}`, {
    headers: { authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function createProject(
  token: string,
  body: {
    client_id: string
    name: string
    code: string
    description?: string | null
    location?: string | null
    contract_no?: string | null
    contract_value?: number | null
    contract_start?: string | null
    contract_finish?: string | null
    period_type: 'weekly' | 'biweekly' | 'monthly'
    schedule_start: string
    manager_user_ids: string[]
  }
): Promise<{ project: Project }> {
  const res = await fetch(`${BASE}/projects`, {
    method: 'POST',
    headers: tenantJsonHeaders(token),
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

// --- BoQ (versions & items) -------------------------------------------------
// Numeric columns arrive as strings from pg; callers coerce with Number().

export type BoqVersion = {
  id: string
  project_id: string
  version_no: number
  title: string
  status: 'draft' | 'active' | 'superseded' | 'archived'
  reason: string | null
  total_value: string | number | null
  baselined_at: string | null
  baselined_by: string | null
  created_at: string
  updated_at: string
}

export type BoqItem = {
  id: string
  boq_version_id: string
  parent_id: string | null
  code: string
  description: string
  unit: string | null
  quantity: string | number | null
  unit_rate: string | number | null
  value: string | number | null
  weight: string | number
  weight_source: 'derived' | 'manual'
  planned_start: string | null
  planned_finish: string | null
  distribution: 'linear' | 'manual'
  progress_mode: 'by_quantity' | 'by_percent'
  sort_order: number
  created_at: string
  updated_at: string
}

export type BoqItemInput = {
  code: string
  description: string
  unit?: string | null
  parent_id?: string | null
  parent_code?: string | null
  quantity?: number | null
  unit_rate?: number | null
  weight?: number | null
  weight_source?: 'derived' | 'manual'
  progress_mode?: 'by_quantity' | 'by_percent'
  planned_start?: string | null
  planned_finish?: string | null
  sort_order?: number | null
}

export async function listBoqVersions(
  token: string,
  projectId: string
): Promise<{ data: BoqVersion[] }> {
  const res = await fetch(`${BASE}/projects/${projectId}/boq-versions`, {
    headers: { authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function createBoqVersion(
  token: string,
  projectId: string,
  body: { title: string; reason?: string | null; clone_from?: string | null }
): Promise<{ version: BoqVersion }> {
  const res = await fetch(`${BASE}/projects/${projectId}/boq-versions`, {
    method: 'POST',
    headers: tenantJsonHeaders(token),
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function listBoqItems(
  token: string,
  versionId: string
): Promise<{ data: BoqItem[] }> {
  const res = await fetch(`${BASE}/boq-versions/${versionId}/items`, {
    headers: { authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function createBoqItem(
  token: string,
  versionId: string,
  item: BoqItemInput
): Promise<{ item: BoqItem }> {
  const res = await fetch(`${BASE}/boq-versions/${versionId}/items`, {
    method: 'POST',
    headers: tenantJsonHeaders(token),
    credentials: 'include',
    body: JSON.stringify(item),
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function patchBoqItem(
  token: string,
  itemId: string,
  patch: Partial<Omit<BoqItemInput, 'parent_code'>>
): Promise<{ item: BoqItem }> {
  const res = await fetch(`${BASE}/boq-items/${itemId}`, {
    method: 'PATCH',
    headers: tenantJsonHeaders(token),
    credentials: 'include',
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function deleteBoqItem(token: string, itemId: string): Promise<void> {
  const res = await fetch(`${BASE}/boq-items/${itemId}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await errorMessage(res))
}

export async function recalcBoqWeights(
  token: string,
  versionId: string
): Promise<{ version: BoqVersion }> {
  const res = await fetch(`${BASE}/boq-versions/${versionId}/recalc-weights`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function activateBoqVersion(
  token: string,
  versionId: string
): Promise<{ version: BoqVersion }> {
  const res = await fetch(`${BASE}/boq-versions/${versionId}/activate`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function listPlatformTenants(
  token: string
): Promise<{ data: PlatformTenant[] }> {
  const res = await fetch(`${BASE}/platform/tenants`, {
    headers: { authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function createPlatformTenant(
  token: string,
  body: { name: string; slug: string }
): Promise<{ tenant: PlatformTenant }> {
  const res = await fetch(`${BASE}/platform/tenants`, {
    method: 'POST',
    headers: platformJsonHeaders(token),
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function updatePlatformTenant(
  token: string,
  tenantId: string,
  body: Partial<Pick<PlatformTenant, 'name' | 'slug' | 'status'>>
): Promise<{ tenant: PlatformTenant }> {
  const res = await fetch(`${BASE}/platform/tenants/${tenantId}`, {
    method: 'PATCH',
    headers: platformJsonHeaders(token),
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function cancelPlatformTenant(
  token: string,
  tenantId: string
): Promise<{ tenant: PlatformTenant }> {
  const res = await fetch(`${BASE}/platform/tenants/${tenantId}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function createPlatformTenantAdmin(
  token: string,
  tenantId: string,
  body: { email: string; password: string; full_name: string }
): Promise<{ user: { id: string; email: string; full_name: string; status: string } }> {
  const res = await fetch(`${BASE}/platform/tenants/${tenantId}/admins`, {
    method: 'POST',
    headers: platformJsonHeaders(token),
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function listPlatformTenantMembers(
  token: string,
  tenantId: string
): Promise<{ data: PlatformTenantMember[] }> {
  const res = await fetch(`${BASE}/platform/tenants/${tenantId}/members`, {
    headers: { authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}
