// Stage 4 of RAG: retrieval. No vector database, just arithmetic over a flat Float32Array.

export const RETRIEVAL_MODES = {
  vector: { label: 'Vector', hint: 'Meaning: cosine similarity between embeddings' },
  keyword: { label: 'Keyword', hint: 'Words: BM25 over the chunk text' },
  hybrid: { label: 'Hybrid', hint: 'Both rankings fused with Reciprocal Rank Fusion' },
}

/** Cosine similarity of `query` with every row. Vectors are unit length, so cosine = dot product. */
export function vectorScores(query, matrix, dims) {
  const count = matrix.length / dims
  const scores = new Array(count)
  for (let r = 0; r < count; r += 1) {
    let sum = 0
    const offset = r * dims
    for (let d = 0; d < dims; d += 1) sum += query[d] * matrix[offset + d]
    scores[r] = sum
  }
  return scores
}

/** Indices sorted by descending score (stable for ties). */
export const rankIndices = (scores) => scores.map((score, index) => ({ score, index })).sort((a, b) => b.score - a.score || a.index - b.index).map(({ index }) => index)

/**
 * Reciprocal Rank Fusion: score = Σ 1 / (k + rank). Uses positions, not raw scores, so a cosine of 0.6
 * and a BM25 of 7.2 can be combined without guessing how to normalise them.
 */
export function reciprocalRankFusion(rankings, k = 60) {
  const fused = new Map()
  for (const ranking of rankings) ranking.forEach((index, position) => fused.set(index, (fused.get(index) ?? 0) + 1 / (k + position + 1)))
  return fused
}

/**
 * @returns every chunk with its vector and keyword evidence, ordered by the chosen mode.
 * Results carry both signals so the UI can show *why* a chunk ranked where it did.
 */
export function retrieve({ mode, vector, keyword }) {
  const vectorRanking = rankIndices(vector)
  const keywordRanking = rankIndices(keyword)
  const vectorRank = new Map(vectorRanking.map((index, position) => [index, position + 1]))
  const keywordRank = new Map(keywordRanking.map((index, position) => [index, position + 1]))
  const fused = reciprocalRankFusion([vectorRanking, keywordRanking])

  const score = (index) => (mode === 'vector' ? vector[index] : mode === 'keyword' ? keyword[index] : fused.get(index))
  const order = mode === 'vector' ? vectorRanking : mode === 'keyword' ? keywordRanking : rankIndices(vector.map((_, i) => fused.get(i)))

  return order.map((index, position) => ({
    index,
    rank: position + 1,
    score: score(index),
    vectorScore: vector[index],
    vectorRank: vectorRank.get(index),
    // A chunk with no matching word has no meaningful keyword rank.
    keywordScore: keyword[index],
    keywordRank: keyword[index] > 0 ? keywordRank.get(index) : null,
  }))
}

/** Metadata filter: what to search in. `type` comes from each document's frontmatter. */
export const SCOPES = {
  all: { label: 'Everything', hint: 'Hikes and training grounds' },
  hike: { label: 'Hikes', hint: 'Only hiking guides' },
  training: { label: 'Training grounds', hint: 'Only training grounds and race prep' },
}

/** Keeps only chunks of the chosen type and renumbers their rank; vector/keyword ranks stay global as evidence. */
export function filterByType(ranked, chunks, type) {
  if (!type || type === 'all') return ranked
  return ranked.filter((result) => chunks[result.index].type === type).map((result, i) => ({ ...result, rank: i + 1 }))
}
