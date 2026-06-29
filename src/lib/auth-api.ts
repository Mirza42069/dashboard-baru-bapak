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
