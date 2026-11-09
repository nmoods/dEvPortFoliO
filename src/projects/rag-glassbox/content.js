import { CORPUS } from './pipeline/loadIndex'

/** The 8 trails in a fixed order: slot i always gets categorical colour i, whatever chunk size is shown. */
export const TRAILS = [...new Map(CORPUS.sizes.large.chunks.map((chunk) => [chunk.docId, chunk.title])).entries()].map(
  ([id, title], slot) => ({ id, title, slot: slot + 1 })
)
export const trailSlot = Object.fromEntries(TRAILS.map((trail) => [trail.id, trail.slot]))

export const SAMPLE_QUESTIONS = [
  { question: 'Which trail crosses Corsica?', lesson: 'An easy hit: one trail mentions Corsica, and every retriever finds it.' },
  {
    question: 'How do I get the Compostela certificate?',
    lesson: 'A rare word ("Compostela") is perfect for keyword search; switch modes and compare.',
  },
  {
    question: 'Where can I soak in a hot spring?',
    lesson: 'Two trails have hot springs. Check whether Laugavegur makes the top k at each chunk size.',
  },
  { question: 'Do I need a permit?', lesson: 'Permits appear in several guides. Watch which ones fall just below the cut-off.' },
  {
    question: 'What is the best pizza in Naples?',
    lesson: 'Not in the corpus. Retrieval still returns *something*; the prompt must make the model say no.',
  },
]

export const STAGES = [
  { id: 'chunk', title: 'Chunk', body: 'Guides are split into overlapping pieces at build time.' },
  { id: 'embed', title: 'Embed', body: 'Your question becomes 384 numbers, in your browser.' },
  { id: 'retrieve', title: 'Retrieve', body: 'Every chunk is scored against the question; the top k are kept.' },
  { id: 'augment', title: 'Augment', body: 'The top chunks are pasted into the prompt as numbered sources.' },
  { id: 'generate', title: 'Generate', body: 'Claude answers from those sources only, citing them.' },
]

export const DECISIONS = [
  {
    title: 'Embeddings in the browser, index at build time',
    body: 'The corpus is embedded once by a Node script and committed; the question is embedded in a Web Worker with the same model (MiniLM, 384 dimensions). No vector database, no embedding API, no cost per query.',
  },
  {
    title: 'Retrieval as plain arithmetic',
    body: 'Cosine similarity is a dot product over a Float32Array. BM25 and Reciprocal Rank Fusion are ~60 lines each and unit-tested. At this scale a brute-force scan takes well under a millisecond.',
  },
  {
    title: 'Tuning never re-embeds',
    body: 'Chunk size, top-k and retrieval mode only change ranking. The question vector is reused, so every control updates instantly and costs nothing until you ask for a new answer.',
  },
  {
    title: 'A server that only accepts ids',
    body: 'The browser sends the question and chunk ids. The Vercel function rebuilds the prompt from the committed corpus, so the endpoint cannot be used as a general Claude proxy, and it is rate-limited per IP.',
  },
  {
    title: 'Grounding by prompt, verified by citations',
    body: 'Sources are numbered, the system prompt forbids outside knowledge, and every [n] in the streamed answer links back to the chunk that supports it.',
  },
]
