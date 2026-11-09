import { describe, expect, it } from 'vitest'
import { bm25Scores, buildBm25, idf, tokenize } from './bm25'
import { rankIndices, reciprocalRankFusion, retrieve, vectorScores } from './search'

describe('tokenize', () => {
  it('lowercases, strips accents and drops stopwords', () => {
    expect(tokenize('Which trail is the Camino Francés?')).toEqual(['trail', 'camino', 'frances'])
  })
})

describe('BM25', () => {
  const index = buildBm25(['Corsica granite ridge', 'Scotland loch and moor', 'Corsica Corsica beaches and towns far away from mountains'])

  it('gives rarer words a higher IDF', () => {
    expect(idf(index, 'loch')).toBeGreaterThan(idf(index, 'corsica'))
  })

  it('scores only chunks containing the words, favouring short focused ones', () => {
    const [ridge, loch, beaches] = bm25Scores(index, 'corsica ridge')
    expect(loch).toBe(0)
    expect(ridge).toBeGreaterThan(beaches)
  })
})

describe('vector search', () => {
  it('computes dot products against every row', () => {
    const matrix = Float32Array.from([1, 0, 0, 1, 0.6, 0.8])
    expect(vectorScores([1, 0], matrix, 2)).toEqual([1, 0, expect.closeTo(0.6, 5)])
  })

  it('ranks indices by descending score', () => {
    expect(rankIndices([0.2, 0.9, 0.5])).toEqual([1, 2, 0])
  })
})

describe('reciprocal rank fusion', () => {
  it('rewards documents ranked well by both lists', () => {
    const fused = reciprocalRankFusion([
      [0, 1, 2],
      [1, 2, 0],
    ])
    expect(fused.get(1)).toBeGreaterThan(fused.get(0))
    expect(fused.get(1)).toBeCloseTo(1 / 62 + 1 / 61, 10)
  })
})

describe('retrieve', () => {
  const vector = [0.9, 0.1, 0.95]
  const keyword = [0, 4, 3]

  it('orders by the chosen signal and keeps both ranks as evidence', () => {
    expect(retrieve({ mode: 'vector', vector, keyword }).map((r) => r.index)).toEqual([2, 0, 1])
    expect(retrieve({ mode: 'keyword', vector, keyword }).map((r) => r.index)).toEqual([1, 2, 0])
    const [top] = retrieve({ mode: 'hybrid', vector, keyword })
    expect(top).toMatchObject({ index: 2, rank: 1, vectorRank: 1, keywordRank: 2 })
  })

  it('fuses by position: 1st + 3rd narrowly beats 2nd + 2nd', () => {
    const fused = reciprocalRankFusion([
      [0, 2, 1],
      [1, 2, 0],
    ])
    expect(fused.get(0)).toBeGreaterThan(fused.get(2))
  })

  it('reports no keyword rank for chunks without a matching word', () => {
    const result = retrieve({ mode: 'vector', vector, keyword }).find((r) => r.index === 0)
    expect(result.keywordRank).toBeNull()
  })
})
