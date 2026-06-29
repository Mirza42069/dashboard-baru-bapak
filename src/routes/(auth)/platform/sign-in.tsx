import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { PlatformSignIn } from '@/features/auth/platform-sign-in'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/platform/sign-in')({
  component: PlatformSignIn,
  validateSearch: searchSchema,
})
