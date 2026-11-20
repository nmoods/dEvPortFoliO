/**
 * Regions in a fixed order: region i always gets categorical colour i (validated palette, see RagPage.css),
 * whatever chunk size or filter is shown. Colour follows the region, never its rank.
 */
export const REGIONS = ['North & Port Louis', 'Central Plateau', 'West', 'South', 'East', 'Island-wide'].map((name, i) => ({
  name,
  slot: i + 1,
}))
export const regionSlot = Object.fromEntries(REGIONS.map((region) => [region.name, region.slot]))
export const regionColor = (region) => `var(--trail-${regionSlot[region] ?? 6})`

export const SAMPLE_QUESTIONS = [
  {
    question: 'What is the highest mountain in Mauritius?',
    lesson: 'Retrieval brings back all the big peaks; the model has to compare 828, 820 and 812 m to answer.',
  },
  {
    question: 'Where can I do hill repeats near Tamarin?',
    lesson: 'Vector search confuses Tamarin with Tamarind Falls. Switch Retrieval to Keyword or Hybrid and compare.',
  },
  {
    question: 'An easy hike in the east for beginners?',
    lesson: 'The only mountain hike in the east is moderate to hard. A good answer says so and offers the closest fit.',
  },
  {
    question: 'How should I train for the Dodo Trail?',
    lesson: 'A training question: the answer has to combine several places into a plan. Try "Search in: Training grounds".',
  },
  {
    question: 'Is there a good hike on Réunion island?',
    lesson: 'Outside Mauritius. Retrieval still returns chunks, so the prompt is what makes the model decline.',
  },
  {
    question: 'Quel est le meilleur endroit pour courir à Curepipe ?',
    lesson: 'In French: the embedding model is English-only, so scores drop, but place names still match.',
  },
]

export const STAGES = [
  { id: 'chunk', title: 'Chunk', body: '16 Mauritius guides are split into overlapping pieces at build time.' },
  { id: 'embed', title: 'Embed', body: 'Your question becomes 384 numbers, in your browser.' },
  { id: 'retrieve', title: 'Retrieve', body: 'Every chunk is scored against the question; the top k are kept.' },
  { id: 'augment', title: 'Augment', body: 'The top chunks are pasted into the prompt as numbered sources.' },
  { id: 'generate', title: 'Generate', body: 'A free LLM answers from those sources only, citing them.' },
]

export const DECISIONS = [
  {
    title: 'A small, sourced corpus',
    body: '16 hand-written guides to Mauritius hikes and training grounds, each traced to its sources. Where sources disagree, the guide gives a range and says to check locally, because a RAG answer is only as good as the documents behind it.',
  },
  {
    title: 'Metadata as well as meaning',
    body: 'Each guide carries its type, region and difficulty. They are embedded with every chunk, written into each source tag of the prompt, and power the "Search in" filter, the same metadata filtering production RAG systems rely on.',
  },
  {
    title: 'Embeddings in the browser, index at build time',
    body: 'The corpus is embedded once by a Node script and committed; the question is embedded in a Web Worker with the same model (MiniLM, 384 dimensions). No vector database, no embedding API, no cost per query.',
  },
  {
    title: 'Retrieval as plain arithmetic',
    body: 'Cosine similarity is a dot product over a Float32Array. BM25 and Reciprocal Rank Fusion are ~60 lines each and unit-tested. Tuning never re-embeds: every control re-ranks from the same question vector.',
  },
  {
    title: 'Free models, no waiting',
    body: 'Answers come from free tiers: Groq first (three models, each with its own daily quota), Google Gemini Flash-Lite as backup. A provider that is rate-limited, failing or silent for 4 s is skipped before the visitor sees a word, and repeated questions are served from a cache.',
  },
  {
    title: 'A server that only accepts ids',
    body: 'The browser sends the question and chunk ids. The Vercel function rebuilds the prompt from the committed corpus, so the endpoint cannot be used as a general LLM proxy, and it is rate-limited per IP.',
  },
  {
    title: 'Grounded, scoped and multilingual',
    body: 'The system prompt makes the model answer the actual request, respect constraints like region or fitness, decline anything outside Mauritius, and reply in the language of the question, citing every claim.',
  },
]
