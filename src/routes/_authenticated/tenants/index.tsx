import { createFileRoute } from '@tanstack/react-router'
import { TenantsPage } from '@/features/buildflow/pages'

export const Route = createFileRoute('/_authenticated/tenants/')({
  component: TenantsPage,
})
