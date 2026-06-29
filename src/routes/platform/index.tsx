import { createFileRoute, redirect } from '@tanstack/react-router'
import { getPlatformMe } from '@/lib/auth-api'
import { PlatformConsole } from '@/features/platform'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/platform/')({
  beforeLoad: async ({ location }) => {
    const { platform } = useAuthStore.getState()
    if (!platform.accessToken) {
      throw redirect({
        to: '/platform/sign-in',
        search: { redirect: location.href },
      })
    }

    try {
      const { admin } = await getPlatformMe(platform.accessToken)
      platform.setAdmin(admin)
    } catch {
      platform.reset()
      throw redirect({
        to: '/platform/sign-in',
        search: { redirect: location.href },
      })
    }
  },
  component: PlatformConsole,
})
