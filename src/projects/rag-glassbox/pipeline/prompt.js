// Stage 5 of RAG: augmentation. The retrieved chunks are pasted into the prompt as numbered sources.
// Shared by the browser (to *show* the prompt) and the server (to *send* it), so what you see is what Claude gets.

export const MAX_QUESTION_LENGTH = 300
export const MAX_SOURCES = 8

export const SYSTEM_PROMPT = `You answer questions about long-distance hiking trails for a demo of retrieval-augmented generation.

Use only the numbered sources in the user's message. They are excerpts from a small set of trail guides, retrieved because they looked relevant to the question; some may be irrelevant.

- Cite every claim with the number of the source that supports it, in square brackets: [1], or [2][3] for several.
- If the sources do not contain the answer, say that these trail guides don't cover it. Do not fill gaps with outside knowledge, even if you know the answer.
- Keep the answer under 120 words, in plain sentences without headings or bullet lists.`

const escapeAttribute = (value) => value.replaceAll('"', '&quot;')

export function formatSources(sources) {
  return sources
    .map(
      (source, i) =>
        `<source id="${i + 1}" trail="${escapeAttribute(source.title)}" section="${escapeAttribute(source.sections.join(', '))}">\n${source.text}\n</source>`
    )
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
