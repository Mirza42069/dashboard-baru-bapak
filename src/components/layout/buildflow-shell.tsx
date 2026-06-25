import { Link, Outlet } from '@tanstack/react-router'
import {
  Bell,
  ChevronDown,
  CircleHelp,
  Gauge,
  Grid2X2,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { FooterNote } from '@/features/buildflow/components'

const workspaceLinks = [
  { label: 'Dashboard', to: '/', icon: Gauge },
  { label: 'Projects', to: '/projects', icon: Grid2X2 },
  { label: 'Team & organisation', to: '/team', icon: Users },
]

export function BuildFlowShell() {
  return (
    <div className='min-h-svh bg-background text-[13px] text-foreground antialiased'>
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
            <BrandBlock />
            <div className='p-3'>
              <NavSection title='Workspace' items={workspaceLinks} />
            </div>
          </SheetContent>
        </Sheet>

        <div className='hidden min-w-56 md:block'>
          <BrandBlock compact />
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
          <Avatar className='size-9 border border-border bg-muted'>
            <AvatarFallback className='text-xs font-medium'>CM</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className='grid min-h-[calc(100svh-3.5rem)] grid-cols-1 gap-4 md:grid-cols-[244px_1fr] md:p-4 md:pe-0'>
        <aside className='sticky top-[4.5rem] hidden h-[calc(100svh-5.5rem)] rounded-lg border border-sidebar-border bg-sidebar shadow-sm md:flex md:flex-col'>
          <nav className='flex-1 p-3'>
            <NavSection title='Workspace' items={workspaceLinks} />
          </nav>
          <div className='border-t border-sidebar-border p-3'>
            <SideUtility icon={Settings} label='Settings' />
            <SideUtility icon={CircleHelp} label='Help & support' />
          </div>
        </aside>
        <main className='overflow-x-hidden px-4 py-5 md:px-2 md:pe-6 md:pt-1 lg:pe-8'>
          <div className='mx-auto max-w-7xl'>
            <Outlet />
            <FooterNote />
          </div>
        </main>
      </div>
    </div>
  )
}

function TopbarThemeButton() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      type='button'
      variant='outline'
      size='icon'
      className='size-9 rounded-md border-border bg-card shadow-xs'
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun className='size-4' /> : <Moon className='size-4' />}
    </Button>
  )
}

function BrandBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2',
        compact ? '' : 'border-b border-border p-4'
      )}
    >
      <div className='grid size-8 place-items-center rounded-sm border border-border bg-card shadow-xs'>
        <Grid2X2 className='size-4 text-foreground' />
      </div>
      <div className='font-semibold tracking-tight text-foreground'>
        BUILDFLOW
      </div>
    </div>
  )
}

function NavSection({
  items,
  title,
}: {
  title: string
  items: typeof workspaceLinks
}) {
  return (
    <div>
      <div className='mb-2 px-2 text-[10px] tracking-[0.18em] text-muted-foreground uppercase'>
        {title}
      </div>
      <div className='space-y-1'>
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === '/' }}
            activeProps={{
              className: 'bg-card text-foreground shadow-sm ring-1 ring-border',
            }}
            className='flex items-center gap-3 rounded-md px-3 py-2.5 text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          >
            <item.icon className='size-4' />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function SideUtility({
  icon: Icon,
  label,
}: {
  icon: typeof Settings
  label: string
}) {
  return (
    <button className='flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'>
      <Icon className='size-4' />
      {label}
    </button>
  )
}
