import corpus from '../data/chunks.json'
import { buildBm25 } from './bm25'
import { embeddingText } from './chunk'
import { fromBase64 } from './vectors'

export const CORPUS = corpus

// Each chunk size is its own lazily-loaded file: only the one you look at is downloaded.
const vectorFiles = {
  small: () => import('../data/vectors-small.json'),
  medium: () => import('../data/vectors-medium.json'),
  large: () => import('../data/vectors-large.json'),
}

const cache = new Map()

/** Chunks + their embeddings + the PCA map + a BM25 index for one chunk size. */
export function loadIndex(size) {
  if (!cache.has(size)) {
    const promise = vectorFiles[size]().then(({ default: data }) => {
      const { chunks, words, overlap } = corpus.sizes[size]
      return {
        size,
        words,
        overlap,
        chunks,
        dims: data.dims,
        matrix: fromBase64(data.vectors),
        pca: data.pca,
        points: data.points,
        bm25: buildBm25(chunks.map(embeddingText)),
      }
    })
    promise.catch(() => cache.delete(size))
    cache.set(size, promise)
  }
  return cache.get(size)
}
