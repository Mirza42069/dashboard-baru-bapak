// Bill of Quantities domain: section/leaf rows + pure totals math.
// Wireframe ref: decoded design L262-344 (QUANTITIES GRID + Contract total).

export type BoqLeaf = {
  id: string
  sectionId: string
  code: string
  desc: string
  unit: string
  qty: number
  rate: number
  pct: number // 0..100 complete
}

export type BoqSection = { id: string; num: string; name: string }

export const boqSections: BoqSection[] = [
  { id: 's1', num: '1', name: 'Substructure' },
  { id: 's2', num: '2', name: 'Superstructure — frame' },
  { id: 's3', num: '3', name: 'External envelope' },
]

export const boqSeedLeaves: BoqLeaf[] = [
  {
    id: 'l1',
    sectionId: 's1',
    code: '1.01',
    desc: 'Excavate to reduce levels',
    unit: 'm³',
    qty: 1240,
    rate: 18.5,
    pct: 100,
  },
  {
    id: 'l2',
    sectionId: 's1',
    code: '1.02',
    desc: 'Mass concrete fill to foundations',
    unit: 'm³',
    qty: 320,
    rate: 142,
    pct: 100,
  },
  {
    id: 'l3',
    sectionId: 's1',
    code: '1.03',
    desc: 'Reinforcement to pile caps',
    unit: 't',
    qty: 28,
    rate: 1450,
    pct: 80,
  },
  {
    id: 'l4',
    sectionId: 's2',
    code: '2.01',
    desc: 'In-situ RC columns',
    unit: 'm³',
    qty: 96,
    rate: 410,
    pct: 60,
  },
  {
    id: 'l5',
    sectionId: 's2',
    code: '2.02',
    desc: 'Precast floor planks',
    unit: 'm²',
    qty: 2150,
    rate: 88,
    pct: 45,
  },
  {
    id: 'l6',
    sectionId: 's2',
    code: '2.03',
    desc: 'Structural steel transfer beams',
    unit: 't',
    qty: 41,
    rate: 2100,
    pct: 20,
  },
  {
    id: 'l7',
    sectionId: 's3',
    code: '3.01',
    desc: 'Curtain walling — unitised',
    unit: 'm²',
    qty: 1340,
    rate: 540,
    pct: 0,
  },
  {
    id: 'l8',
    sectionId: 's3',
    code: '3.02',
    desc: 'Single-ply membrane roofing',
    unit: 'm²',
    qty: 880,
    rate: 96,
    pct: 0,
  },
]

export const amount = (l: Pick<BoqLeaf, 'qty' | 'rate'>) => l.qty * l.rate

export function leafStatus(pct: number) {
  if (pct >= 100) return { label: 'Complete', tone: 'good' as const }
  if (pct <= 0) return { label: 'Not started', tone: 'muted' as const }
  return { label: 'In progress', tone: 'risk' as const }
}

export type SectionTotals = {
  section: BoqSection
  leaves: BoqLeaf[]
  amount: number
  pct: number // value-weighted % complete
}

export type BoqTotals = {
  sections: SectionTotals[]
  total: number
  pct: number
}

// Value-weighted progress: a 90%-done £1m item outweighs a 100%-done £1k item.
export function computeTotals(leaves: BoqLeaf[]): BoqTotals {
  const sections = boqSections.map((section) => {
    const secLeaves = leaves.filter((l) => l.sectionId === section.id)
    const amt = secLeaves.reduce((s, l) => s + amount(l), 0)
    const done = secLeaves.reduce((s, l) => s + amount(l) * (l.pct / 100), 0)
    return {
      section,
      leaves: secLeaves,
      amount: amt,
      pct: amt ? Math.round((done / amt) * 100) : 0,
    }
  })
  const total = sections.reduce((s, x) => s + x.amount, 0)
  const done = sections.reduce((s, x) => s + x.amount * (x.pct / 100), 0)
  return { sections, total, pct: total ? Math.round((done / total) * 100) : 0 }
}

export const gbp = (n: number) => '£' + Math.round(n).toLocaleString('en-GB')
