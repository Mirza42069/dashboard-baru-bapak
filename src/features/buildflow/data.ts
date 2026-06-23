export type ProjectStatus = 'On track' | 'At risk' | 'Setup' | 'Delayed'
export type TenantStatus = 'Active' | 'Trial' | 'At risk' | 'Suspended'
export type RiskLevel = 'Low' | 'Medium' | 'High'

export const portfolioMetrics = [
  {
    label: 'Overall progress',
    value: '42%',
    hint: '+8% this month',
    tone: 'good',
  },
  {
    label: 'Contract value',
    value: '£1.82m',
    hint: 'across 8 projects',
    tone: 'neutral',
  },
  {
    label: 'Verified BoQ items',
    value: '317 / 486',
    hint: '65% verified',
    tone: 'good',
  },
  {
    label: 'Schedule variance',
    value: '−4 d',
    hint: '2 projects at risk',
    tone: 'risk',
  },
] as const

export const projects = [
  {
    name: 'Riverside Tower B',
    owner: 'A. Okafor',
    code: 'PRJ-1042',
    progress: 64,
    status: 'On track' as ProjectStatus,
    value: '£418k',
    stage: 'Structural frame',
    due: '18 Apr',
    risk: 'Low' as RiskLevel,
    budgetUsed: 58,
  },
  {
    name: 'Northgate Retail Park',
    owner: 'L. Marsh',
    code: 'PRJ-1038',
    progress: 42,
    status: 'At risk' as ProjectStatus,
    value: '£292k',
    stage: 'Reinforcement',
    due: '03 May',
    risk: 'High' as RiskLevel,
    budgetUsed: 71,
  },
  {
    name: 'Harbour Logistics Hub',
    owner: 'D. Singh',
    code: 'PRJ-1029',
    progress: 78,
    status: 'On track' as ProjectStatus,
    value: '£541k',
    stage: 'MEP coordination',
    due: '27 Mar',
    risk: 'Low' as RiskLevel,
    budgetUsed: 69,
  },
  {
    name: 'Maple Court Flats',
    owner: 'R. Adeyemi',
    code: 'PRJ-1056',
    progress: 11,
    status: 'Setup' as ProjectStatus,
    value: '£254k',
    stage: 'BoQ import',
    due: '14 Jun',
    risk: 'Medium' as RiskLevel,
    budgetUsed: 9,
  },
  {
    name: 'Cedar Health Centre',
    owner: 'M. Cole',
    code: 'PRJ-1061',
    progress: 53,
    status: 'Delayed' as ProjectStatus,
    value: '£317k',
    stage: 'Procurement',
    due: '09 May',
    risk: 'High' as RiskLevel,
    budgetUsed: 76,
  },
  {
    name: 'Orchard Primary Annex',
    owner: 'S. Patel',
    code: 'PRJ-1067',
    progress: 24,
    status: 'On track' as ProjectStatus,
    value: '£184k',
    stage: 'Groundworks',
    due: '21 Jul',
    risk: 'Medium' as RiskLevel,
    budgetUsed: 22,
  },
]

export const systems = [
  {
    initials: 'XE',
    name: 'Xero',
    type: 'Accounting',
    status: 'Connected',
    sync: '4 min ago',
  },
  {
    initials: 'MP',
    name: 'MS Project',
    type: 'Scheduling',
    status: 'Connected',
    sync: '18 min ago',
  },
  {
    initials: 'RV',
    name: 'Autodesk Revit',
    type: 'BIM model',
    status: 'Connected',
    sync: '1h ago',
  },
  {
    initials: 'SAP',
    name: 'SAP ERP',
    type: 'Finance / ERP',
    status: 'Syncing',
    sync: 'running',
  },
  {
    initials: 'PC',
    name: 'Procore Docs',
    type: 'Documents',
    status: 'Not connected',
    sync: 'requires auth',
  },
]

export const activity = [
  {
    actor: 'Amina Okafor',
    action: 'verified 18 concrete line items',
    target: 'Riverside Tower B',
    time: '09:24',
  },
  {
    actor: 'Site team',
    action: 'updated reinforcement progress to 48%',
    target: 'Northgate Retail Park',
    time: '08:10',
  },
  {
    actor: 'Xero sync',
    action: 'matched 12 supplier invoices',
    target: 'Portfolio finance',
    time: 'Yesterday',
  },
  {
    actor: 'Lewis Marsh',
    action: 'raised risk review for steel delivery',
    target: 'Cedar Health Centre',
    time: 'Yesterday',
  },
  {
    actor: 'Rae Adeyemi',
    action: 'issued BoQ Rev B',
    target: 'Maple Court Flats',
    time: '12 Mar',
  },
]

