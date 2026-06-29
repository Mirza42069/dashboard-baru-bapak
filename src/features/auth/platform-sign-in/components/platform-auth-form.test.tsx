import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { type Locator, userEvent } from 'vitest/browser'
import { PlatformAuthForm } from './platform-auth-form'

const navigate = vi.fn()
const setAdminMock = vi.fn()
const setAccessTokenMock = vi.fn()
const platformLoginMock = vi.fn().mockResolvedValue({
  access_token: 'platform-tok',
  token_type: 'Bearer',
  expires_in: 900,
})
const getPlatformMeMock = vi.fn().mockResolvedValue({
  admin: {
    id: 'pa1',
    email: 'ops@example.com',
    full_name: 'Ops Admin',
    role: 'super_admin',
    status: 'active',
  },
})

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    platform: {
      setAdmin: setAdminMock,
      setAccessToken: setAccessTokenMock,
    },
  }),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

vi.mock('@/lib/auth-api', () => ({
  platformLogin: (...args: unknown[]) => platformLoginMock(...args),
  getPlatformMe: (...args: unknown[]) => getPlatformMeMock(...args),
}))

describe('PlatformAuthForm', () => {
  let screen: RenderResult
  let emailInput: Locator
  let passwordInput: Locator
  let signInButton: Locator

  beforeEach(async () => {
    vi.clearAllMocks()
    screen = await render(<PlatformAuthForm />)
    emailInput = screen.getByRole('textbox', { name: /^Operator email$/i })
    passwordInput = screen.getByLabelText(/^Password$/i)
    signInButton = screen.getByRole('button', {
      name: /^Sign in as platform admin$/i,
    })
  })

  it('renders platform login fields', async () => {
    await expect.element(emailInput).toBeInTheDocument()
    await expect.element(passwordInput).toBeInTheDocument()
    await expect.element(signInButton).toBeInTheDocument()
  })

  it('authenticates platform admin and navigates to platform console', async () => {
    await userEvent.fill(emailInput, 'ops@example.com')
    await userEvent.fill(passwordInput, '1234567')

    await userEvent.click(signInButton)

    await vi.waitFor(() => expect(setAdminMock).toHaveBeenCalledOnce())
    expect(platformLoginMock).toHaveBeenCalledWith('ops@example.com', '1234567')
    expect(getPlatformMeMock).toHaveBeenCalledWith('platform-tok')
    expect(setAccessTokenMock).toHaveBeenCalledWith('platform-tok')
    expect(setAdminMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ops@example.com', role: 'super_admin' })
    )
    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/platform', replace: true })
    )
  })

  it('navigates to redirectTo when provided', async () => {
    vi.clearAllMocks()
    const { getByRole, getByLabelText } = await render(
      <PlatformAuthForm redirectTo='/platform?tab=tenants' />
    )

    await userEvent.fill(
      getByRole('textbox', { name: /Operator email/i }),
      'ops@example.com'
    )
    await userEvent.fill(getByLabelText('Password'), '1234567')
    await userEvent.click(
      getByRole('button', { name: /Sign in as platform admin/i })
    )

    await vi.waitFor(() => expect(setAdminMock).toHaveBeenCalledOnce())
    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/platform?tab=tenants',
        replace: true,
      })
    )
  })
})
