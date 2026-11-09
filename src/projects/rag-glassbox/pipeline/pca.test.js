import { describe, expect, it } from 'vitest'
import { fitPCA, project } from './pca'
import { fromBase64, row, toBase64 } from './vectors'

describe('fitPCA', () => {
  it('finds the axis of greatest variance first', () => {
    // Points spread widely along x, a little along y, not at all along z.
    const points = [
      [-10, -1, 0],
      [-5, 1, 0],
      [0, -1, 0],
      [5, 1, 0],
      [10, -1, 0],
    ]
    const pca = fitPCA(Float32Array.from(points.flat()), 3)
    const [first, second] = pca.components
    expect(Math.abs(first[0])).toBeCloseTo(1, 3)
    expect(Math.abs(second[1])).toBeCloseTo(1, 3)
    expect(Math.abs(first[0] * second[0] + first[1] * second[1] + first[2] * second[2])).toBeLessThan(1e-6)
  })

  it('projects a new vector onto the same axes', () => {
    const pca = fitPCA(Float32Array.from([-2, 0, 2, 0, 0, -1, 0, 1]), 2)
    const [x, y] = project([4, 0], pca)
    expect(Math.abs(x)).toBeCloseTo(4, 3)
    expect(y).toBeCloseTo(0, 3)
  })
})

describe('vector encoding', () => {
  it('round-trips Float32 vectors through base64', () => {
    const floats = Float32Array.from([0.5, -1.25, 3.75, 1e-7])
    expect(Array.from(fromBase64(toBase64(floats)))).toEqual(Array.from(floats))
  })

  it('reads one row of a flat matrix without copying', () => {
    const matrix = Float32Array.from([1, 2, 3, 4, 5, 6])
    expect(Array.from(row(matrix, 3, 1))).toEqual([4, 5, 6])
    expect(row(matrix, 3, 1).buffer).toBe(matrix.buffer)
  })
})
