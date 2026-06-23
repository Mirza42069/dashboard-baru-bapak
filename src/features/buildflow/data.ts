export type ProjectStatus = 'On track' | 'At risk' | 'Setup' | 'Delayed'
export type TenantStatus = 'Active' | 'Trial' | 'At risk' | 'Suspended'
export type RiskLevel = 'Low' | 'Medium' | 'High'

export type MetricTone = 'good' | 'risk' | 'neutral'

export type PortfolioMetric = {
  label: string
  value: string
  hint: string
  tone?: MetricTone
}

export type Project = {
  name: string
  owner: string
  code: string
  progress: number
  status: ProjectStatus
  value: string
  stage: string
  due: string
  risk: RiskLevel
  budgetUsed: number
}

export type System = {
  initials: string
  name: string
  type: string
  status: string
  sync: string
}

export type ActivityItem = {
  actor: string
  action: string
  target: string
  time: string
}

export type AttentionItem = {
  title: string
  detail: string
  severity: RiskLevel
}

export type Milestone = {
  name: string
  date: string
  project: string
  status: string
}

export type SpendPoint = {
  month: string
  planned: number
  actual: number
}

export type Tenant = {
  initials: string
  organisation: string
  slug: string
  plan: string
  users: number
  projects: number
  status: TenantStatus
  lastActive: string
  health: number
  mrr: string
}

export type TeamMember = {
  name: string
  role: string
  email: string
  projects: number
  utilization: number
  access: string
}

export type Subscription = {
  plan: string
  tenants: number
  mrr: string
  churnRisk: RiskLevel
  conversion: number
}

export type Invoice = {
  tenant: string
  amount: string
  status: string
  due: string
}

export const portfolioMetrics: PortfolioMetric[] = []
export const projects: Project[] = []
export const systems: System[] = []
export const activity: ActivityItem[] = []
export const attentionItems: AttentionItem[] = []
export const milestones: Milestone[] = []
export const spendSeries: SpendPoint[] = []
export const tenants: Tenant[] = []
export const team: TeamMember[] = []
export const subscriptions: Subscription[] = []
export const invoices: Invoice[] = []
