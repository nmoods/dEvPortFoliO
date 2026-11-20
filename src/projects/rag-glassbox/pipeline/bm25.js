// BM25: the keyword ranking behind classic search engines. A chunk scores well when it contains the
// question's words, rare words count for more (IDF), repeats saturate (k1), long chunks are penalised (b).

const STOPWORDS = new Set(
  'a an and are as at be by can do does for from has have how i in is it its of on or the there this to was what when where which who why will with you your'.split(
    ' '
  )
)

/** Lowercase, strip accents (Francés -> frances), split on anything that is not a letter or digit. */
export function tokenize(text) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token))
}

export function buildBm25(texts, { k1 = 1.2, b = 0.75 } = {}) {
  const docs = texts.map((text) => {
    const tf = new Map()
    const tokens = tokenize(text)
    for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1)
    return { tf, length: tokens.length }
  })
  const df = new Map()
  for (const { tf } of docs) for (const token of tf.keys()) df.set(token, (df.get(token) ?? 0) + 1)
  const avgLength = docs.reduce((sum, d) => sum + d.length, 0) / (docs.length || 1)
  return { docs, df, avgLength, k1, b }
}

export function idf(index, token) {
  const n = index.df.get(token) ?? 0
  return Math.log(1 + (index.docs.length - n + 0.5) / (n + 0.5))
}

export function bm25Scores(index, query) {
  const terms = [...new Set(tokenize(query))]
  return index.docs.map(({ tf, length }) => {
    let score = 0
    for (const term of terms) {
      const f = tf.get(term)
      if (!f) continue
      score += (idf(index, term) * f * (index.k1 + 1)) / (f + index.k1 * (1 - index.b + (index.b * length) / index.avgLength))
    }
    return score
  })
}
