import { useEffect, useState } from 'react'
import { getMe } from '@/lib/auth-api'
import { useAuthStore } from '@/stores/auth-store'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { MeruShell } from './meru-shell'

export function AuthenticatedLayout() {
  const { auth } = useAuthStore()
  const { accessToken, user, setUser, reset } = auth
  // On refresh the token persists but auth.user (role, permissions) does not —
  // rehydrate from /me before rendering so role-based routing/nav is correct.
  const [ready, setReady] = useState(!!user || !accessToken)

  useEffect(() => {
    if (!accessToken || user) return
    let cancelled = false
    void (async () => {
      try {
        const me = await getMe(accessToken)
        if (cancelled) return
        setUser({
          id: me.user.id,
          email: me.user.email,
          full_name: me.user.full_name,
          tenant: me.tenant,
          permissions: me.permissions,
        })
      } catch {
        // Token invalid/expired: drop it so the _authenticated guard bounces to sign-in.
        if (!cancelled) reset()
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [accessToken, user, setUser, reset])

  if (!ready) return null

  return (
    <LayoutProvider>
      <SidebarProvider>
        <SearchProvider>
          <MeruShell />
        </SearchProvider>
      </SidebarProvider>
    </LayoutProvider>
  )
}
