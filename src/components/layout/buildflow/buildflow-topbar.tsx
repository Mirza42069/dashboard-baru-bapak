import { useLocation, useNavigate } from '@tanstack/react-router'
import { Bell, ChevronDown, LogOut, Menu, Search } from 'lucide-react'
import { logout } from '@/lib/auth-api'
import { useAuthStore } from '@/stores/auth-store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { BuildFlowBrand } from './buildflow-brand'
import { BuildFlowNavSection } from './buildflow-nav-section'
import { TopbarThemeButton } from './topbar-theme-button'
import { workspaceLinks } from './workspace-links'

export function BuildFlowTopbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { auth } = useAuthStore()
  const user = auth.user
  const displayName = user?.full_name || user?.email || 'User'
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'

  const handleLogout = () => {
    if (auth.accessToken) void logout(auth.accessToken)
    auth.reset()
    navigate({
      to: '/sign-in',
      search: { redirect: location.href },
      replace: true,
    })
  }

  return (
    <header className='sticky top-0 z-30 flex h-14 items-center border-b border-border bg-background/95 px-3 backdrop-blur md:px-4'>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            className='me-2 size-8 rounded-md bg-card md:hidden'
          >
            <Menu className='size-4' />
          </Button>
        </SheetTrigger>
        <SheetContent side='left' className='w-72 bg-background p-0'>
          <BuildFlowBrand />
          <div className='p-3'>
            <BuildFlowNavSection title='Workspace' items={workspaceLinks} />
          </div>
        </SheetContent>
      </Sheet>

      <div className='hidden min-w-56 md:block'>
        <BuildFlowBrand compact />
      </div>

      <div className='ms-auto flex items-center gap-2 md:gap-3'>
        <Button
          variant='outline'
          className='hidden h-9 gap-2 rounded-md border-border bg-card px-3 font-normal shadow-xs lg:flex'
        >
          <span className='size-4 rounded bg-primary/20 ring-1 ring-primary/25' />
          Current workspace
          <ChevronDown className='size-3' />
        </Button>
        <div className='relative hidden sm:block'>
          <Search className='absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground' />
          <Input
            className='h-9 w-52 rounded-sm border-border bg-card ps-9 text-xs shadow-xs xl:w-64'
            placeholder='Search projects, BoQ, people...'
          />
        </div>
        <Button
          variant='outline'
          size='icon'
          className='size-9 rounded-md border-border bg-card shadow-xs'
        >
          <Bell className='size-4' />
        </Button>
        <TopbarThemeButton />
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              className='size-9 rounded-full p-0 hover:bg-muted'
              aria-label='Open user menu'
            >
              <Avatar className='size-9 border border-border bg-muted'>
                <AvatarFallback className='text-xs font-medium'>
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-56' align='end' forceMount>
            <DropdownMenuLabel className='font-normal'>
              <div className='flex flex-col gap-1.5'>
                <p className='truncate text-sm leading-none font-medium'>
                  {displayName}
                </p>
                <p className='truncate text-xs leading-none text-muted-foreground'>
                  {user?.email || 'No email available'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant='destructive' onClick={handleLogout}>
              <LogOut className='size-4' />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
