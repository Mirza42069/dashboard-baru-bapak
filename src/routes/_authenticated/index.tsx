import { createFileRoute } from '@tanstack/react-router'
import { TenantDashboard } from '@/features/buildflow/pages'

export const Route = createFileRoute('/_authenticated/')({
  component: TenantDashboard,
})
