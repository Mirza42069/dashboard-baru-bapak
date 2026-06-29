import { clearCookies } from '@/test-utils/cookies'
import { beforeEach, describe, expect, it, vi } from 'vitest'

async function importAuthStore() {
  const { useAuthStore } = await import('./auth-store')
  return useAuthStore
}

const sampleUser = {
  id: 'user-1',
  email: 'user@example.com',
  full_name: 'User One',
}

const sampleAdmin = {
  id: 'admin-1',
  email: 'ops@example.com',
  full_name: 'Ops One',
  role: 'super_admin',
  status: 'active',
}

describe('useAuthStore', () => {
  beforeEach(() => {
    clearCookies()
    vi.resetModules()
  })

  it('starts with an empty access token when nothing is persisted', async () => {
    const useAuthStore = await importAuthStore()

    expect(useAuthStore.getState().auth.accessToken).toBe('')
    expect(useAuthStore.getState().auth.user).toBeNull()
  })

  it('persists access token so a new store instance reads it back', async () => {
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().auth.setAccessToken('session-token')

    vi.resetModules()
    const useAuthStoreAfterReload = await importAuthStore()

    expect(useAuthStoreAfterReload.getState().auth.accessToken).toBe(
      'session-token'
    )
  })

  it('clears persisted access token when resetAccessToken is used', async () => {
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().auth.setAccessToken('to-clear')
    useAuthStore.getState().auth.resetAccessToken()

    vi.resetModules()
    const useAuthStoreAfterReload = await importAuthStore()

    expect(useAuthStoreAfterReload.getState().auth.accessToken).toBe('')
  })

  it('updates the signed-in user via setUser', async () => {
    const useAuthStore = await importAuthStore()

    useAuthStore.getState().auth.setUser({ ...sampleUser })

    expect(useAuthStore.getState().auth.user).toEqual(sampleUser)
  })

  it('reset clears user and access token and drops persistence', async () => {
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().auth.setAccessToken('will-be-cleared')
    useAuthStore.getState().auth.setUser({ ...sampleUser })

    useAuthStore.getState().auth.reset()

    expect(useAuthStore.getState().auth.user).toBeNull()
    expect(useAuthStore.getState().auth.accessToken).toBe('')

    vi.resetModules()
    const useAuthStoreAfterReload = await importAuthStore()

    expect(useAuthStoreAfterReload.getState().auth.user).toBeNull()
    expect(useAuthStoreAfterReload.getState().auth.accessToken).toBe('')
  })

  it('keeps platform auth separate from tenant auth', async () => {
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().auth.setAccessToken('tenant-token')
    useAuthStore.getState().platform.setAccessToken('platform-token')
    useAuthStore.getState().platform.setAdmin({ ...sampleAdmin })

    expect(useAuthStore.getState().auth.accessToken).toBe('tenant-token')
    expect(useAuthStore.getState().platform.accessToken).toBe('platform-token')
    expect(useAuthStore.getState().platform.admin).toEqual(sampleAdmin)

    useAuthStore.getState().platform.reset()

    expect(useAuthStore.getState().auth.accessToken).toBe('tenant-token')
    expect(useAuthStore.getState().platform.accessToken).toBe('')
    expect(useAuthStore.getState().platform.admin).toBeNull()
  })

  it('persists platform access token separately', async () => {
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().platform.setAccessToken('platform-session-token')

    vi.resetModules()
    const useAuthStoreAfterReload = await importAuthStore()

    expect(useAuthStoreAfterReload.getState().platform.accessToken).toBe(
      'platform-session-token'
    )
    expect(useAuthStoreAfterReload.getState().auth.accessToken).toBe('')
  })
})
