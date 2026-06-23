import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  // Gate every route under _authenticated: no token -> bounce to sign-in,
  // preserving where they were headed so login can return them there.
  beforeLoad: ({ location }) => {
    const { accessToken } = useAuthStore.getState().auth
    if (!accessToken) {
      throw redirect({ to: '/sign-in', search: { redirect: location.href } })
    }
  },
  component: AuthenticatedLayout,
})
