import { createFileRoute } from '@tanstack/react-router'
import { TeamPage } from '@/features/meru/pages'

export const Route = createFileRoute('/_authenticated/team/')({
  component: TeamPage,
})
