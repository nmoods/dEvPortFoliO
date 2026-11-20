import { describe, expect, it } from 'vitest'
import { placeLabels } from './mapLabels'

describe('placeLabels', () => {
  it('puts each label on the side facing away from the question', () => {
    const [left, right] = placeLabels([[50, 100], [300, 100]], [200, 100])
    expect(left).toEqual({ x: 40, y: 104, anchor: 'end' })
    expect(right).toEqual({ x: 310, y: 104, anchor: 'start' })
  })

  it('nudges labels down until no two on the same side overlap', () => {
    const labels = placeLabels([[300, 100], [302, 103], [301, 99], [305, 101]], [100, 100])
    expect(labels[0].y).toBe(104)
    for (const [i, a] of labels.entries()) {
      for (const b of labels.slice(i + 1)) expect(Math.abs(a.y - b.y)).toBeGreaterThanOrEqual(14)
    }
  })
})
