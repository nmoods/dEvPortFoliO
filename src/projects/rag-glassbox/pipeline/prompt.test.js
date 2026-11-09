import { describe, expect, it } from 'vitest'
import { buildPrompt, splitCitations } from './prompt'
import { createSseParser, formatSse } from './sse'

const SOURCES = [
  { title: 'GR20', sections: ['Overview'], text: 'Crosses Corsica.' },
  { title: 'Camino "Francés"', sections: ['Route', 'When to go'], text: 'Ends in Santiago.' },
]

describe('buildPrompt', () => {
  it('numbers the sources in retrieval order and appends the question', () => {
    const { system, user } = buildPrompt('  Which trail crosses Corsica? ', SOURCES)
    expect(system).toMatch(/only the numbered sources/)
    expect(user).toContain('<source id="1" trail="GR20" section="Overview">\nCrosses Corsica.\n</source>')
    expect(user).toContain('<source id="2" trail="Camino &quot;Francés&quot;" section="Route, When to go">')
    expect(user.endsWith('Question: Which trail crosses Corsica?')).toBe(true)
  })
})

describe('splitCitations', () => {
  it('separates text from [n] citations', () => {
    expect(splitCitations('Corsica [1][2]. Done')).toEqual([
      { type: 'text', value: 'Corsica ' },
      { type: 'cite', n: 1 },
      { type: 'cite', n: 2 },
      { type: 'text', value: '. Done' },
    ])
  })

  it('leaves text without citations alone', () => {
    expect(splitCitations('No sources cover this.')).toEqual([{ type: 'text', value: 'No sources cover this.' }])
  })
})

describe('SSE', () => {
  it('reassembles events split across network chunks', () => {
    const events = []
    const feed = createSseParser((event, data) => events.push([event, data]))
    const wire = formatSse('text', { text: 'Hel' }) + formatSse('text', { text: 'lo\n\nworld' }) + formatSse('done', {})
    for (let i = 0; i < wire.length; i += 7) feed(wire.slice(i, i + 7))
    expect(events).toEqual([
      ['text', { text: 'Hel' }],
      ['text', { text: 'lo\n\nworld' }],
      ['done', {}],
    ])
  })
})
