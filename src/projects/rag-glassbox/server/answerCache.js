// Most visitors click the sample questions, which always retrieve the same chunks. Caching those answers
// spends the free quota once instead of on every visit, and makes repeated questions instant.
// In memory per server instance: good enough for a demo; a shared store (e.g. Redis) would make it global.

export function createAnswerCache({ maxEntries = 200, ttlMs = 24 * 60 * 60 * 1000, now = Date.now } = {}) {
  const entries = new Map()

  const keyOf = ({ question, chunkIds }) => JSON.stringify([question.trim().toLowerCase().replace(/\s+/g, ' '), chunkIds])

  return {
    get(request) {
      const key = keyOf(request)
      const entry = entries.get(key)
      if (!entry) return null
      if (now() - entry.storedAt > ttlMs) {
        entries.delete(key)
        return null
      }
      // Refresh recency (Map keeps insertion order, so re-inserting moves it to the end).
      entries.delete(key)
      entries.set(key, entry)
      return entry.value
    },
    set(request, value) {
      const key = keyOf(request)
      entries.delete(key)
      entries.set(key, { value, storedAt: now() })
      while (entries.size > maxEntries) entries.delete(entries.keys().next().value)
    },
    get size() {
      return entries.size
    },
  }
}
