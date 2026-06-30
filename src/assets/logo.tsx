import { type SVGProps } from 'react'
import { cn } from '@/lib/utils'

// The Terrace — MERU's single signature mark (DESIGN §2). An abstract stepped
// pyramid reducing to a peak, readable at 16px. Inherits color via currentColor;
// render it in --gold-500 (the only sanctioned home for summit gold).
export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      id='meru-mark'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      height='24'
      width='24'
      fill='currentColor'
      className={cn('size-6', className)}
      {...props}
    >
      <title>MERU</title>
      <path d='M12 2 L8.25 7 H15.75 Z' />
      <rect x='8' y='8.5' width='8' height='3' rx='0.5' />
      <rect x='5' y='13' width='14' height='3' rx='0.5' />
      <rect x='2' y='17.5' width='20' height='3' rx='0.5' />
    </svg>
  )
}
