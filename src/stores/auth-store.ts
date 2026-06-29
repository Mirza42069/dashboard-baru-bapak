import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'thisisjustarandomstring'
const PLATFORM_ACCESS_TOKEN = 'platform-access-token'

interface AuthUser {
  id: string
  email: string
  full_name: string
  tenant?: { id: string; name: string; slug: string }
  permissions?: { tenant: string[]; by_scope: Record<string, string[]> }
}

interface PlatformAdmin {
  id: string
  email: string
  full_name: string
  role: string
  status: string
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
  }
  platform: {
    admin: PlatformAdmin | null
    setAdmin: (admin: PlatformAdmin | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()((set) => {
  const cookieState = getCookie(ACCESS_TOKEN)
  const platformCookieState = getCookie(PLATFORM_ACCESS_TOKEN)
  const initToken = cookieState ? JSON.parse(cookieState) : ''
  const initPlatformToken = platformCookieState
    ? JSON.parse(platformCookieState)
    : ''
  return {
    auth: {
      user: null,
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),
      accessToken: initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          setCookie(ACCESS_TOKEN, JSON.stringify(accessToken))
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return {
            ...state,
            auth: { ...state.auth, user: null, accessToken: '' },
          }
        }),
    },
    platform: {
      admin: null,
      setAdmin: (admin) =>
        set((state) => ({ ...state, platform: { ...state.platform, admin } })),
      accessToken: initPlatformToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          setCookie(PLATFORM_ACCESS_TOKEN, JSON.stringify(accessToken))
          return { ...state, platform: { ...state.platform, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          removeCookie(PLATFORM_ACCESS_TOKEN)
          return { ...state, platform: { ...state.platform, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          removeCookie(PLATFORM_ACCESS_TOKEN)
          return {
            ...state,
            platform: { ...state.platform, admin: null, accessToken: '' },
          }
        }),
    },
  }
})
