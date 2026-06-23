import { createFileRoute } from '@tanstack/react-router'
import { TeamPage } from '@/features/buildflow/pages'

export const Route = createFileRoute('/_authenticated/team/')({
  component: TeamPage,
})
