import { createFileRoute } from '@tanstack/react-router'
import { SubscriptionsPage } from '@/features/buildflow/pages'

export const Route = createFileRoute('/_authenticated/subscriptions/')({
  component: SubscriptionsPage,
})
