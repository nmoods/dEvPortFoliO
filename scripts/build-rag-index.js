// Builds the RAG Glass Box index: markdown -> chunks -> embeddings -> 2D PCA map.
// Run with `npm run rag:index` whenever the corpus or the chunker changes; the output is committed,
// so neither Vercel nor the browser ever has to embed the corpus.
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { pipeline } from '@huggingface/transformers'
import { CHUNK_SIZES, chunkDocument, embeddingText } from '../src/projects/rag-glassbox/pipeline/chunk.js'
import { EMBEDDING_DIMS, EMBEDDING_DTYPE, EMBEDDING_MODEL, EMBEDDING_OPTIONS } from '../src/projects/rag-glassbox/pipeline/model.js'
import { fitPCA, project } from '../src/projects/rag-glassbox/pipeline/pca.js'
import { toBase64 } from '../src/projects/rag-glassbox/pipeline/vectors.js'

const dataDir = new URL('../src/projects/rag-glassbox/data/', import.meta.url)
const placesDir = new URL('places/', dataDir)
const round = (n, digits = 5) => Number(n.toFixed(digits))

const files = (await readdir(placesDir)).filter((f) => f.endsWith('.md')).sort()
const docs = await Promise.all(
  files.map(async (file) => ({ id: file.replace(/\.md$/, ''), markdown: await readFile(new URL(file, placesDir), 'utf8') }))
)

console.log(`Loading ${EMBEDDING_MODEL} (${EMBEDDING_DTYPE})…`)
const embed = await pipeline('feature-extraction', EMBEDDING_MODEL, { dtype: EMBEDDING_DTYPE })

const sizes = {}
for (const [size, config] of Object.entries(CHUNK_SIZES)) {
  const chunks = docs.flatMap((doc) => chunkDocument(doc.id, doc.markdown, config))
  const output = await embed(chunks.map(embeddingText), EMBEDDING_OPTIONS)
  const matrix = Float32Array.from(output.data)
  if (matrix.length !== chunks.length * EMBEDDING_DIMS) throw new Error(`Unexpected embedding shape ${output.dims}`)

  const pca = fitPCA(matrix, EMBEDDING_DIMS)
  const points = chunks.map((_, i) => project(matrix.subarray(i * EMBEDDING_DIMS, (i + 1) * EMBEDDING_DIMS), pca).map((n) => round(n, 4)))

  sizes[size] = { ...config, chunks }
  await writeFile(
    new URL(`vectors-${size}.json`, dataDir),
    JSON.stringify({
      dims: EMBEDDING_DIMS,
      count: chunks.length,
      vectors: toBase64(matrix),
      pca: { mean: pca.mean.map((n) => round(n)), components: pca.components.map((c) => c.map((n) => round(n))) },
      points,
    })
  )
  console.log(`${size.padEnd(6)} ${String(chunks.length).padStart(3)} chunks`)
}

await writeFile(
  new URL('chunks.json', dataDir),
  `${JSON.stringify({ model: EMBEDDING_MODEL, dtype: EMBEDDING_DTYPE, dims: EMBEDDING_DIMS, sizes }, null, 1)}\n`
)
console.log('Wrote chunks.json and vectors-*.json')
