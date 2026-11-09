import { useEffect, useMemo, useState } from 'react'
import { bm25Scores } from '../pipeline/bm25'
import { loadIndex } from '../pipeline/loadIndex'
import { project } from '../pipeline/pca'
import { retrieve, vectorScores } from '../pipeline/search'

/** Pure: rank every chunk of `index` for an embedded question. */
export function computeRetrieval(index, query, { k, mode }) {
  const started = performance.now()
  const vector = vectorScores(query.vector, index.matrix, index.dims)
  const keyword = bm25Scores(index.bm25, query.question)
  const ranked = retrieve({ mode, vector, keyword })
  return {
    ranked,
    top: ranked.slice(0, k),
    nearMisses: ranked.slice(k, k + 3),
    queryPoint: project(query.vector, index.pca),
    searchMs: performance.now() - started,
  }
}

/**
 * The question is embedded once. Chunk size, top-k and retrieval mode only change *retrieval*,
 * so tuning re-ranks instantly from the stored question vector: no new embedding, no new API call.
 */
export function useRagQuery({ embed, size, k, mode }) {
  const [loaded, setLoaded] = useState(null)
  const [query, setQuery] = useState(null)
  const [embedding, setEmbedding] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let current = true
    loadIndex(size).then(
      (next) => current && setLoaded(next),
      (failure) => current && setError(failure.message)
    )
    return () => {
      current = false
    }
  }, [size])

  const index = loaded?.size === size ? loaded : null

  /** Embeds the question; resolves to the stored query, or null on failure. */
  async function ask(question) {
    setEmbedding(true)
    setError(null)
    try {
      const { vector, ms } = await embed(question)
      const next = { question, vector, embedMs: ms }
      setQuery(next)
      return next
    } catch (failure) {
      setError(failure.message)
      return null
    } finally {
      setEmbedding(false)
    }
  }

  const retrieval = useMemo(() => (query && index ? computeRetrieval(index, query, { k, mode }) : null), [query, index, k, mode])

  return { index, query, retrieval, embedding, error, ask }
}
