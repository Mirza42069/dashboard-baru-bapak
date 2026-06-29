import { Link, useSearch } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { PlatformAuthForm } from './components/platform-auth-form'

export function PlatformSignIn() {
  const { redirect } = useSearch({ from: '/(auth)/platform/sign-in' })

  return (
    <AuthLayout>
      <Card className='max-w-sm gap-4 border-primary/20 shadow-lg shadow-primary/5'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>Platform admin</CardTitle>
          <CardDescription>
            Sign in to provision firms and manage the operator console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlatformAuthForm redirectTo={redirect} />
        </CardContent>
        <CardFooter>
          <p className='px-8 text-center text-sm text-muted-foreground'>
            Looking for a tenant workspace?{' '}
            <Link
              to='/sign-in'
              className='font-medium underline underline-offset-4 hover:text-primary'
            >
              Sign in as tenant user
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
