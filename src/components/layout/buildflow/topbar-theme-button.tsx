import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/theme-provider'
import { Button } from '@/components/ui/button'

export function TopbarThemeButton() {
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
