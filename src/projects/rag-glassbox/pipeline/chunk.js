// Stage 1 of RAG: cut documents into retrievable pieces.
// Structure-aware: sentences are never split, each one remembers its section heading,
// and consecutive chunks share a few trailing sentences (overlap) so a fact on a boundary survives whole.

export const CHUNK_SIZES = {
  small: { label: 'Small', words: 40, overlap: 10 },
  medium: { label: 'Medium', words: 100, overlap: 25 },
  large: { label: 'Large', words: 220, overlap: 50 },
}

export const countWords = (text) => text.split(/\s+/).filter(Boolean).length

export function splitSentences(paragraph) {
  return paragraph
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

/** Markdown with one `# Title` and `## Section` headings -> title + a flat list of tagged sentences. */
export function parseDocument(markdown) {
  let title = ''
  let section = ''
  const sentences = []
  for (const block of markdown.split(/\n\s*\n/)) {
    const text = block.trim()
    if (!text) continue
    const heading = /^(#{1,2})\s+(.*)$/.exec(text.split('\n')[0])
    if (heading) {
      if (heading[1] === '#') title = heading[2].trim()
      else section = heading[2].trim()
      const rest = text.split('\n').slice(1).join(' ').trim()
      if (rest) sentences.push(...splitSentences(rest).map((s) => ({ section, text: s })))
      continue
    }
    sentences.push(...splitSentences(text.replace(/\s*\n\s*/g, ' ')).map((s) => ({ section, text: s })))
  }
  return { title, sentences }
}

function joinSentences(sentences) {
  return sentences
    .map((sentence, i) => (i > 0 && sentence.section !== sentences[i - 1].section ? `\n${sentence.text}` : sentence.text))
    .join(' ')
    .replace(/ \n/g, '\n')
}

/**
 * Pack whole sentences until the chunk reaches `words`, then start the next chunk with the trailing
 * sentences of the previous one, as long as they fit inside `overlap` words.
 */
export function chunkDocument(docId, markdown, { words, overlap }) {
  const { title, sentences } = parseDocument(markdown)
  const chunks = []
  let start = 0

  while (start < sentences.length) {
    let end = start
    let size = 0
    while (end < sentences.length && (size === 0 || size + countWords(sentences[end].text) <= words)) {
      size += countWords(sentences[end].text)
      end += 1
    }

    const carried = chunks.length > 0 ? chunks.at(-1).nextOverlap : 0
    const members = sentences.slice(start, end)
    const text = joinSentences(members)
    const overlapText = carried > 0 ? joinSentences(members.slice(0, carried)) : ''

    // Decide how many of this chunk's last sentences the next chunk will repeat.
    let nextOverlap = 0
    let overlapWords = 0
    for (let i = end - 1; i > start + carried && end < sentences.length; i -= 1) {
      const w = countWords(sentences[i].text)
      if (overlapWords + w > overlap) break
      overlapWords += w
      nextOverlap += 1
    }

    chunks.push({
      id: `${docId}#${chunks.length + 1}`,
      docId,
      title,
      sections: [...new Set(members.map((s) => s.section).filter(Boolean))],
      text,
      words: countWords(text),
      overlapChars: overlapText.length,
      nextOverlap,
    })
    start = end - nextOverlap
  }

  return chunks.map(({ nextOverlap: _unused, ...chunk }) => chunk)
}

/** `gr20#3` -> `rag-chunk-gr20-3`, safe to use as an element id and in a selector. */
export const chunkDomId = (chunkId) => `rag-chunk-${chunkId.replace(/[^\w-]/g, '-')}`

/** The text that is actually embedded: a contextual header + the chunk, so "it opens in June" still says *what* opens. */
export const embeddingText = (chunk) => `${chunk.title} · ${chunk.sections.join(', ')}\n${chunk.text}`
