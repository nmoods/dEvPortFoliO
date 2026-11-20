// Models often answer with a little Markdown (bold labels, bullet lists). This renders just that subset —
// paragraphs, "-"/"*" bullets and **bold** — as data, never as HTML, and keeps [n] citations clickable.
import { splitCitations } from './prompt.js'

const BULLET = /^\s*(?:[-*•]|\d+\.)\s+/

/** "**Safety** [2]" -> [{ type: 'text', value: 'Safety', bold: true }, { type: 'text', value: ' ' }, { type: 'cite', n: 2 }] */
export function inlineParts(text) {
  return text
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .flatMap((piece) => {
      const bold = piece.startsWith('**') && piece.endsWith('**') && piece.length > 4
      const inner = bold ? piece.slice(2, -2) : piece
      return splitCitations(inner).map((part) => (part.type === 'text' && bold ? { ...part, bold } : part))
    })
}

/** Answer text -> [{ type: 'p', parts } | { type: 'ul', items: [parts] }] */
export function formatAnswer(text) {
  const blocks = []
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trimEnd()
    if (!line.trim()) continue
    if (BULLET.test(line)) {
      const parts = inlineParts(line.replace(BULLET, ''))
      const last = blocks.at(-1)
      if (last?.type === 'ul') last.items.push(parts)
      else blocks.push({ type: 'ul', items: [parts] })
    } else {
      blocks.push({ type: 'p', parts: inlineParts(line.trim()) })
    }
  }
  return blocks
}
