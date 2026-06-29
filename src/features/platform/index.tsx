import { useNavigate } from '@tanstack/react-router'
import { Building2, LogOut, ShieldCheck, Users } from 'lucide-react'
import { platformLogout } from '@/lib/auth-api'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function PlatformConsole() {
  const navigate = useNavigate()
  const { platform } = useAuthStore()
  const admin = platform.admin

  const signOut = () => {
    if (platform.accessToken) void platformLogout(platform.accessToken)
    platform.reset()
    navigate({ to: '/platform/sign-in', replace: true })
  }

  return (
    <main className='min-h-svh bg-muted/30'>
      <header className='border-b bg-background'>
        <div className='mx-auto flex max-w-6xl items-center justify-between px-6 py-4'>
          <div>
            <p className='text-sm font-medium text-muted-foreground'>
              Operator console
            </p>
            <h1 className='text-xl font-semibold tracking-tight'>
              Platform administration
            </h1>
          </div>
          <Button variant='outline' onClick={signOut}>
            <LogOut />
            Sign out
          </Button>
        </div>
      </header>

      <section className='mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-3'>
        <Card className='md:col-span-2'>
          <CardHeader>
            <CardTitle>Signed in as platform admin</CardTitle>
            <CardDescription>
              This session uses the separate platform auth plane, not tenant auth.
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-3 text-sm'>
            <div className='flex justify-between gap-4 rounded-lg border p-3'>
              <span className='text-muted-foreground'>Name</span>
              <span className='font-medium'>{admin?.full_name || 'Unknown'}</span>
            </div>
            <div className='flex justify-between gap-4 rounded-lg border p-3'>
              <span className='text-muted-foreground'>Email</span>
              <span className='font-medium'>{admin?.email || 'Unknown'}</span>
            </div>
            <div className='flex justify-between gap-4 rounded-lg border p-3'>
              <span className='text-muted-foreground'>Role</span>
              <span className='font-medium'>{admin?.role || 'Unknown'}</span>
            </div>
          </CardContent>
        </Card>

        <div className='grid gap-4'>
          <Card>
            <CardHeader>
              <ShieldCheck className='size-5 text-primary' />
              <CardTitle className='text-base'>Auth plane</CardTitle>
              <CardDescription>
                Platform JWT and refresh cookie are separate from tenant sessions.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Building2 className='size-5 text-primary' />
              <CardTitle className='text-base'>Tenants</CardTitle>
              <CardDescription>
                Tenant provisioning endpoints are ready for the next UI step.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Users className='size-5 text-primary' />
              <CardTitle className='text-base'>Tenant admins</CardTitle>
              <CardDescription>
                First-admin creation is available through the backend API.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </main>
  )
}
