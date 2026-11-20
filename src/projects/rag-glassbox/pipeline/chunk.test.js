import { describe, expect, it } from 'vitest'
import { chunkDocument, countWords, embeddingText, parseDocument, parseFrontmatter, splitSentences } from './chunk'

const DOC = `# Test Trail

## Route
One two three four five. Six seven eight nine ten. Eleven twelve thirteen fourteen fifteen.

## When to go
Sixteen seventeen eighteen nineteen twenty. Twenty-one twenty-two twenty-three twenty-four twenty-five.
`

describe('parseDocument', () => {
  it('reads the title and tags every sentence with its section', () => {
    const { title, sentences } = parseDocument(DOC)
    expect(title).toBe('Test Trail')
    expect(sentences).toHaveLength(5)
    expect(sentences[0]).toEqual({ section: 'Route', text: 'One two three four five.' })
    expect(sentences[4].section).toBe('When to go')
  })

  it('splits sentences without breaking numbers like 2,516 m', () => {
    expect(splitSentences('It climbs to 2,516 m. Then it drops.')).toEqual(['It climbs to 2,516 m.', 'Then it drops.'])
  })
})

describe('chunkDocument', () => {
  it('packs whole sentences up to the word budget', () => {
    const chunks = chunkDocument('t', DOC, { words: 10, overlap: 0 })
    expect(chunks.map((c) => c.words)).toEqual([10, 10, 5])
    expect(chunks.every((c) => /[.!?]$/.test(c.text))).toBe(true)
  })

  it('repeats trailing sentences as overlap and records how much text is repeated', () => {
    const chunks = chunkDocument('t', DOC, { words: 15, overlap: 5 })
    expect(chunks[0].text.endsWith('Eleven twelve thirteen fourteen fifteen.')).toBe(true)
    expect(chunks[1].text.startsWith('Eleven twelve thirteen fourteen fifteen.')).toBe(true)
    expect(chunks[1].overlapChars).toBe('Eleven twelve thirteen fourteen fifteen.'.length)
    expect(chunks[0].overlapChars).toBe(0)
  })

  it('always makes progress, even when a sentence is longer than the budget', () => {
    const chunks = chunkDocument('t', DOC, { words: 2, overlap: 10 })
    expect(chunks).toHaveLength(5)
  })

  it('keeps the sections a chunk spans and gives stable ids', () => {
    const chunks = chunkDocument('trail', DOC, { words: 100, overlap: 20 })
    expect(chunks).toHaveLength(1)
    expect(chunks[0].id).toBe('trail#1')
    expect(chunks[0].sections).toEqual(['Route', 'When to go'])
    expect(chunks[0].text).toContain('fifteen.\nSixteen')
  })

  it('never loses a sentence', () => {
    const all = parseDocument(DOC).sentences.map((s) => s.text)
    const chunks = chunkDocument('t', DOC, { words: 12, overlap: 6 })
    for (const sentence of all) expect(chunks.some((c) => c.text.includes(sentence))).toBe(true)
  })
})

describe('embeddingText', () => {
  it('prefixes the chunk with its document and section', () => {
    const [chunk] = chunkDocument('t', DOC, { words: 5, overlap: 0 })
    expect(embeddingText(chunk)).toBe('Test Trail · Route\nOne two three four five.')
    expect(countWords(embeddingText(chunk))).toBe(9)
  })
})

describe('frontmatter metadata', () => {
  const DOC_WITH_META = `---
type: hike
region: East
difficulty: Moderate
---
# Lion Mountain

## Route
Starts near the police station. It climbs a rocky spine.
`

  it('parses the frontmatter and keeps it out of the text', () => {
    const { meta, body } = parseFrontmatter(DOC_WITH_META)
    expect(meta).toEqual({ type: 'hike', region: 'East', difficulty: 'Moderate' })
    expect(body.startsWith('# Lion Mountain')).toBe(true)
  })

  it('attaches the metadata to every chunk and to the embedded header', () => {
    const [chunk] = chunkDocument('lion', DOC_WITH_META, { words: 100, overlap: 0 })
    expect(chunk).toMatchObject({ type: 'hike', region: 'East', difficulty: 'Moderate', title: 'Lion Mountain' })
    expect(chunk.text).not.toContain('region')
    expect(embeddingText(chunk)).toBe('Lion Mountain · Hike · East · Moderate · Route\nStarts near the police station. It climbs a rocky spine.')
  })

  it('treats a document without frontmatter as untyped', () => {
    expect(parseFrontmatter('# Title\n\nText.').meta).toEqual({})
  })
})

describe('line endings', () => {
  it('parses Windows (CRLF) files exactly like Unix ones', () => {
    const crlf = '---\r\ntype: hike\r\n---\r\n# Peak\r\n\r\n## Route\r\nUp. Down.\r\n'
    const lf = crlf.replaceAll('\r\n', '\n')
    const [fromCrlf] = chunkDocument('p', crlf, { words: 100, overlap: 0 })
    expect(fromCrlf).toEqual(chunkDocument('p', lf, { words: 100, overlap: 0 })[0])
    expect(fromCrlf.sections).toEqual(['Route'])
    expect(fromCrlf.text).toBe('Up. Down.')
  })
})
