// Stage 5 of RAG: augmentation. The retrieved chunks are pasted into the prompt as numbered sources.
// Shared by the browser (to *show* the prompt) and the server (to *send* it), so what you see is what the model gets.

export const MAX_QUESTION_LENGTH = 300
export const MAX_SOURCES = 8

export const SYSTEM_PROMPT = `You are a local guide to hiking and running in Mauritius, answering in a demo of retrieval-augmented generation.

Use only the numbered sources in the user's message. They are excerpts from a small set of Mauritius guides, about hikes and about training grounds for running and trail running, retrieved because they looked relevant to the question; some may be irrelevant.

- Work out what the person is asking for: a hike to do, a place to train, a comparison, practical details (start, duration, difficulty, guide, season) or a training plan. Answer that request, not a summary of the sources.
- Respect every constraint they give, such as region, difficulty, fitness level or time available. If no source fits a constraint, say so plainly and suggest the closest option the sources do support.
- Cite every claim with the number of the source that supports it, in square brackets: [1], or [2][3] for several.
- Mention the safety points the sources give when they matter for the request, such as weather, guides, opening rules, water and daylight.
- If the question is not about Mauritius, or the sources do not contain the answer, say that these guides only cover hiking and training in Mauritius and cannot answer it. Do not fill gaps with outside knowledge, even if you know the answer.
- Reply in the language the question is written in.
- Keep the answer under 150 words, in plain sentences. Use a short list only when comparing several places.`

const escapeAttribute = (value) => value.replaceAll('"', '&quot;')

const TYPE_LABELS = { hike: 'Hike', training: 'Training ground' }

/** Metadata goes in the tag, so the model can match "easy", "east" or "training" without it being in the prose. */
export function formatSources(sources) {
  return sources
    .map((source, i) => {
      const attributes = [
        ['id', String(i + 1)],
        ['place', source.title],
        ['type', TYPE_LABELS[source.type]],
        ['region', source.region],
        ['difficulty', source.difficulty],
        ['section', source.sections.join(', ')],
      ]
        .filter(([, value]) => value)
        .map(([key, value]) => `${key}="${escapeAttribute(value)}"`)
        .join(' ')
      return `<source ${attributes}>\n${source.text}\n</source>`
    })
    .join('\n')
}

export function buildPrompt(question, sources) {
  return {
    system: SYSTEM_PROMPT,
    user: `<sources>\n${formatSources(sources)}\n</sources>\n\nQuestion: ${question.trim()}`,
  }
}

/** "Snow lingers [1][3]." -> text and citation parts, so the UI can turn [n] into links to source n. */
export function splitCitations(text) {
  const parts = []
  let last = 0
  for (const match of text.matchAll(/\[(\d{1,2})\]/g)) {
    if (match.index > last) parts.push({ type: 'text', value: text.slice(last, match.index) })
    parts.push({ type: 'cite', n: Number(match[1]) })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) })
  return parts
}