export const attentionItems = [
  {
    title: 'Structural steel behind schedule',
    detail: 'Cedar Health Centre is 16 days behind planned delivery.',
    severity: 'High' as RiskLevel,
  },
  {
    title: 'Procore Docs disconnected',
    detail: 'Re-authorise to resume document sync and revision tracking.',
    severity: 'Medium' as RiskLevel,
  },
  {
    title: 'Maple Court Flats has incomplete BoQ',
    detail: '91 items missing quantity or rate before tracking can begin.',
    severity: 'Medium' as RiskLevel,
  },
]

export const milestones = [
  {
    name: 'Riverside slab pour',
    date: 'Tomorrow',
    project: 'Riverside Tower B',
    status: 'Ready',
  },
  {
    name: 'Retail park steel delivery',
    date: 'Fri',
    project: 'Northgate Retail Park',
    status: 'Blocked',
  },
  {
    name: 'Harbour MEP clash review',
    date: 'Mon',
    project: 'Harbour Logistics Hub',
    status: 'Ready',
  },
]

export const spendSeries = [
  { month: 'Jan', planned: 180, actual: 144 },
  { month: 'Feb', planned: 260, actual: 236 },
  { month: 'Mar', planned: 410, actual: 462 },
  { month: 'Apr', planned: 560, actual: 515 },
  { month: 'May', planned: 720, actual: 768 },
  { month: 'Jun', planned: 880, actual: 831 },
]

export const tenants = [
  {
    initials: 'MC',
    organisation: 'Meridian Construction Ltd',
    slug: 'tn_meridian',
    plan: 'Business',
    users: 34,
    projects: 12,
    status: 'Active' as TenantStatus,
    lastActive: '2m ago',
    health: 91,
    mrr: '£1.8k',
  },
  {
    initials: 'AC',
    organisation: 'Apex Civil Engineering',
    slug: 'tn_apex',
    plan: 'Enterprise',
    users: 210,
    projects: 88,
    status: 'Active' as TenantStatus,
    lastActive: 'just now',
    health: 96,
    mrr: '£9.4k',
  },
  {
    initials: 'BC',
    organisation: 'Birch & Co Builders',
    slug: 'tn_birch',
    plan: 'Starter',
    users: 6,
    projects: 2,
    status: 'Trial' as TenantStatus,
    lastActive: '1h ago',
    health: 68,
    mrr: '£0.2k',
  },
  {
    initials: 'SI',
    organisation: 'Summit Infrastructure',
    slug: 'tn_summit',
    plan: 'Enterprise',
    users: 156,
    projects: 64,
    status: 'Active' as TenantStatus,
    lastActive: '4h ago',
    health: 88,
    mrr: '£7.8k',
  },
  {
    initials: 'HD',
    organisation: 'Halcyon Developments',
    slug: 'tn_halcyon',
    plan: 'Business',
    users: 41,
    projects: 15,
    status: 'At risk' as TenantStatus,
    lastActive: '3d ago',
    health: 49,
    mrr: '£1.9k',
  },
  {
    initials: 'PR',
    organisation: 'Pine Ridge Homes',
    slug: 'tn_pine',
    plan: 'Starter',
    users: 4,
    projects: 1,
    status: 'Suspended' as TenantStatus,
    lastActive: '21d ago',
    health: 12,
    mrr: '£0',
  },
]

export const team = [
  {
    name: 'Amina Okafor',
    role: 'Quantity surveyor',
    email: 'amina@meridian.example',
    projects: 4,
    utilization: 82,
    access: 'Admin',
  },
  {
    name: 'Lewis Marsh',
    role: 'Project manager',
    email: 'lewis@meridian.example',
    projects: 3,
    utilization: 91,
    access: 'Manager',
  },
  {
    name: 'Divya Singh',
    role: 'Site lead',
    email: 'divya@meridian.example',
    projects: 2,
    utilization: 67,
    access: 'Editor',
  },
  {
    name: 'Rae Adeyemi',
    role: 'Finance controller',
    email: 'rae@meridian.example',
    projects: 5,
    utilization: 76,
    access: 'Finance',
  },
  {
    name: 'Sam Patel',
    role: 'Document controller',
    email: 'sam@meridian.example',
    projects: 2,
    utilization: 54,
    access: 'Viewer',
  },
]

export const subscriptions = [
  {
    plan: 'Starter',
    tenants: 18,
    mrr: '£2.1k',
    churnRisk: 'Low',
    conversion: 31,
  },
  {
    plan: 'Business',
    tenants: 74,
    mrr: '£18.4k',
    churnRisk: 'Medium',
    conversion: 47,
  },
  {
    plan: 'Enterprise',
    tenants: 36,
    mrr: '£41.8k',
    churnRisk: 'Low',
    conversion: 62,
  },
]

export const invoices = [
  {
    tenant: 'Apex Civil Engineering',
    amount: '£9,400',
    status: 'Paid',
    due: '1 Apr',
  },
  {
    tenant: 'Summit Infrastructure',
    amount: '£7,800',
    status: 'Open',
    due: '7 Apr',
  },
  {
    tenant: 'Halcyon Developments',
    amount: '£1,900',
    status: 'Overdue',
    due: '18 Mar',
  },
]
