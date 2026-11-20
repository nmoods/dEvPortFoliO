import { describe, expect, it } from 'vitest'
import { buildPrompt, splitCitations } from './prompt'
import { createSseParser, formatSse } from './sse'

const SOURCES = [
  {
    title: 'Le Pouce',
    type: 'hike',
    region: 'North & Port Louis',
    difficulty: 'Easy to moderate',
    sections: ['Overview'],
    text: 'About 812 m.',
  },
  { title: 'Trou aux Cerfs "crater"', type: 'training', region: 'Central Plateau', sections: ['Route', 'Conditions'], text: 'A 1 km loop.' },
]

describe('buildPrompt', () => {
  it('numbers the sources in retrieval order, with their metadata, and appends the question', () => {
    const { system, user } = buildPrompt('  How high is Le Pouce? ', SOURCES)
    expect(system).toMatch(/only the numbered sources/)
    expect(system).toMatch(/only cover hiking and training in Mauritius/)
    expect(user).toContain(
      '<source id="1" place="Le Pouce" type="Hike" region="North & Port Louis" difficulty="Easy to moderate" section="Overview">\nAbout 812 m.\n</source>'
    )
    // Missing metadata is left out rather than printed as "undefined"; quotes are escaped.
    expect(user).toContain(
      '<source id="2" place="Trou aux Cerfs &quot;crater&quot;" type="Training ground" region="Central Plateau" section="Route, Conditions">'
    )
    expect(user.endsWith('Question: How high is Le Pouce?')).toBe(true)
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
