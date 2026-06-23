import { expect, test } from 'vitest'
import { computeTotals, type BoqLeaf } from './boq'

const leaves: BoqLeaf[] = [
  {
    id: 'l1',
    sectionId: 's1',
    code: '1.01',
    desc: 'Item one',
    unit: 'nr',
    qty: 10,
    rate: 100,
    pct: 100,
  },
  {
    id: 'l2',
    sectionId: 's1',
    code: '1.02',
    desc: 'Item two',
    unit: 'nr',
    qty: 20,
    rate: 100,
    pct: 50,
  },
]

test('contract total = sum(qty*rate) and progress is value-weighted', () => {
  const t = computeTotals(leaves)
  const expectedTotal = leaves.reduce((s, l) => s + l.qty * l.rate, 0)
  expect(t.total).toBe(expectedTotal)

  // value-weighted: cheap fully-done items can't pull overall to 100
  expect(t.pct).toBeGreaterThan(0)
  expect(t.pct).toBeLessThan(100)

  // an all-zero progress set reads 0%, an all-100 set reads 100%
  expect(computeTotals(leaves.map((l) => ({ ...l, pct: 0 }))).pct).toBe(0)
  expect(computeTotals(leaves.map((l) => ({ ...l, pct: 100 }))).pct).toBe(100)
})
